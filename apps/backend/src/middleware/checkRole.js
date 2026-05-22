// backend/src/middleware/checkRole.js
const { errorResponse } = require("../utils/responseHelpers");
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        "You do not have permission to access this resource"
      );
    }
    next();
  };
};
module.exports = { checkRole };
