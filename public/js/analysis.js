document.addEventListener("DOMContentLoaded", function () {
  const chartData = window.chartData || {};

  function renderChart(ctxId, dataKey, chartType, options = {}) {
    const ctx = document.getElementById(ctxId);
    const msg = document.getElementById(ctxId.replace("Chart", "Msg"));

    if (
      !chartData[dataKey] ||
      !chartData[dataKey].labels ||
      chartData[dataKey].labels.length === 0
    ) {
      if (msg) msg.style.display = "block";
      if (ctx) ctx.style.display = "none";
      return;
    }

    if (msg) msg.style.display = "none";
    if (ctx) ctx.style.display = "block";

    const data = {
      labels: chartData[dataKey].labels,
      datasets: chartData[dataKey].datasets,
    };

    new Chart(ctx, {
      type: chartType,
      data: data,
      options: options,
    });
  }

  // Associations Status Chart - Bar chart
  renderChart("associationsStatusChart", "associationsStatus", "bar", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "عدد الجمعيات حسب حالة المراجعة" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  });

  // Awards Status Chart - Bar chart
  renderChart("awardsStatusChart", "awardsStatus", "bar", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "عدد الجوائز حسب الحالة" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  });

  // Criteria Count Chart - Pie chart
  renderChart("criteriaCountChart", "criteriaCount", "pie", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "right" },
      title: { display: true, text: "عدد المعايير حسب النوع" },
    },
  });

  // Average Points Chart - Bar chart
  renderChart("avgPointsChart", "avgPoints", "bar", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "متوسط النقاط لكل نوع من المعايير" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  });

  // Awards Per Association Chart - Bar chart
  renderChart("awardsPerAssociationChart", "awardsPerAssociation", "bar", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "عدد الجوائز المرتبطة بكل جمعية" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  });

  // Criteria Ratings Chart - Bar chart
  renderChart("criteriaRatingsChart", "criteriaRatings", "bar", {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "تقييمات المعايير" },
    },
    scales: {
      y: { beginAtZero: true, max: 5 },
    },
  });
});
