const authService = require("./authService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

const register = async (req, res) => {
  try {
    const { username, email, password, password_confirmation } = req.body;

    if (!username || !email || !password || !password_confirmation) {
      return errorResponse(res, 400, "Missing required fields");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(res, 400, "Invalid email format");
    }

    if (password.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters");
    }

    const result = await authService.register({
      username,
      email,
      password,
      password_confirmation,
    });
    successResponse(
      res,
      201,
      result,
      "Registration successful. Please verify your email.",
    );
  } catch (err) {
    errorResponse(res, err.status || 500, err.message || "Registration failed");
  }
};
const completeProfile = async (req, res) => {
  try {
    const authUser = req.user;

    const result = await authService.completeProfile(authUser);

    successResponse(res, 201, result, "Profile created successfully");
  } catch (err) {
    errorResponse(
      res,
      err.status || 500,
      err.message || "Failed to complete profile",
    );
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    const result = await authService.login({ email, password });

    // Set access token as httpOnly, Secure cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // true in production
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data only, not the token
    successResponse(res, 200, { user: result.user, accessToken: result.accessToken }, "Login successful");
  } catch (err) {
    errorResponse(res, err.status || 401, err.message || "Login failed");
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return errorResponse(res, 401, "Access token required");
    }

    await authService.logout(token);
    
    // Clear the httpOnly cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    successResponse(res, 200, null, "Logout successful");
  } catch {
    errorResponse(res, 500, "Logout failed");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    await authService.forgotPassword(email);
    successResponse(
      res,
      200,
      null,
      "If the email exists, a reset link has been sent",
    );
  } catch {
    errorResponse(res, 500, "Failed to process password reset");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword({ token, newPassword });
    successResponse(res, 200, result, "Password has been reset successfully");
  } catch (err) {
    errorResponse(
      res,
      err.status || 500,
      err.message || "Failed to reset password",
    );
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  completeProfile,
};
