const { createClient } = require("@supabase/supabase-js");
const { errorResponse } = require("../utils/responseHelpers");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return errorResponse(res, 401, "No token provided");
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return errorResponse(res, 401, "Invalid token");
    }

    const { data: userDb, error: userError } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userDb) {
      return errorResponse(res, 500, "Failed to fetch user role");
    }

    const { data: customer, error: customerError } = await supabase
      .from("Customer")
      .select("id")
      .eq("userId", user.id)
      .maybeSingle();

    if (customerError) {
      return errorResponse(res, 500, "Failed to fetch customer profile");
    }
    const { data: seller, error: sellerError } = await supabase
      .from("Seller")
      .select("id")
      .eq("userId", user.id)
      .maybeSingle();

    if (sellerError) {
      return errorResponse(res, 500, "Failed to fetch seller profile");
    }

    req.user = {
      id: user.id,
      userId: user.id,
      customerId: customer?.id || null,
      sellerId: seller?.id || null,
      role: userDb.role,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error("Supabase auth error:", err);
    return errorResponse(res, 401, "Authentication failed");
  }
};

module.exports = { authenticate };
