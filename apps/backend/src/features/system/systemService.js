// backend/src/features/system/systemService.js
const { supabase } = require("../../configs/supabase");
const { v4: uuidv4 } = require("uuid");

// Helper: Parse JSON value từ string
const parseValue = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// Helper: Stringify value thành JSON string
const stringifyValue = (value) => {
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

// Lấy tất cả cấu hình hệ thống
const getAllSystemConfigs = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .order("key", { ascending: true });

  if (error) throw error;

  // Nhóm config theo loại
  const configs = {
    membership: {
      tiers: [],
      benefits: [],
    },
    tax: {
      vat: null,
    },
    shipping: {
      fees: [],
    },
  };

  data.forEach((config) => {
    const parsed = {
      id: config.id,
      key: config.key,
      value: parseValue(config.value),
      description: config.description,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    if (config.key.startsWith("MEMBERSHIP_TIER_")) {
      configs.membership.tiers.push(parsed);
    } else if (config.key.startsWith("MEMBERSHIP_BENEFIT_")) {
      configs.membership.benefits.push(parsed);
    } else if (config.key === "VAT_RATE") {
      configs.tax.vat = parsed;
    } else if (config.key.startsWith("SHIPPING_")) {
      configs.shipping.fees.push(parsed);
    }
  });

  return configs;
};

// Lấy config theo key
const getConfigByKey = async (configKey) => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .eq("key", configKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw { status: 404, message: "Configuration not found" };
    }
    throw error;
  }

  return {
    ...data,
    value: parseValue(data.value),
  };
};

// Tạo config mới
const createConfig = async (configData) => {
  const now = new Date().toISOString();

  // Validate dữ liệu
  if (!configData.configKey) throw { status: 400, message: "Invalid config" };

  // Kiểm tra key đã tồn tại chưa
  const { data: existing } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("key", configData.configKey)
    .single();

  if (existing) {
    throw { status: 409, message: "Configuration key already exists" };
  }

  const { data, error } = await supabase
    .from("SystemParameter")
    .insert({
      id: uuidv4(),
      key: configData.configKey,
      value: stringifyValue(configData.configValue),
      description: configData.description || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    value: parseValue(data.value),
  };
};

// Cập nhật config
const updateConfig = async (id, configData) => {
  const now = new Date().toISOString();

  // Kiểm tra config tồn tại
  const { data: existing, error: checkError } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    throw { status: 404, message: "Configuration not found" };
  }

  const updateData = {
    updatedAt: now,
  };

  if (configData.configValue !== undefined) {
    updateData.value = stringifyValue(configData.configValue);
  }

  if (configData.description !== undefined) {
    updateData.description = configData.description;
  }

  const { data, error } = await supabase
    .from("SystemParameter")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    value: parseValue(data.value),
  };
};

// Xóa config
const deleteConfig = async (id) => {
  // Kiểm tra config tồn tại
  const { data: existing, error: checkError } = await supabase
    .from("SystemParameter")
    .select("id, key")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    throw { status: 404, message: "Configuration not found" };
  }

  // Không cho xóa một số config quan trọng
  const protectedKeys = ["VAT_RATE"];
  if (protectedKeys.includes(existing.key)) {
    throw { status: 403, message: "Cannot delete protected configuration" };
  }

  const { error } = await supabase
    .from("SystemParameter")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return { message: "Configuration deleted successfully" };
};

// === MEMBERSHIP TIERS ===

// Lấy tất cả membership tiers
const getMembershipTiers = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .like("key", "MEMBERSHIP_TIER_%");

  if (error) throw error;

  // Parse và sắp xếp theo min ascending
  return data
    .map((tier) => {
      const value = parseValue(tier.value);
      return {
        id: tier.id,
        key: tier.key,
        name: tier.key.replace("MEMBERSHIP_TIER_", ""),
        config: value,
        description: tier.description,
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      };
    })
    .sort((a, b) => a.config.min - b.config.min); // ← Sắp xếp theo min
};

// Tạo/Cập nhật membership tier
const upsertMembershipTier = async (tierName, config) => {
  const now = new Date().toISOString();
  const configKey = `MEMBERSHIP_TIER_${tierName.toUpperCase()}`;

  // Validate config
  if (config.min < 0) throw { status: 400, message: "Invalid tier config" };
  if (config.max != null && config.max <= config.min)
    throw { status: 400, message: "Invalid tier config" };

  const configValue = {
    min: config.min,
    max: config.max || null,
    name: tierName.toUpperCase(),
  };

  // Kiểm tra đã tồn tại chưa
  const { data: existing } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("key", configKey)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("SystemParameter")
      .update({
        value: stringifyValue(configValue),
        description: config.description,
        updatedAt: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  } else {
    // Insert
    const { data, error } = await supabase
      .from("SystemParameter")
      .insert({
        id: uuidv4(),
        key: configKey,
        value: stringifyValue(configValue),
        description: config.description,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  }
};

// === MEMBERSHIP BENEFITS ===
// Lấy tất cả membership benefits
const getMembershipBenefits = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .like("key", "MEMBERSHIP_BENEFIT_%")
    .order("key", { ascending: true });

  if (error) throw error;

  return data.map((benefit) => {
    const value = parseValue(benefit.value);
    return {
      id: benefit.id,
      key: benefit.key,
      tier: benefit.key.replace("MEMBERSHIP_BENEFIT_", ""),
      benefits: value,
      description: benefit.description,
      createdAt: benefit.createdAt,
      updatedAt: benefit.updatedAt,
    };
  });
};

// Tạo/Cập nhật membership benefit
const upsertMembershipBenefit = async (tierName, benefits) => {
  const now = new Date().toISOString();
  const configKey = `MEMBERSHIP_BENEFIT_${tierName.toUpperCase()}`;

  // Validate benefits
  if (
    benefits.discountPercentage != null &&
    (benefits.discountPercentage < 0 || benefits.discountPercentage > 100)
  )
    throw { status: 400, message: "Invalid benefit config" };

  const configValue = {
    discountPercentage: benefits.discountPercentage || 0,
    freeShipping: benefits.freeShipping || false,
    prioritySupport: benefits.prioritySupport || false,
    earlyAccess: benefits.earlyAccess || false,
  };

  // Kiểm tra đã tồn tại chưa
  const { data: existing } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("key", configKey)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("SystemParameter")
      .update({
        value: stringifyValue(configValue),
        description: benefits.description,
        updatedAt: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  } else {
    // Insert
    const { data, error } = await supabase
      .from("SystemParameter")
      .insert({
        id: uuidv4(),
        key: configKey,
        value: stringifyValue(configValue),
        description: benefits.description,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  }
};

// === TAX (VAT) ===

// Lấy VAT rate
const getVATRate = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .eq("key", "VAT_RATE")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Nếu chưa có, tạo mặc định 10%
      return await createConfig({
        configKey: "VAT_RATE",
        configValue: { rate: 10 },
        description: "Value Added Tax rate in percentage",
      });
    }
    throw error;
  }

  return {
    ...data,
    value: parseValue(data.value),
  };
};

// Cập nhật VAT rate
const updateVATRate = async (rate) => {
  const now = new Date().toISOString();

  if (rate < 0 || rate > 100) {
    throw { status: 400, message: "VAT rate must be between 0 and 100" };
  }

  const { data: existing } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("key", "VAT_RATE")
    .single();

  const configValue = { rate };

  if (existing) {
    const { data, error } = await supabase
      .from("SystemParameter")
      .update({
        value: stringifyValue(configValue),
        updatedAt: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  } else {
    const { data, error } = await supabase
      .from("SystemParameter")
      .insert({
        id: uuidv4(),
        key: "VAT_RATE",
        value: stringifyValue(configValue),
        description: "Value Added Tax rate in percentage",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  }
};

// === SHIPPING FEES ===

// Lấy tất cả shipping fees
const getShippingFees = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .like("key", "SHIPPING_%")
    .order("key", { ascending: true });

  if (error) throw error;

  return data.map((fee) => {
    const value = parseValue(fee.value);
    return {
      id: fee.id,
      key: fee.key,
      type: fee.key.replace("SHIPPING_", ""),
      config: value,
      description: fee.description,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    };
  });
};

// Tạo/Cập nhật shipping fee
const upsertShippingFee = async (type, config) => {
  const now = new Date().toISOString();
  const configKey = `SHIPPING_${type.toUpperCase()}`;

  // Validate config
  if (config.baseFee < 0 || config.feePerKm < 0)
    throw { status: 400, message: "Invalid shipping config" };

  const configValue = {
    baseFee: config.baseFee || 0,
    feePerKm: config.feePerKm || 0,
    freeShippingThreshold: config.freeShippingThreshold || null,
    maxDistance: config.maxDistance || null,
  };

  // Kiểm tra đã tồn tại chưa
  const { data: existing } = await supabase
    .from("SystemParameter")
    .select("id")
    .eq("key", configKey)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("SystemParameter")
      .update({
        value: stringifyValue(configValue),
        description: config.description,
        updatedAt: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  } else {
    // Insert
    const { data, error } = await supabase
      .from("SystemParameter")
      .insert({
        id: uuidv4(),
        key: configKey,
        value: stringifyValue(configValue),
        description: config.description,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      value: parseValue(data.value),
    };
  }
};
// Helper: Chuẩn hóa config
function normalizeConfig(row) {
  let parsedValue = row.value;
  try {
    parsedValue = JSON.parse(row.value);
  } catch {}
  return { ...row, value: parsedValue };
}

module.exports = {
  getAllSystemConfigs,
  getConfigByKey,
  createConfig,
  updateConfig,
  deleteConfig,

  // Membership
  getMembershipTiers,
  upsertMembershipTier,
  getMembershipBenefits,
  upsertMembershipBenefit,

  // Tax
  getVATRate,
  updateVATRate,

  // Shipping
  getShippingFees,
  upsertShippingFee,

  normalizeConfig,
};
