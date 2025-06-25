const Association = require("../models/Association");
const Award = require("../models/Award");
const Criteria = require("../models/Criteria");
const CriterionReview = require("../models/CriterionReview");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Show the reports screen with filters and options
exports.showReportsScreen = async (req, res) => {
  try {
    // Fetch associations, criteria, and any other needed data for filters
    const associations = await Association.find();
    const criteriaList = await Criteria.find();

    // Render reports_content partial to HTML
    req.app.render(
      "partials/reports_content",
      { associations, criteriaList, user: req.user },
      (err, html) => {
        if (err) {
          console.error("Error rendering reports content:", err);
          return res.status(500).send("حدث خطأ أثناء تحميل شاشة التقارير");
        }

        // Render dashboard with reports_content as body
        res.render("dashboard", {
          title: "شاشة التقارير",
          role: req.user ? req.user.role : null,
          body: html,
          statistics: {},
          notifications: [],
          quickLinks: [],
        });
      }
    );
  } catch (error) {
    console.error("Error loading reports screen:", error);
    // Log detailed error stack for debugging
    console.error(error.stack);
    res.status(500).send("حدث خطأ أثناء تحميل شاشة التقارير");
  }
};

// New method to render criteria report page with all details and comparisons
exports.showCriteriaReport = async (req, res) => {
  try {
    // Fetch all criteria with hierarchy
    const criteria = await Criteria.find().lean();

    // Build tree structure
    const map = {};
    criteria.forEach((item) => {
      item.children = [];
      map[item._id] = item;
    });
    const roots = [];
    criteria.forEach((item) => {
      if (item.parent) {
        map[item.parent]?.children.push(item);
      } else {
        roots.push(item);
      }
    });

    // Fetch criterion reviews for comparison (optional, can be enhanced)
    // For now, fetch all reviews
    const reviews = await CriterionReview.find().lean();

    // Fetch all associations and awards to map names
    const associations = await Association.find().lean();
    const awards = await Award.find().lean();

    // Create maps from id to name
    const associationMap = {};
    associations.forEach((assoc) => {
      associationMap[assoc._id.toString()] = assoc.name;
    });
    const awardMap = {};
    awards.forEach((award) => {
      awardMap[award._id.toString()] = award.name;
    });

    // Add associationName and awardName to each review
    const updatedReviews = reviews.map((review) => {
      const assocId = review.associationId
        ? review.associationId.toString()
        : null;
      const awardId = review.awardId ? review.awardId.toString() : null;
      return {
        ...review,
        associationName:
          assocId && associationMap.hasOwnProperty(assocId)
            ? associationMap[assocId]
            : "غير معروف",
        awardName:
          awardId && awardMap.hasOwnProperty(awardId)
            ? awardMap[awardId]
            : "غير معروف",
      };
    });

    // Render criteriaReport.ejs with criteria tree and updated reviews
    res.render("criteriaReport", {
      title: "تقرير المعايير",
      user: req.user,
      criteriaTree: roots,
      reviews: updatedReviews,
    });
  } catch (error) {
    console.error("Error loading criteria report:", error);
    res.status(500).send("حدث خطأ أثناء تحميل تقرير المعايير");
  }
};

// Implement report generation logic
exports.generateReport = async (req, res) => {
  try {
    let {
      association,
      startDate,
      endDate,
      criteria,
      reportTemplate,
      exportFormat,
    } = req.body || {};

    // Log the received exportFormat for debugging
    console.log("Received exportFormat:", exportFormat);

    // Set default exportFormat to 'live' if not provided or empty
    if (!exportFormat) {
      exportFormat = "live";
      console.log("No exportFormat provided. Defaulting to 'live'.");
    }

    // Build query filters
    const query = {};

    if (association) {
      // association can be multiple values if multiple select
      if (Array.isArray(association)) {
        query.association = { $in: association };
      } else {
        query.association = association;
      }
    }

    if (criteria) {
      query.criteria = criteria;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Fetch matching data from database
    // Assuming there is a Report model or similar to query report data
    // Since no Report model found, we will simulate with Association and Criteria data

    // For demonstration, create dummy report data combining association and criteria info
    const associations = await Association.find(
      association
        ? {
            _id: {
              $in: Array.isArray(association) ? association : [association],
            },
          }
        : {}
    );
    const criteriaList = await Criteria.find(criteria ? { _id: criteria } : {});

    // Create dummy report entries
    const reports = [];

    associations.forEach((assoc) => {
      criteriaList.forEach((crit) => {
        reports.push({
          associationName: assoc.name,
          criteriaName: crit.name,
          date: new Date(),
          details: `تقرير نموذجي لنموذج ${reportTemplate || "غير محدد"}`,
        });
      });
    });

    if (exportFormat === "live") {
      // Render partial view with report data for live display
      res.render("partials/report_results", { reports });
    } else if (exportFormat === "pdf") {
      // Generate PDF report
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report_${Date.now()}.pdf"`
      );

      doc.pipe(res);

      doc.fontSize(18).text("تقرير النموذج", { align: "center" });
      doc.moveDown();

      reports.forEach((report, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. الجمعية: ${report.associationName} - المعيار: ${
              report.criteriaName
            }`
          );
        doc.fontSize(12).text(`التاريخ: ${report.date.toLocaleDateString()}`);
        doc.fontSize(12).text(`التفاصيل: ${report.details}`);
        doc.moveDown();
      });

      doc.end();
    } else if (exportFormat === "excel") {
      // Generate Excel report
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("التقرير");

      // Define columns
      worksheet.columns = [
        { header: "رقم", key: "number", width: 10 },
        { header: "الجمعية", key: "associationName", width: 30 },
        { header: "المعيار", key: "criteriaName", width: 30 },
        { header: "التاريخ", key: "date", width: 20 },
        { header: "التفاصيل", key: "details", width: 40 },
      ];

      // Add rows
      reports.forEach((report, index) => {
        worksheet.addRow({
          number: index + 1,
          associationName: report.associationName,
          criteriaName: report.criteriaName,
          date: report.date.toLocaleDateString(),
          details: report.details,
        });
      });

      // Set response headers for Excel download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report_${Date.now()}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Unsupported export format
      res
        .status(400)
        .send(`صيغة التصدير غير مدعومة: ${exportFormat || "undefined"}`);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("حدث خطأ أثناء توليد التقرير");
  }
};

// New method to render criteria report inside dashboard layout
exports.showCriteriaReportInDashboard = async (req, res) => {
  try {
    // Fetch all criteria with hierarchy
    const criteria = await Criteria.find().lean();

    // Build tree structure
    const map = {};
    criteria.forEach((item) => {
      item.children = [];
      map[item._id] = item;
    });
    const roots = [];
    criteria.forEach((item) => {
      if (item.parent) {
        map[item.parent]?.children.push(item);
      } else {
        roots.push(item);
      }
    });

    // Fetch criterion reviews for comparison
    const reviews = await CriterionReview.find().lean();

    // Render criteriaReport.ejs to HTML string
    req.app.render(
      "criteriaReport",
      {
        title: "تقرير المعايير",
        user: req.user,
        criteriaTree: roots,
        reviews,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering criteria report:", err);
          return res.status(500).send("حدث خطأ أثناء تحميل تقرير المعايير");
        }
        // Render dashboard with criteriaReport HTML as body
        res.render("dashboard", {
          title: "لوحة التحكم - تقرير المعايير",
          role: req.user ? req.user.role : null,
          body: html,
          statistics: {},
          notifications: [],
          quickLinks: [],
        });
      }
    );
  } catch (error) {
    console.error("Error loading criteria report in dashboard:", error);
    res.status(500).send("حدث خطأ أثناء تحميل تقرير المعايير");
  }
};
