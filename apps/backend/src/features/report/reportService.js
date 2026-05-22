// backend/src/features/report/reportService.js
const { supabase } = require("../../configs/supabase");
const ExcelJS = require("exceljs");

//báo cáo doanh thu gồm tiền vào từ đơn hàng và tiền trả lại từ trả hàng/hủy đơn
const getRevenueReport = async ({ startDate, endDate, groupBy = "day" }) => {
  // 1. Lấy tất cả Payment COMPLETED trong khoảng thời gian
  const { data: completedPayments, error: paymentError } = await supabase
    .from("Payment")
    .select(
      `id, amount, paymentDate, orderId,
      Order!Payment_orderId_fkey(
        id,
        status,
        orderDate
      )
    `,
    )
    .eq("status", "SUCCESS")
    .gte("paymentDate", startDate)
    .lte("paymentDate", endDate);

  if (paymentError) throw paymentError;

  // 2. Lấy các Return được APPROVED (tiền phải trả lại khách)
  const { data: approvedReturns, error: returnError } = await supabase
    .from("Return")
    .select(
      `id, orderId, status, createdAt,
      Order!Return_orderId_fkey(
        id,
        Payment(
          id,
          amount
        )
      )
    `,
    )
    .eq("status", "APPROVED")
    .gte("createdAt", startDate)
    .lte("createdAt", endDate);

  if (returnError) throw returnError;

  // 3. Lấy các Cancellation được APPROVED (tiền phải trả lại khách)
  const { data: approvedCancellations, error: cancelError } = await supabase
    .from("Cancellation")
    .select(
      `id, orderId, status, createdAt,
      Order!Cancellation_orderId_fkey(
        id,
        Payment(
          id,
          amount
        )
      )
    `,
    )
    .eq("status", "APPROVED")
    .gte("createdAt", startDate)
    .lte("createdAt", endDate);

  if (cancelError) throw cancelError;

  // Helper: Nhóm theo thời gian
  const getGroupKey = (date, groupBy) => {
    const d = new Date(date);
    switch (groupBy) {
      case "year":
        return `${d.getFullYear()}`;
      case "month":
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      case "day":
      default:
        return d.toISOString().split("T")[0];
    }
  };

  // Tính toán doanh thu
  const revenueMap = {};
  let totalIncome = 0;
  let totalRefund = 0;

  // Tiền vào từ Payment COMPLETED
  (completedPayments || []).forEach((payment) => {
    const key = getGroupKey(payment.paymentDate, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].income += payment.amount;
    totalIncome += payment.amount;
  });

  // Tiền trả lại từ Return APPROVED
  (approvedReturns || []).forEach((ret) => {
    const refundAmount = ret.Order?.Payment?.[0]?.amount || 0;
    const key = getGroupKey(ret.createdAt, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].refund += refundAmount;
    totalRefund += refundAmount;
  });

  // Tiền trả lại từ Cancellation APPROVED
  (approvedCancellations || []).forEach((cancel) => {
    const refundAmount = cancel.Order?.Payment?.[0]?.amount || 0;
    const key = getGroupKey(cancel.createdAt, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].refund += refundAmount;
    totalRefund += refundAmount;
  });

  // Tính doanh thu thực (income - refund)
  const rows = Object.entries(revenueMap)
    .map(([period, data]) => ({
      period,
      income: data.income,
      refund: data.refund,
      netRevenue: data.income - data.refund,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return {
    summary: {
      totalIncome,
      totalRefund,
      netRevenue: totalIncome - totalRefund,
    },
    rows,
    details: {
      totalCompletedPayments: completedPayments?.length || 0,
      totalApprovedReturns: approvedReturns?.length || 0,
      totalApprovedCancellations: approvedCancellations?.length || 0,
    },
  };
};

/**
 * Tạo báo cáo hoạt động/truy cập
 * Quản lý log đăng nhập của Customer, Seller, Admin
 */
//báo cáo hoạt động người dùng quản lý log đăng nhập của Customer, Seller, Admin
const getActivityReport = async ({ startDate, endDate }) => {
  // 1. Lấy tất cả User có hoạt động trong khoảng thời gian
  const { data: activeUsers, error: userError } = await supabase
    .from("User")
    .select(`id,username, email, role, createdAt, updatedAt`)
    .gte("updatedAt", startDate)
    .lte("updatedAt", endDate);

  if (userError) throw userError;

  // 2. Phân loại theo role
  const customerActivities = [];
  const sellerActivities = [];
  const adminActivities = [];

  for (const user of activeUsers || []) {
    const activity = {
      userId: user.id,
      username: user.username,
      email: user.email,
      lastActive: user.updatedAt,
      accountCreated: user.createdAt,
    };

    switch (user.role) {
      case "CUSTOMER":
        // Lấy thêm thông tin Customer
        const { data: customer } = await supabase
          .from("Customer")
          .select(
            `
            id,
            Order(id, orderDate, status)
          `,
          )
          .eq("userId", user.id)
          .single();

        customerActivities.push({
          ...activity,
          customerId: customer?.id,
          totalOrders: customer?.Order?.length || 0,
        });
        break;

      case "SELLER":
        // Lấy thêm thông tin Seller
        const { data: seller } = await supabase
          .from("Seller")
          .select(
            `
            id,
            Product(id)
          `,
          )
          .eq("userId", user.id)
          .single();

        sellerActivities.push({
          ...activity,
          sellerId: seller?.id,
          totalProducts: seller?.Product?.length || 0,
        });
        break;

      case "ADMIN":
        // Lấy thêm thông tin Admin
        const { data: admin } = await supabase
          .from("Admin")
          .select(
            `
            id,
            Report(id)
          `,
          )
          .eq("userId", user.id)
          .single();

        adminActivities.push({
          ...activity,
          adminId: admin?.id,
          totalReportsGenerated: admin?.Report?.length || 0,
        });
        break;
    }
  }

  // 3. Thống kê hoạt động chung
  const { data: newUsers } = await supabase
    .from("User")
    .select("id, role")
    .gte("createdAt", startDate)
    .lte("createdAt", endDate);

  const { data: newOrders } = await supabase
    .from("Order")
    .select("id")
    .gte("orderDate", startDate)
    .lte("orderDate", endDate);

  const { data: newReviews } = await supabase
    .from("Review")
    .select("id")
    .gte("reviewDate", startDate)
    .lte("reviewDate", endDate);

  // Phân loại user mới theo role
  const newUsersByRole = (newUsers || []).reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalActiveUsers: activeUsers?.length || 0,
      newUsers: newUsers?.length || 0,
      newOrders: newOrders?.length || 0,
      newReviews: newReviews?.length || 0,
      newUsersByRole,
    },
    activities: {
      customers: customerActivities,
      sellers: sellerActivities,
      admins: adminActivities,
    },
    statistics: {
      totalCustomers: customerActivities.length,
      totalSellers: sellerActivities.length,
      totalAdmins: adminActivities.length,
    },
  };
};

// Export báo cáo doanh thu ra Excel
const exportRevenueToExcel = async (revenueData) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Revenue Report");

  // Header chính
  ws.mergeCells("A1:D1");
  ws.getCell("A1").value = "BÁO CÁO DOANH THU";
  ws.getCell("A1").font = { bold: true, size: 16 };
  ws.getCell("A1").alignment = { horizontal: "center" };

  // Tổng hợp
  ws.addRow([]);
  ws.addRow(["Tổng tiền vào:", revenueData.summary.totalIncome]);
  ws.addRow(["Tổng tiền hoàn:", revenueData.summary.totalRefund]);
  ws.addRow(["Doanh thu thực:", revenueData.summary.netRevenue]);
  ws.addRow([]);

  // Chi tiết
  ws.addRow([
    "Giao dịch hoàn tất:",
    revenueData.details.totalCompletedPayments,
  ]);
  ws.addRow(["Đơn trả hàng:", revenueData.details.totalApprovedReturns]);
  ws.addRow(["Đơn hủy:", revenueData.details.totalApprovedCancellations]);
  ws.addRow([]);

  // Bảng dữ liệu theo thời gian
  ws.addRow(["Thời gian", "Tiền vào", "Tiền hoàn", "Doanh thu thực"]);
  ws.getRow(ws.lastRow.number).font = { bold: true };

  revenueData.rows.forEach((row) => {
    ws.addRow([row.period, row.income, row.refund, row.netRevenue]);
  });

  // Format số
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 10) {
      row.getCell(2).numFmt = "#,##0.00";
      row.getCell(3).numFmt = "#,##0.00";
      row.getCell(4).numFmt = "#,##0.00";
    }
  });

  // Độ rộng cột
  ws.columns = [{ width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];

  return wb.xlsx.writeBuffer();
};

// Export báo cáo hoạt động ra Excel
const exportActivityToExcel = async (activity) => {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Tổng quan
  const summarySheet = wb.addWorksheet("Tổng quan");
  summarySheet.mergeCells("A1:B1");
  summarySheet.getCell("A1").value = "BÁO CÁO HOẠT ĐỘNG";
  summarySheet.getCell("A1").font = { bold: true, size: 16 };
  summarySheet.getCell("A1").alignment = { horizontal: "center" };

  summarySheet.addRow([]);
  summarySheet.addRow([
    "Tổng user hoạt động:",
    activity.summary.totalActiveUsers,
  ]);
  summarySheet.addRow(["User mới:", activity.summary.newUsers]);
  summarySheet.addRow(["Đơn hàng mới:", activity.summary.newOrders]);
  summarySheet.addRow(["Đánh giá mới:", activity.summary.newReviews]);
  summarySheet.addRow([]);
  summarySheet.addRow(["User mới theo vai trò:"]);

  Object.entries(activity.summary.newUsersByRole).forEach(([role, count]) => {
    summarySheet.addRow([`  ${role}:`, count]);
  });

  summarySheet.columns = [{ width: 30 }, { width: 15 }];

  // Sheet 2: Customer Activities
  const customerSheet = wb.addWorksheet("Khách hàng");
  customerSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Tên", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Hoạt động lần cuối", key: "lastActive", width: 20 },
    { header: "Tổng đơn hàng", key: "totalOrders", width: 15 },
  ];
  customerSheet.addRows(activity.activities.customers);
  customerSheet.getRow(1).font = { bold: true };

  // Sheet 3: Seller Activities
  const sellerSheet = wb.addWorksheet("Người bán");
  sellerSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Tên", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Hoạt động lần cuối", key: "lastActive", width: 20 },
    { header: "Tổng sản phẩm", key: "totalProducts", width: 15 },
  ];
  sellerSheet.addRows(activity.activities.sellers);
  sellerSheet.getRow(1).font = { bold: true };

  // Sheet 4: Admin Activities
  const adminSheet = wb.addWorksheet("Quản trị viên");
  adminSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Tên", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Hoạt động lần cuối", key: "lastActive", width: 20 },
    { header: "Tổng báo cáo tạo", key: "totalReportsGenerated", width: 15 },
  ];
  adminSheet.addRows(activity.activities.admins);
  adminSheet.getRow(1).font = { bold: true };

  return wb.xlsx.writeBuffer();
};

module.exports = {
  getRevenueReport,
  getActivityReport,
  exportRevenueToExcel,
  exportActivityToExcel,
};
