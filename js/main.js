(() => {
  const home = document.getElementById("home");
  const toMenu = document.querySelector(".to-menu");
  const pages = document.querySelectorAll(".page");
  const countdown = document.querySelector("[data-countdown]");

  if (countdown) {
    const target = new Date(countdown.dataset.countdown).getTime();
    const days = Math.ceil((target - Date.now()) / 86400000);
    if (days > 1) countdown.textContent = `Còn ${days} ngày tới race day`;
    else if (days === 1) countdown.textContent = "Ngày mai là race day";
    else if (days > -2) countdown.textContent = "Race day!";
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      const target = id && id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  if (!("IntersectionObserver" in window)) {
    document.documentElement.classList.add("no-js");
    toMenu?.classList.add("is-visible");
    return;
  }

  if (home && toMenu) {
    new IntersectionObserver(
      ([entry]) => toMenu.classList.toggle("is-visible", !entry.isIntersecting),
      { threshold: 0.15 }
    ).observe(home);
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  pages.forEach((page) => revealObserver.observe(page));
})();
