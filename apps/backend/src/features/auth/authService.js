const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const register = async ({
  username,
  email,
  password,
  password_confirmation,
}) => {
  if (password !== password_confirmation) {
    throw { status: 400, message: "Passwords do not match" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.EMAIL_VERIFICATION_REDIRECT_URL,
      data: { username },
    },
  });

  if (error || !data?.user) {
    throw {
      status: 400,
      message: "Email already registered or invalid",
    };
  }

  return {
    message: "Please verify your email to complete registration",
  };
};

const completeProfile = async (authUser) => {
  const now = new Date().toISOString();

  const { data: existing, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existing) return existing;

  const username = authUser.user_metadata?.username;

  const { error: userError } = await supabaseAdmin.from("User").insert({
    id: authUser.id,
    username,
    email: authUser.email,
    emailVerified: authUser.email_confirmed_at
      ? new Date(authUser.email_confirmed_at)
      : null,
    role: "CUSTOMER",
    createdAt: now,
    updatedAt: now,
  });

  if (userError) throw userError;

  const customerId = uuidv4();

  await supabaseAdmin.from("Customer").insert({
    id: customerId,
    userId: authUser.id,
    createdAt: now,
    updatedAt: now,
  });

  await supabaseAdmin.from("Cart").insert({
    id: uuidv4(),
    customerId,
    createdAt: now,
    updatedAt: now,
  });

  await supabaseAdmin.from("Membership").insert({
    id: uuidv4(),
    customerId,
    membership: "BRONZE",
    spent: 0,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true };
};

const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const authUser = data.user;
  const session = data.session;

  if (!authUser.email_confirmed_at) {
    throw {
      status: 403,
      message: "Please verify your email before logging in",
    };
  }
  let { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!user) {
    await completeProfile(authUser);

    const res = await supabase
      .from("User")
      .select("*")
      .eq("id", authUser.id)
      .single();

    user = res.data;
  }

  return {
    accessToken: session.access_token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

const logout = async (accessToken) => {
  await supabase.auth.signOut({
    accessToken,
  });
};

const forgotPassword = async (email) => {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.RESET_PASSWORD_REDIRECT_URL,
  });
  return true;
};

const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw { status: 400, message: "Token and newPassword are required" };
  }

  // Set the session using the access token from the recovery flow
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: token, // For recovery flow, access_token can be used
  });

  if (sessionError) {
    throw { status: 400, message: sessionError.message };
  }

  // Now update the user's password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw { status: 400, message: error.message };
  }

  return data;
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  completeProfile,
};
