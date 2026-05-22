// backend/src/features/membership/membershipService.js
const { supabase } = require("../../configs/supabase");
const systemService = require("../system/systemService");

//xd membership tier dựa trên tổng spent
const calculateMembershipTier = async (totalSpent) => {
  const tiers = await systemService.getMembershipTiers();

  const matched = tiers.find(
    (tier) =>
      totalSpent >= tier.config.min &&
      (tier.config.max === null || totalSpent <= tier.config.max),
  );

  return matched ? matched.name : "BRONZE";
};

//lấy thông tin membership của customer hiện tại
const getMyMembership = async (userId) => {
  const { data: customer, error: customerError } = await supabase
    .from("Customer")
    .select("id")
    .eq("userId", userId)
    .single();

  if (customerError || !customer) {
    throw { status: 404, message: "Customer not found" };
  }

  // lấy membership info
  const { data: membership, error } = await supabase
    .from("Membership")
    .select(
      `
      id,
      customerId,
      membership,
      spent,
      createdAt,
      updatedAt,
      Customer!Membership_customerId_fkey(
        id,
        User!Customer_userId_fkey(
          id,
          username,
          email
        )
      )
    `,
    )
    .eq("customerId", customer.id)
    .single();

  if (error) throw error;
  if (!membership) throw { status: 404, message: "Membership not found" };

  // tính thông tin bổ sung
  const nextTier = await getNextTier(membership.membership);

  return {
    ...membership,
    tierInfo: {
      current: membership.membership,
      spent: membership.spent,
      nextTier: nextTier ? nextTier.name : null,
      spentToNextTier: nextTier
        ? Math.max(0, nextTier.min - membership.spent)
        : 0,
      benefits: await getMembershipBenefits(membership.membership),
    },
  };
};

//lấy tier tiếp theo
const getNextTier = async (currentTier) => {
  const tiers = await systemService.getMembershipTiers();
  const idx = tiers.findIndex((t) => t.name === currentTier);
  return idx === -1 || idx === tiers.length - 1 ? null : tiers[idx + 1];
};

//lấy benefits của từng tier
const getMembershipBenefits = async (tier) => {
  const { data } = await supabase
    .from("SystemParameter")
    .select("value")
    .eq("key", `MEMBERSHIP_BENEFIT_${tier}`)
    .single();

  return data ? JSON.parse(data.value) : {};
};

//lấy danh sách top spent members (Admin)
const getTopSpentMembers = async (limit = 10) => {
  const { data, error } = await supabase
    .from("Membership")
    .select(
      `id, customerId, membership, spent, createdAt, updatedAt,
      Customer!Membership_customerId_fkey(
        id,
        image,
        User!Customer_userId_fkey(
          id,
          username,
          email
        )
      )
    `,
    )
    .order("spent", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Thêm rank và benefit info
  return Promise.all(
    data.map(async (member, index) => ({
      rank: index + 1,
      ...member,
      benefits: await getMembershipBenefits(member.membership),
    })),
  );
};

//lấy membership theo customerId (helper gọi ở order)
const getMembershipByCustomerId = async (customerId) => {
  const { data, error } = await supabase
    .from("Membership")
    .select("id, membership, spent")
    .eq("customerId", customerId)
    .single();

  if (error) throw error;
  if (!data) throw { status: 404, message: "Membership not found" };

  return data;
};
// Admin - lấy membership theo membershipId
const getMembershipById = async (id) => {
  const { data, error } = await supabase
    .from("Membership")
    .select(
      `id,customerId,membership,spent,createdAt,updatedAt,
      Customer!Membership_customerId_fkey(
        id,
        User!Customer_userId_fkey(
          id,
          username,
          email
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    throw { status: 404, message: "Membership not found" };
  }

  return {
    ...data,
    benefits: await getMembershipBenefits(data.membership),
  };
};
// Admin - lấy danh sách memberships
const getAllMemberships = async ({
  page = 1,
  limit = 10,
  tier,
  sort = "spent_desc",
}) => {
  let query = supabase.from("Membership").select(
    `id, customerId, membership, spent, createdAt, updatedAt,
      Customer!Membership_customerId_fkey(
        id,
        User!Customer_userId_fkey(
          id,
          username,
          email
        )
      )
    `,
    { count: "exact" },
  );

  // filter theo tier
  if (tier) {
    query = query.eq("membership", tier);
  }

  // sort
  if (sort === "spent_asc") {
    query = query.order("spent", { ascending: true });
  } else {
    query = query.order("spent", { ascending: false });
  }

  // pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: await Promise.all(
      data.map(async (m) => ({
        ...m,
        benefits: await getMembershipBenefits(m.membership),
      })),
    ),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getMembershipTierConfig = async () => {
  const { data, error } = await supabase
    .from("SystemParameter")
    .select("*")
    .like("key", "MEMBERSHIP_TIER_%");

  if (error) throw error;

  return data
    .map((row) => ({
      ...JSON.parse(row.value),
      name: row.key.replace("MEMBERSHIP_TIER_", ""),
    }))
    .sort((a, b) => a.min - b.min);
};
// Recalculate tất cả membership dựa trên spent hiện tại
const recalculateAllMemberships = async () => {
  const { data: memberships, error } = await supabase
    .from("Membership")
    .select("id, customerId, spent, membership");

  if (error) throw error;

  const results = {
    total: memberships.length,
    updated: 0,
    unchanged: 0,
    errors: [],
  };

  for (const membership of memberships) {
    try {
      const correctTier = await calculateMembershipTier(membership.spent);

      if (correctTier !== membership.membership) {
        const { error: updateError } = await supabase
          .from("Membership")
          .update({
            membership: correctTier,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", membership.id);

        if (updateError) {
          results.errors.push({
            membershipId: membership.id,
            error: updateError.message,
          });
        } else {
          results.updated++;
          console.log(
            `Updated membership ${membership.id}: ${membership.membership} → ${correctTier} (spent: ${membership.spent})`,
          );
        }
      } else {
        results.unchanged++;
      }
    } catch (err) {
      results.errors.push({
        membershipId: membership.id,
        error: err.message,
      });
    }
  }

  return results;
};

module.exports = {
  getMyMembership,
  getTopSpentMembers,
  getMembershipByCustomerId,
  calculateMembershipTier,
  getMembershipBenefits,
  getMembershipById,
  getAllMemberships,
  getMembershipTierConfig,
  recalculateAllMemberships,
};
