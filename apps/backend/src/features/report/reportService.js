const { supabase } = require("../../configs/supabase");
const ExcelJS = require("exceljs");

const sameMoment = (left, right) => {
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
};

const toEvent = ({
  id,
  entityType,
  action,
  title,
  description,
  occurredAt,
  actorLabel,
  status,
}) => ({
  id: `${entityType}:${action}:${id}:${occurredAt}`,
  entityType,
  action,
  title,
  description,
  occurredAt,
  actorLabel: actorLabel || "System",
  status: status || null,
});

const buildEventSummary = (events) =>
  events.reduce(
    (summary, event) => {
      summary.totalEvents += 1;
      if (event.entityType === "user") summary.userEvents += 1;
      else if (event.entityType === "order") summary.orderEvents += 1;
      else if (event.entityType === "return") summary.returnEvents += 1;
      else if (event.entityType === "cancellation")
        summary.cancellationEvents += 1;
      else if (event.entityType === "product") summary.productEvents += 1;
      else if (event.entityType === "config") summary.configEvents += 1;
      else if (event.entityType === "report") summary.reportEvents += 1;
      return summary;
    },
    {
      totalEvents: 0,
      userEvents: 0,
      orderEvents: 0,
      returnEvents: 0,
      cancellationEvents: 0,
      productEvents: 0,
      configEvents: 0,
      reportEvents: 0,
    },
  );

const getRevenueReport = async ({ startDate, endDate, groupBy = "day" }) => {
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

  const getGroupKey = (date, mode) => {
    const value = new Date(date);
    switch (mode) {
      case "year":
        return `${value.getFullYear()}`;
      case "month":
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
      case "day":
      default:
        return value.toISOString().split("T")[0];
    }
  };

  const revenueMap = {};
  let totalIncome = 0;
  let totalRefund = 0;

  (completedPayments || []).forEach((payment) => {
    const key = getGroupKey(payment.paymentDate, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].income += payment.amount;
    totalIncome += payment.amount;
  });

  (approvedReturns || []).forEach((record) => {
    const refundAmount = record.Order?.Payment?.[0]?.amount || 0;
    const key = getGroupKey(record.createdAt, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].refund += refundAmount;
    totalRefund += refundAmount;
  });

  (approvedCancellations || []).forEach((record) => {
    const refundAmount = record.Order?.Payment?.[0]?.amount || 0;
    const key = getGroupKey(record.createdAt, groupBy);
    if (!revenueMap[key]) {
      revenueMap[key] = { income: 0, refund: 0 };
    }
    revenueMap[key].refund += refundAmount;
    totalRefund += refundAmount;
  });

  const rows = Object.entries(revenueMap)
    .map(([period, data]) => ({
      period,
      income: data.income,
      refund: data.refund,
      netRevenue: data.income - data.refund,
    }))
    .sort((left, right) => left.period.localeCompare(right.period));

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

const getActivityReport = async ({ startDate, endDate }) => {
  const { data: activeUsers, error: userError } = await supabase
    .from("User")
    .select("id, username, email, role, createdAt, updatedAt")
    .gte("updatedAt", startDate)
    .lte("updatedAt", endDate);

  if (userError) throw userError;

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

    if (user.role === "CUSTOMER") {
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
    } else if (user.role === "SELLER") {
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
    } else if (user.role === "ADMIN") {
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
    }
  }

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

  const [
    { data: recentUsers, error: recentUsersError },
    { data: recentProducts, error: recentProductsError },
    { data: recentOrders, error: recentOrdersError },
    { data: recentReturns, error: recentReturnsError },
    { data: recentCancellations, error: recentCancellationsError },
    { data: recentConfigs, error: recentConfigsError },
    { data: recentReports, error: recentReportsError },
  ] = await Promise.all([
    supabase
      .from("User")
      .select("id, username, email, role, createdAt, updatedAt")
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("Product")
      .select("id, name, stockQuantity, createdAt, updatedAt")
      .eq("is_deleted", false)
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("Order")
      .select(
        `
        id, status, orderDate, createdAt, updatedAt,
        Customer!Order_customerId_fkey(
          User(id, username, email)
        )
      `,
      )
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("Return")
      .select(
        `
        id, orderId, reason, status, createdAt, updatedAt,
        Order!Return_orderId_fkey(
          id,
          Customer!Order_customerId_fkey(
            User(id, username, email)
          )
        )
      `,
      )
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("Cancellation")
      .select(
        `
        id, orderId, reason, status, createdAt, updatedAt,
        Order!Cancellation_orderId_fkey(
          id,
          Customer!Order_customerId_fkey(
            User(id, username, email)
          )
        )
      `,
      )
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("SystemParameter")
      .select("id, key, description, createdAt, updatedAt")
      .or(`createdAt.gte.${startDate},updatedAt.gte.${startDate}`)
      .lte("createdAt", endDate)
      .order("updatedAt", { ascending: false })
      .limit(20),
    supabase
      .from("Report")
      .select(
        `
        id, reportType, createdAt,
        Admin!Report_generatedBy_fkey(
          User(id, username, email)
        )
      `,
      )
      .gte("createdAt", startDate)
      .lte("createdAt", endDate)
      .order("createdAt", { ascending: false })
      .limit(20),
  ]);

  if (recentUsersError) throw recentUsersError;
  if (recentProductsError) throw recentProductsError;
  if (recentOrdersError) throw recentOrdersError;
  if (recentReturnsError) throw recentReturnsError;
  if (recentCancellationsError) throw recentCancellationsError;
  if (recentConfigsError) throw recentConfigsError;
  if (recentReportsError) throw recentReportsError;

  const recentEvents = [
    ...(recentUsers || []).flatMap((user) => {
      const events = [
        toEvent({
          id: user.id,
          entityType: "user",
          action: "created",
          title: `${user.role} account created`,
          description: `${user.username || user.email} joined the platform.`,
          occurredAt: user.createdAt,
          actorLabel: user.username || user.email,
          status: user.role,
        }),
      ];

      if (!sameMoment(user.createdAt, user.updatedAt)) {
        events.push(
          toEvent({
            id: user.id,
            entityType: "user",
            action: "updated",
            title: `${user.role} account updated`,
            description: `${user.username || user.email} had profile activity recorded.`,
            occurredAt: user.updatedAt,
            actorLabel: user.username || user.email,
            status: user.role,
          }),
        );
      }

      return events;
    }),
    ...(recentProducts || []).flatMap((product) => {
      const events = [
        toEvent({
          id: product.id,
          entityType: "product",
          action: "created",
          title: "Product added to catalog",
          description: `${product.name} entered the catalog with stock ${product.stockQuantity}.`,
          occurredAt: product.createdAt,
          actorLabel: product.name,
        }),
      ];

      if (!sameMoment(product.createdAt, product.updatedAt)) {
        events.push(
          toEvent({
            id: product.id,
            entityType: "product",
            action: "updated",
            title: "Product updated",
            description: `${product.name} was edited and now has stock ${product.stockQuantity}.`,
            occurredAt: product.updatedAt,
            actorLabel: product.name,
          }),
        );
      }

      return events;
    }),
    ...(recentOrders || []).flatMap((order) => {
      const customer =
        order.Customer?.User?.username || order.Customer?.User?.email || "Customer";
      const events = [
        toEvent({
          id: order.id,
          entityType: "order",
          action: "created",
          title: "Order created",
          description: `Order #${order.id.slice(0, 8)} was placed by ${customer}.`,
          occurredAt: order.createdAt || order.orderDate,
          actorLabel: customer,
          status: order.status,
        }),
      ];

      if (!sameMoment(order.createdAt, order.updatedAt)) {
        events.push(
          toEvent({
            id: order.id,
            entityType: "order",
            action: "updated",
            title: "Order status updated",
            description: `Order #${order.id.slice(0, 8)} is now ${order.status}.`,
            occurredAt: order.updatedAt,
            actorLabel: customer,
            status: order.status,
          }),
        );
      }

      return events;
    }),
    ...(recentReturns || []).flatMap((record) => {
      const customer =
        record.Order?.Customer?.User?.username ||
        record.Order?.Customer?.User?.email ||
        "Customer";
      const events = [
        toEvent({
          id: record.id,
          entityType: "return",
          action: "created",
          title: "Return requested",
          description: `${customer} submitted a return for order #${record.orderId.slice(0, 8)}.`,
          occurredAt: record.createdAt,
          actorLabel: customer,
          status: record.status,
        }),
      ];

      if (!sameMoment(record.createdAt, record.updatedAt)) {
        events.push(
          toEvent({
            id: record.id,
            entityType: "return",
            action: "updated",
            title: "Return status updated",
            description: `Return request #${record.id.slice(0, 8)} is now ${record.status}.`,
            occurredAt: record.updatedAt,
            actorLabel: customer,
            status: record.status,
          }),
        );
      }

      return events;
    }),
    ...(recentCancellations || []).flatMap((record) => {
      const customer =
        record.Order?.Customer?.User?.username ||
        record.Order?.Customer?.User?.email ||
        "Customer";
      const events = [
        toEvent({
          id: record.id,
          entityType: "cancellation",
          action: "created",
          title: "Cancellation requested",
          description: `${customer} submitted a cancellation for order #${record.orderId.slice(0, 8)}.`,
          occurredAt: record.createdAt,
          actorLabel: customer,
          status: record.status,
        }),
      ];

      if (!sameMoment(record.createdAt, record.updatedAt)) {
        events.push(
          toEvent({
            id: record.id,
            entityType: "cancellation",
            action: "updated",
            title: "Cancellation status updated",
            description: `Cancellation request #${record.id.slice(0, 8)} is now ${record.status}.`,
            occurredAt: record.updatedAt,
            actorLabel: customer,
            status: record.status,
          }),
        );
      }

      return events;
    }),
    ...(recentConfigs || []).flatMap((config) => {
      const events = [
        toEvent({
          id: config.id,
          entityType: "config",
          action: "created",
          title: "System parameter created",
          description: `${config.key} was added to system configuration.`,
          occurredAt: config.createdAt,
          actorLabel: config.key,
        }),
      ];

      if (!sameMoment(config.createdAt, config.updatedAt)) {
        events.push(
          toEvent({
            id: config.id,
            entityType: "config",
            action: "updated",
            title: "System parameter updated",
            description: `${config.key} configuration was changed.`,
            occurredAt: config.updatedAt,
            actorLabel: config.key,
          }),
        );
      }

      return events;
    }),
    ...(recentReports || []).map((report) =>
      toEvent({
        id: report.id,
        entityType: "report",
        action: "generated",
        title: "Report generated",
        description: `${report.reportType} report export was created.`,
        occurredAt: report.createdAt,
        actorLabel:
          report.Admin?.User?.username || report.Admin?.User?.email || "Admin",
        status: report.reportType,
      }),
    ),
  ]
    .filter((event) => !Number.isNaN(new Date(event.occurredAt).getTime()))
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, 40);

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
    recentEvents,
    eventSummary: buildEventSummary(recentEvents),
    statistics: {
      totalCustomers: customerActivities.length,
      totalSellers: sellerActivities.length,
      totalAdmins: adminActivities.length,
    },
  };
};

const exportRevenueToExcel = async (revenueData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Revenue Report");

  worksheet.mergeCells("A1:D1");
  worksheet.getCell("A1").value = "REVENUE REPORT";
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.addRow([]);
  worksheet.addRow(["Total income", revenueData.summary.totalIncome]);
  worksheet.addRow(["Total refund", revenueData.summary.totalRefund]);
  worksheet.addRow(["Net revenue", revenueData.summary.netRevenue]);
  worksheet.addRow([]);
  worksheet.addRow([
    "Completed payments",
    revenueData.details.totalCompletedPayments,
  ]);
  worksheet.addRow([
    "Approved returns",
    revenueData.details.totalApprovedReturns,
  ]);
  worksheet.addRow([
    "Approved cancellations",
    revenueData.details.totalApprovedCancellations,
  ]);
  worksheet.addRow([]);
  worksheet.addRow(["Period", "Income", "Refund", "Net revenue"]);
  worksheet.getRow(worksheet.lastRow.number).font = { bold: true };

  revenueData.rows.forEach((row) => {
    worksheet.addRow([row.period, row.income, row.refund, row.netRevenue]);
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 10) {
      row.getCell(2).numFmt = "#,##0.00";
      row.getCell(3).numFmt = "#,##0.00";
      row.getCell(4).numFmt = "#,##0.00";
    }
  });

  worksheet.columns = [
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  return workbook.xlsx.writeBuffer();
};

const exportActivityToExcel = async (activity) => {
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.mergeCells("A1:B1");
  summarySheet.getCell("A1").value = "ACTIVITY REPORT";
  summarySheet.getCell("A1").font = { bold: true, size: 16 };
  summarySheet.getCell("A1").alignment = { horizontal: "center" };

  summarySheet.addRow([]);
  summarySheet.addRow([
    "Total active users",
    activity.summary.totalActiveUsers,
  ]);
  summarySheet.addRow(["New users", activity.summary.newUsers]);
  summarySheet.addRow(["New orders", activity.summary.newOrders]);
  summarySheet.addRow(["New reviews", activity.summary.newReviews]);
  summarySheet.addRow([]);
  summarySheet.addRow(["New users by role"]);

  Object.entries(activity.summary.newUsersByRole).forEach(([role, count]) => {
    summarySheet.addRow([role, count]);
  });

  summarySheet.addRow([]);
  summarySheet.addRow(["Recent events", activity.eventSummary.totalEvents]);
  summarySheet.addRow(["Order events", activity.eventSummary.orderEvents]);
  summarySheet.addRow(["Product events", activity.eventSummary.productEvents]);
  summarySheet.addRow(["Return events", activity.eventSummary.returnEvents]);
  summarySheet.addRow([
    "Cancellation events",
    activity.eventSummary.cancellationEvents,
  ]);
  summarySheet.addRow(["Config events", activity.eventSummary.configEvents]);
  summarySheet.addRow(["Report events", activity.eventSummary.reportEvents]);
  summarySheet.columns = [{ width: 28 }, { width: 16 }];

  const customerSheet = workbook.addWorksheet("Customers");
  customerSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Username", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Last active", key: "lastActive", width: 24 },
    { header: "Total orders", key: "totalOrders", width: 15 },
  ];
  customerSheet.addRows(activity.activities.customers);
  customerSheet.getRow(1).font = { bold: true };

  const sellerSheet = workbook.addWorksheet("Sellers");
  sellerSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Username", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Last active", key: "lastActive", width: 24 },
    { header: "Total products", key: "totalProducts", width: 16 },
  ];
  sellerSheet.addRows(activity.activities.sellers);
  sellerSheet.getRow(1).font = { bold: true };

  const adminSheet = workbook.addWorksheet("Admins");
  adminSheet.columns = [
    { header: "User ID", key: "userId", width: 25 },
    { header: "Username", key: "username", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Last active", key: "lastActive", width: 24 },
    {
      header: "Reports generated",
      key: "totalReportsGenerated",
      width: 18,
    },
  ];
  adminSheet.addRows(activity.activities.admins);
  adminSheet.getRow(1).font = { bold: true };

  const eventSheet = workbook.addWorksheet("Recent Events");
  eventSheet.columns = [
    { header: "When", key: "occurredAt", width: 24 },
    { header: "Entity", key: "entityType", width: 18 },
    { header: "Action", key: "action", width: 18 },
    { header: "Actor", key: "actorLabel", width: 24 },
    { header: "Status", key: "status", width: 18 },
    { header: "Title", key: "title", width: 28 },
    { header: "Description", key: "description", width: 54 },
  ];
  eventSheet.addRows(activity.recentEvents || []);
  eventSheet.getRow(1).font = { bold: true };

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  getRevenueReport,
  getActivityReport,
  exportRevenueToExcel,
  exportActivityToExcel,
};
