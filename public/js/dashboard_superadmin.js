document.addEventListener("DOMContentLoaded", function () {
  // Add click handlers to cards to show alert or navigate
  const cards = document.querySelectorAll(
    ".dashboard-superadmin div[style*='background']"
  );
  cards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      alert("تم النقر على البطاقة: " + card.innerText.trim());
      // Here you can add navigation or modal popup logic
    });
  });

  // Example: Animate numbers counting up
  const counters = document.querySelectorAll(
    ".dashboard-superadmin div[style*='font-size: 2rem']"
  );
  counters.forEach((counter) => {
    const target = +counter.innerText;
    counter.innerText = "0";
    let count = 0;
    const increment = Math.ceil(target / 100);
    const interval = setInterval(() => {
      count += increment;
      if (count >= target) {
        counter.innerText = target;
        clearInterval(interval);
      } else {
        counter.innerText = count;
      }
    }, 20);
  });
});
