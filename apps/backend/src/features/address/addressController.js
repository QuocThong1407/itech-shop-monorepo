// backend/src/features/address/addressController.js
const addressService = require("./addressService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

// lấy tất cả địa chỉ của mình
const getMyAddresses = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    if (!customerId) {
      return errorResponse(res, 403, "Customer profile not found");
    }

    const addresses = await addressService.getAddressesByCustomer(customerId);
    successResponse(res, 200, addresses);
  } catch (error) {
    console.error("Get my addresses error:", error);
    errorResponse(res, 500, error.message || "Failed to get addresses");
  }
};

// lấy chi tiết một địa chỉ
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    if (!customerId) {
      return errorResponse(res, 403, "Customer profile not found");
    }

    const address = await addressService.getAddressById(id, customerId);
    successResponse(res, 200, address);
  } catch (error) {
    console.error("Get address error:", error);
    const statusCode = error.status || 500;
    errorResponse(res, statusCode, error.message || "Address not found");
  }
};

// tạo địa chỉ mới
const createAddress = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    if (!customerId) {
      return errorResponse(res, 403, "Customer profile not found");
    }

    const { phoneNumber, address, street, ward, district, province } = req.body;

    // validate sdt, đc
    if (!phoneNumber || !address) {
      return errorResponse(res, 400, "Phone number and address are required");
    }

    const result = await addressService.createAddress({
      customerId,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      street: street?.trim() || null,
      ward: ward?.trim() || null,
      district: district?.trim() || null,
      province: province?.trim() || null,
    });

    successResponse(res, 201, result, "Address created successfully");
  } catch (error) {
    console.error("Create address error:", error);
    errorResponse(res, 400, error.message || "Failed to create address");
  }
};

// customer cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    if (!customerId) {
      return errorResponse(res, 403, "Customer profile not found");
    }
    const updates = req.body;
    const result = await addressService.updateAddress(id, customerId, updates);
    successResponse(res, 200, result, "Address updated successfully");
  } catch (error) {
    console.error("Update address error:", error);
    const statusCode = error.status || 400;
    errorResponse(res, statusCode, error.message || "Failed to update address");
  }
};

// customer xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    if (!customerId) {
      return errorResponse(res, 403, "Customer profile not found");
    }

    await addressService.deleteAddress(id, customerId);
    successResponse(res, 200, null, "Address deleted successfully");
  } catch (error) {
    console.error("Delete address error:", error);
    const statusCode = error.status || 400;
    errorResponse(res, statusCode, error.message || "Failed to delete address");
  }
};

module.exports = {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
