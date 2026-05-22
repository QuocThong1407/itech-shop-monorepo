// backend/src/utils/responseHelpers.js
const successResponse = (res, statusCode = 200, data, message = "Success") => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};
const errorResponse = (
  res,
  statusCode = 500,
  message = "Error",
  errors = null
) => {
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
  });
};
module.exports = {
  successResponse,
  errorResponse,
};
