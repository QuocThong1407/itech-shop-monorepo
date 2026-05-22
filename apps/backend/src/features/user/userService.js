// backend/src/features/user/userService.js
const { supabase, supabaseAdmin } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const getAllUsers = async ({ page = 1, limit = 10, role, search }) => {
  let query = supabase
    .from("User")
    .select(
      "id, username, email, role, emailVerified, isOAuth, createdAt, updatedAt",
      { count: "exact" }
    );
  if (role) {
    query = query.eq("role", role);
  }
  if (search) {
    query = query.or(
      "username.ilike." +
        "%" +
        search +
        "%" +
        ",email.ilike." +
        "%" +
        search +
        "%"
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("createdAt", { ascending: false });
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    users: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getUserById = async (userId) => {
  const { data: user, error } = await supabase
    .from("User")
    .select(
      "id, username, email, role, emailVerified, isOAuth, createdAt, updatedAt"
    )
    .eq("id", userId)
    .single();
  if (error) throw error;
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

const createUser = async ({ username, email, password, role }) => {
  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`);

  if (existing?.length) {
    throw { status: 400, message: "Email or username already exists" };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // tự động xác nhận email
  });

  if (error) throw { status: 400, message: error.message };

  const authUser = data.user;
  const now = new Date().toISOString();

  // Insert vào bảng User
  const { data: user, error: userError } = await supabase
    .from("User")
    .insert({
      id: authUser.id,
      username,
      email,
      role,
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (userError) throw userError;

  if (role === "CUSTOMER") {
    const customerId = uuidv4();

    const { error: customerError } = await supabase.from("Customer").insert({
      id: customerId,
      userId: authUser.id,
      createdAt: now,
      updatedAt: now,
    });
    if (customerError) throw customerError;

    const { error: cartError } = await supabase.from("Cart").insert({
      id: uuidv4(),
      customerId,
      createdAt: now,
      updatedAt: now,
    });
    if (cartError) throw cartError;

    const { error: membershipError } = await supabase
      .from("Membership")
      .insert({
        id: uuidv4(),
        customerId,
        membership: "BRONZE",
        spent: 0,
        createdAt: now,
        updatedAt: now,
      });
    if (membershipError) throw membershipError;
  }

  if (role === "SELLER") {
    const { error: sellerError } = await supabase.from("Seller").insert({
      id: uuidv4(),
      userId: authUser.id,
      email,
      createdAt: now,
      updatedAt: now,
    });
    if (sellerError) throw sellerError;
  }

  if (role === "ADMIN") {
    const { error: adminError } = await supabase.from("Admin").insert({
      id: uuidv4(),
      userId: authUser.id,
      createdAt: now,
      updatedAt: now,
    });
    if (adminError) throw adminError;
  }

  return user;
};

const updateUser = async (userId, { username, email, role }) => {
  const { data: existingUser, error: getUserError } = await supabase
    .from("User")
    .select("id, username, email, role")
    .eq("id", userId)
    .single();
  if (getUserError) throw getUserError;
  if (!existingUser) throw { status: 404, message: "User not found" };

  const oldRole = existingUser.role;

  const updateData = { updatedAt: new Date() };
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (role) updateData.role = role;

  const { data, error } = await supabase
    .from("User")
    .update(updateData)
    .eq("id", userId)
    .select("id, username, email, role, updatedAt")
    .single();
  if (error) throw error;

  // nếu role thay đổi
  if (role && role !== oldRole) {
    if (oldRole === "CUSTOMER") {
      const { data: customer } = await supabase
        .from("Customer")
        .select("id")
        .eq("userId", userId)
        .single();
      if (customer) {
        await supabase.from("Cart").delete().eq("customerId", customer.id);
        await supabase
          .from("Membership")
          .delete()
          .eq("customerId", customer.id);
        await supabase.from("Customer").delete().eq("id", customer.id);
      }
    } else if (oldRole === "SELLER") {
      await supabase.from("Seller").delete().eq("userId", userId);
    } else if (oldRole === "ADMIN") {
      await supabase.from("Admin").delete().eq("userId", userId);
    }

    if (role === "CUSTOMER") {
      const customerId = uuidv4();
      await supabase.from("Customer").insert({
        id: customerId,
        userId,
      });
      await supabase.from("Cart").insert({
        id: uuidv4(),
        customerId,
      });
      await supabase.from("Membership").insert({
        id: uuidv4(),
        customerId,
        membership: "BRONZE",
        spent: 0,
      });
    } else if (role === "SELLER") {
      await supabase.from("Seller").insert({
        id: uuidv4(),
        userId,
        email: data.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (role === "ADMIN") {
      await supabase.from("Admin").insert({
        id: uuidv4(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return data;
};

const deleteUser = async (userId) => {
  const { data: user } = await supabase
    .from("User")
    .select("role")
    .eq("id", userId)
    .single();
  if (!user) throw { status: 404, message: "User not found" };
  if (user.role === "CUSTOMER") {
    const { data: customer } = await supabase
      .from("Customer")
      .select("id")
      .eq("userId", userId)
      .single();
    if (customer) {
      await supabase.from("Cart").delete().eq("customerId", customer.id);
      await supabase.from("Membership").delete().eq("customerId", customer.id);
      await supabase.from("Customer").delete().eq("id", customer.id);
    }
  } else if (user.role === "SELLER") {
    await supabase.from("Seller").delete().eq("userId", userId);
  } else if (user.role === "ADMIN") {
    await supabase.from("Admin").delete().eq("userId", userId);
  }
  const { error } = await supabase.from("User").delete().eq("id", userId);
  if (error) throw error;
  await supabaseAdmin.auth.admin.deleteUser(userId);
  return true;
};

const getUserStats = async () => {
  const { data: users } = await supabase.from("User").select("role");
  const stats = {
    total: users ? users.length : 0,
    customers: users ? users.filter((u) => u.role === "CUSTOMER").length : 0,
    sellers: users ? users.filter((u) => u.role === "SELLER").length : 0,
    admins: users ? users.filter((u) => u.role === "ADMIN").length : 0,
  };
  return stats;
};

const updateMe = async (userId, { username }) => {
  const { data, error } = await supabase
    .from("User")
    .update({
      username,
      updatedAt: new Date(),
    })
    .eq("id", userId)
    .select("id, username, email, role, updatedAt")
    .single();

  if (error) throw error;
  return data;
};

const getPfp = async (userId) => {
  // Image is stored in Customer table, not User table
  const { data: customer, error } = await supabase
    .from("Customer")
    .select("image")
    .eq("userId", userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
  return { image: customer?.image || null };
};

const uploadPfp = async (userId, file) => {
  const { uploadImageToSupabase, deleteImageFromSupabase } = require("../../utils/uploadHelper");
  
  // Get customer record
  const { data: customer, error: customerError } = await supabase
    .from("Customer")
    .select("id, image")
    .eq("userId", userId)
    .single();

  if (customerError) throw { status: 404, message: "Customer profile not found" };

  // Delete old image if exists
  if (customer?.image) {
    await deleteImageFromSupabase(customer.image, "avatars");
  }

  // Upload new image
  const imageUrl = await uploadImageToSupabase(file, "avatars", "pfp/");

  // Update customer with new image URL
  const { data, error } = await supabase
    .from("Customer")
    .update({
      image: imageUrl,
      updatedAt: new Date(),
    })
    .eq("id", customer.id)
    .select("image")
    .single();

  if (error) throw error;
  return { image: data.image };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateMe,
  getPfp,
  uploadPfp,
};
