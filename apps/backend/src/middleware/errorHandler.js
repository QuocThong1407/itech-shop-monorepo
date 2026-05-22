// backend/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  if (err.code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
  }
  if (err.code === "23503") {
    statusCode = 400;
    message = "Invalid reference to related resource";
  }
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};
module.exports = {
  errorHandler,
  notFoundHandler,
};
