// backend/src/features/cart/cartService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const getMyCart = async (userId) => {
  const { data: customer, error: customerError } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (customerError || !customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const { data: cart, error: cartError } = await supabase
    .from("Cart")
    .select(
      `
      id,
      customerId,
      createdAt,
      updatedAt,
      CartItem(
        id,
        quantity,
        createdAt,
        updatedAt,
        ProductVariant!CartItem_productVariantId_fkey(
          id,
          quantity,
          variantAttributes,
          images,
          priceAdjustment,
          Product!ProductVariant_productId_fkey(
            id,
            name,
            description,
            price,
            images,
            stockQuantity,
            is_deleted,
            Category!Product_categoryId_fkey(
              id,
              name
            )
          )
        )
      )
    `
    )
    .eq("customerId", customer.id)
    .single();

  if (cartError) throw cartError;
  if (!cart) throw { status: 404, message: "Cart not found" };
  //lọc bỏ các sản phẩm đã bị xóa
  const validItems = cart.CartItem.filter(
    (item) => !item.ProductVariant.Product.is_deleted
  );
  // tính tổng số lượng và tổng giá tiền
  const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = validItems.reduce((sum, item) => {
    const basePrice = item.ProductVariant.Product.price;
    const adjustment = item.ProductVariant.priceAdjustment;
    const finalPrice = basePrice + adjustment;
    return sum + finalPrice * item.quantity;
  }, 0);

  return {
    id: cart.id,
    customerId: cart.customerId,
    items: validItems,
    totalItems,
    totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const addCartItem = async (userId, { productVariantId, quantity }) => {
  const { data: customer } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const { data: cart } = await supabase
    .from("Cart")
    .select("id")
    .eq("customerId", customer.id)
    .single();

  if (!cart) {
    throw { status: 404, message: "Cart not found" };
  }

  const { data: variant } = await supabase
    .from("ProductVariant")
    .select(
      `
      id,
      quantity,
      Product!ProductVariant_productId_fkey(
        id,
        is_deleted,
        stockQuantity
      )
    `
    )
    .eq("id", productVariantId)
    .single();

  if (!variant) {
    throw { status: 404, message: "Product variant not found" };
  }

  if (variant.Product.is_deleted) {
    throw { status: 400, message: "Product is no longer available" };
  }
  //vượt quá tồn kho
  if (variant.quantity < quantity) {
    throw {
      status: 400,
      message: `Only ${variant.quantity} items available in stock`,
    };
  }

  const { data: existingItem } = await supabase
    .from("CartItem")
    .select("id, quantity")
    .eq("cartId", cart.id)
    .eq("productVariantId", productVariantId)
    .single();

  const now = new Date().toISOString();

  if (existingItem) {
    //cộng dồn
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > variant.quantity) {
      throw {
        status: 400,
        message: `Cannot add more. Only ${variant.quantity} items available`,
      };
    }

    const { data, error } = await supabase
      .from("CartItem")
      .update({
        quantity: newQuantity,
        updatedAt: now,
      })
      .eq("id", existingItem.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("Cart").update({ updatedAt: now }).eq("id", cart.id);

    return data;
  } else {
    const { data, error } = await supabase
      .from("CartItem")
      .insert({
        id: uuidv4(),
        cartId: cart.id,
        productVariantId,
        quantity,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("Cart").update({ updatedAt: now }).eq("id", cart.id);

    return data;
  }
};

const updateCartItem = async (userId, itemId, { quantity }) => {
  const { data: customer } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const { data: cart } = await supabase
    .from("Cart")
    .select("id")
    .eq("customerId", customer.id)
    .single();

  if (!cart) {
    throw { status: 404, message: "Cart not found" };
  }

  const { data: cartItem } = await supabase
    .from("CartItem")
    .select(
      `
      id,
      cartId,
      ProductVariant!CartItem_productVariantId_fkey(
        id,
        quantity
      )
    `
    )
    .eq("id", itemId)
    .single();

  if (!cartItem) {
    throw { status: 404, message: "Cart item not found" };
  }

  if (cartItem.cartId !== cart.id) {
    throw { status: 403, message: "This item does not belong to your cart" };
  }
  //vuọt tồn kho
  if (quantity > cartItem.ProductVariant.quantity) {
    throw {
      status: 400,
      message: `Only ${cartItem.ProductVariant.quantity} items available`,
    };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("CartItem")
    .update({
      quantity,
      updatedAt: now,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("Cart").update({ updatedAt: now }).eq("id", cart.id);

  return data;
};

const deleteCartItem = async (userId, itemId) => {
  const { data: customer } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const { data: cart } = await supabase
    .from("Cart")
    .select("id")
    .eq("customerId", customer.id)
    .single();

  if (!cart) {
    throw { status: 404, message: "Cart not found" };
  }

  const { data: cartItem } = await supabase
    .from("CartItem")
    .select("id, cartId")
    .eq("id", itemId)
    .single();

  if (!cartItem) {
    throw { status: 404, message: "Cart item not found" };
  }

  if (cartItem.cartId !== cart.id) {
    throw { status: 403, message: "This item does not belong to your cart" };
  }

  const { error } = await supabase.from("CartItem").delete().eq("id", itemId);

  if (error) throw error;

  await supabase
    .from("Cart")
    .update({ updatedAt: new Date().toISOString() })
    .eq("id", cart.id);

  return true;
};

const clearCart = async (userId) => {
  const { data: customer } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const { data: cart } = await supabase
    .from("Cart")
    .select("id")
    .eq("customerId", customer.id)
    .single();

  if (!cart) {
    throw { status: 404, message: "Cart not found" };
  }

  const { error } = await supabase
    .from("CartItem")
    .delete()
    .eq("cartId", cart.id);

  if (error) throw error;

  await supabase
    .from("Cart")
    .update({ updatedAt: new Date().toISOString() })
    .eq("id", cart.id);

  return true;
};

module.exports = {
  getMyCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
