// backend/src/features/address/addressService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

// tất cả địa chỉ của một customer
const getAddressesByCustomer = async (customerId) => {
  const { data, error } = await supabase
    .from("Address")
    .select(
      "id, phoneNumber, address, street, ward, district, province, createdAt, updatedAt"
    )
    .eq("customerId", customerId)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return data || [];
};

// chi tiết một địa chỉ
const getAddressById = async (addressId, customerId) => {
  const { data, error } = await supabase
    .from("Address")
    .select(
      "id, phoneNumber, address, street, ward, district, province, createdAt, updatedAt"
    )
    .eq("id", addressId)
    .eq("customerId", customerId)
    .maybeSingle();

  if (error) {
    error.status = 404;
    throw error;
  }

  return data;
};

// tạo địa chỉ mới
const createAddress = async ({
  customerId,
  phoneNumber,
  address,
  street,
  ward,
  district,
  province,
}) => {
  // kiểm tra customer tồn tại
  const { data: customer, error: customerError } = await supabase
    .from("Customer")
    .select("id")
    .eq("id", customerId)
    .maybeSingle();
  if (customerError) throw customerError;
  if (!customer) {
    throw { status: 404, message: "Customer not found" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("Address")
    .insert({
      id: uuidv4(),
      customerId,
      phoneNumber,
      address,
      street,
      ward,
      district,
      province,
      createdAt: now,
      updatedAt: now,
    })
    .select(
      "id, phoneNumber, address, street, ward, district, province, createdAt, updatedAt"
    )
    .single();

  if (error) throw error;

  return data;
};

// cập nhật địa chỉ
const updateAddress = async (addressId, customerId, updates) => {
  // kiểm tra địa chỉ có tồn tại và thuộc về customer này
  const { data: existingAddress, error } = await supabase
    .from("Address")
    .select("id")
    .eq("id", addressId)
    .eq("customerId", customerId)
    .maybeSingle();

  if (error) throw error;
  if (!existingAddress) {
    throw {
      status: 404,
      message: "Address not found or you don't have permission",
    };
  }
  const ALLOWED_UPDATE_FIELDS = [
    "phoneNumber",
    "address",
    "street",
    "ward",
    "district",
    "province",
  ];

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      ALLOWED_UPDATE_FIELDS.includes(key)
    )
  );

  const { data, error: updateError } = await supabase
    .from("Address")
    .update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", addressId)
    .select(
      "id, phoneNumber, address, street, ward, district, province, createdAt, updatedAt"
    )
    .single();

  if (updateError) throw updateError;

  return data;
};

// xóa địa chỉ
const deleteAddress = async (addressId, customerId) => {
  // kiểm tra địa chỉ có tồn tại và thuộc về customer này
  const { data: address, error } = await supabase
    .from("Address")
    .select("id")
    .eq("id", addressId)
    .eq("customerId", customerId)
    .maybeSingle();

  if (error) throw error;
  if (!address) {
    throw {
      status: 404,
      message: "Address not found or you don't have permission",
    };
  }

  // kiểm tra xem địa chỉ có đang được sử dụng trong đơn hàng nào k
  const { data: orders } = await supabase
    .from("Order")
    .select("id")
    .eq("addressId", addressId)
    .limit(1);

  if (orders?.length) {
    throw {
      status: 400,
      message: "Cannot delete address that is associated with orders",
    };
  }

  const { error: deleteError } = await supabase
    .from("Address")
    .delete()
    .eq("id", addressId);

  if (deleteError) throw deleteError;

  return true;
};

module.exports = {
  getAddressesByCustomer,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
