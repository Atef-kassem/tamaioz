document.addEventListener("DOMContentLoaded", function () {
  // Assuming statistics object is available globally or passed in some way
  var statistics = window.statistics || {
    criteriaEntered: 0,
    criteriaRemaining: 0,
    submissionStatusCounts: {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  };

  // Criteria Chart - Bar Chart
  var criteriaOptions = {
    chart: {
      type: "bar",
      height: 280,
      toolbar: { show: false },
    },
    series: [
      {
        name: "المعايير",
        data: [statistics.criteriaEntered, statistics.criteriaRemaining],
      },
    ],
    xaxis: {
      categories: ["المعايير المدخلة", "المعايير المتبقية"],
      labels: { style: { colors: "#555", fontSize: "14px" } },
    },
    colors: ["#28a745", "#dc3545"],
    dataLabels: { enabled: false },
    grid: { borderColor: "#eee" },
  };

  var criteriaChart = new ApexCharts(
    document.querySelector("#criteria-chart"),
    criteriaOptions
  );
  criteriaChart.render();

  // Submission Status Chart - Pie Chart
  var submissionOptions = {
    chart: {
      type: "pie",
      height: 280,
    },
    series: [
      statistics.submissionStatusCounts.pending,
      statistics.submissionStatusCounts.approved,
      statistics.submissionStatusCounts.rejected,
    ],
    labels: ["قيد الانتظار", "مقبولة", "مرفوضة"],
    colors: ["#ffc107", "#28a745", "#dc3545"],
    legend: {
      position: "bottom",
      labels: { colors: "#555", useSeriesColors: false },
    },
    dataLabels: {
      style: { fontSize: "14px" },
    },
  };

  var submissionChart = new ApexCharts(
    document.querySelector("#submission-status-chart"),
    submissionOptions
  );
  submissionChart.render();
});
