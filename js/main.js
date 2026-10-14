(() => {
  const home = document.getElementById("home");
  const toMenu = document.querySelector(".to-menu");
  const pages = document.querySelectorAll(".page");
  const countdown = document.querySelector("[data-countdown]");

  if (countdown) {
    const at = (s) => (s ? new Date(s).getTime() : NaN);
    const race = at(countdown.dataset.countdown);
    const depart = at(countdown.dataset.countdownDepart);
    const end = at(countdown.dataset.countdownEnd);

    const span = (ms) => {
      const min = Math.max(0, Math.floor(ms / 60000));
      const d = Math.floor(min / 1440);
      const h = Math.floor((min % 1440) / 60);
      const m = min % 60;
      if (d >= 2) return `${d} ngày ${h} giờ`;
      if (d === 1) return `1 ngày ${h} giờ ${m} phút`;
      return h ? `${h} giờ ${m} phút` : `${m} phút`;
    };

    const chip = (label, value) => {
      const node = document.createElement("span");
      node.className = "home__count-item";
      node.append(label, " ");
      const strong = document.createElement("strong");
      strong.textContent = value;
      node.append(strong);
      return node;
    };

    const tick = () => {
      const now = Date.now();
      const items = [];
      if (now < depart) items.push(chip("Lên xe sau", span(depart - now)));
      if (now < race) items.push(chip("Race 85K sau", span(race - now)));
      else if (now < race + 86400000) items.push(chip("Race day!", "Chạy thôi"));
      else if (now < end) items.push(chip("Đang ở", "Đà Lạt"));
      countdown.replaceChildren(...items);
      if (!items.length) clearInterval(timer);
    };
    const timer = setInterval(tick, 30000);
    tick();
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
