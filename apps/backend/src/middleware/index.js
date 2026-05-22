// backend/src/middleware/index.js
const { authenticate } = require("./authenticate");
const { checkRole } = require("./checkRole");
const { errorHandler, notFoundHandler } = require("./errorHandler");
const upload = require("./upload");
module.exports = {
  authenticate,
  checkRole,
  errorHandler,
  notFoundHandler,
  upload,
};
