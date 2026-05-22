const reportService = require("./reportService");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHelpers");

//Báo cáo doanh thu
//Query: startDate, endDate, groupBy(day|month|year), format(json|excel)
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day", format = "json" } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, 400, "startDate and endDate are required");
    }

    if (!["day", "month", "year"].includes(groupBy)) {
      return errorResponse(res, 400, "groupBy must be day | month | year");
    }

    if (!["json", "excel"].includes(format)) {
      return errorResponse(res, 400, "format must be json | excel");
    }

    const startDateObj = new Date(`${startDate}T00:00:00`);
    const endDateObj = new Date(`${endDate}T23:59:59.999`);

    if (
      isNaN(startDateObj.getTime()) ||
      isNaN(endDateObj.getTime()) ||
      startDateObj > endDateObj
    ) {
      return errorResponse(res, 400, "Invalid date range");
    }

    const start = startDateObj.toISOString();
    const end = endDateObj.toISOString();

    const result = await reportService.getRevenueReport({
      startDate: start,
      endDate: end,
      groupBy,
    });

    if (format === "excel") {
      const buffer = await reportService.exportRevenueToExcel(result);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="revenue_report.xlsx"`,
      );

      return res.send(buffer);
    }

    return successResponse(res, 200, result, "Revenue report generated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Failed to generate revenue report");
  }
};

//Báo cáo tổng hợp hoạt động người dùng
//Query: startDate, endDate, format(json|excel)
const getActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, 400, "startDate and endDate are required");
    }

    if (!["json", "excel"].includes(format)) {
      return errorResponse(res, 400, "format must be json | excel");
    }

    const startDateObj = new Date(`${startDate}T00:00:00`);
    const endDateObj = new Date(`${endDate}T23:59:59.999`);

    if (
      isNaN(startDateObj.getTime()) ||
      isNaN(endDateObj.getTime()) ||
      startDateObj > endDateObj
    ) {
      return errorResponse(res, 400, "Invalid date range");
    }

    const start = startDateObj.toISOString();
    const end = endDateObj.toISOString();

    const result = await reportService.getActivityReport({
      startDate: start,
      endDate: end,
    });

    if (format === "excel") {
      const buffer = await reportService.exportActivityToExcel(result);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="activity_report.xlsx"`,
      );

      return res.send(buffer);
    }

    return successResponse(res, 200, result, "Activity report generated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Failed to generate activity report");
  }
};

module.exports = {
  getRevenueReport,
  getActivityReport,
};
