// Sơ đồ giường xe Thành Bưởi 34 giường (giường nằm, 2 tầng)
// Mỗi chuyến: booked = giường đoàn đã đặt, assignments = "mã giường": "Tên hiển thị"
// Hai chiều đặt giường khác nhau, điền riêng từng chiều.
const TRIPS = {
  di: {
    label: "Chiều đi · SG → ĐL · tối 05.11",
    empty: "Chưa có số giường chiều đi.",
    booked: ["1A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "10A", "11A", "12A", "3B", "4B", "5B", "6B", "7B", "9B"],
    assignments: {
      "1A": "Lệ",
      "3A": "Linh Đậu",
      "4A": "Bơ",
      "5A": "Timmie",
      "6A": "Vợ Timmie",
      "7A": "Bịp",
      "8A": "Tú",
      "9A": "Thuỳ",
      "10A": "Lộc",
      "11A": "Trí Quan",
      "12A": "Dori",
      "3B": "Luật",
      "4B": "Luna",
      "5B": "Quân",
      "6B": "Thy",
      "7B": "Thành",
      "9B": "Đăng",
    },
  },
  ve: {
    label: "Chiều về · ĐL → SG · 09.11 12:00",
    booked: ["1A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "11A", "12A", "4B", "5B", "6B", "7B", "9B"],
    assignments: {
      "1A": "Lệ",
      "3A": "Linh Đậu",
      "4A": "Bơ",
      "5A": "Timmie",
      "6A": "Vợ Timmie",
      "7A": "Bịp",
      "8A": "Tú",
      "9A": "Thuỳ",
      "11A": "Trí Quan",
      "12A": "Dori",
      "4B": "Luna",
      "5B": "Quân",
      "6B": "Thy",
      "7B": "Thành",
      "9B": "Đăng",
    },
  },
};

// Tên gọi → họ tên, dùng cho tooltip
const FULL_NAMES = {
  "Lệ": "Nguyễn Thị Mỹ Lệ",
  "Linh Đậu": "Đậu Thị Ngọc Linh",
  "Bơ": "Phạm Thị Quỳnh Anh",
  "Timmie": "Lê Đức Tuyển",
  "Vợ Timmie": "Thái Thị Ý Nhi",
  "Bịp": "Đỗ Tuấn Thành",
  "Tú": "Nguyễn Lê Tú",
  "Thuỳ": "Đinh Thị Phương Thùy",
  "Lộc": "Nguyễn Thế Lộc",
  "Trí Quan": "Quan Minh Trí",
  "Dori": "Nguyễn Ngọc Diễm Quỳnh",
  "Luật": "Nguyễn Công Luật",
  "Luna": "Đào Như Quỳnh",
  "Quân": "Nguyễn Duy Quân",
  "Thy": "Nguyễn Lữ Minh Thy",
  "Thành": "Trần Văn Thành",
  "Đăng": "Phạm Hải Đăng",
};

(() => {
  const bus = document.querySelector("[data-bus]");
  if (!bus) return;

  const tabs = [...document.querySelectorAll(".seatmap__tab[data-trip]")];
  const panel = document.getElementById("seat-panel");
  const bar = document.querySelector("[data-seat-bar]");
  const empty = document.querySelector("[data-seat-empty]");

  // null = lối đi (không có giường)
  const LAYOUT = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, null, 14],
    [15, 16, 17],
  ];

  const DECKS = [
    { suffix: "A", label: "Tầng dưới" },
    { suffix: "B", label: "Tầng trên" },
  ];

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  const render = (key) => {
    const trip = TRIPS[key];
    if (!trip) return;

    const booked = new Set(trip.booked);
    const assignments = trip.assignments || {};
    bus.replaceChildren();
    bus.setAttribute("aria-label", trip.label);

    const hasSeats = booked.size > 0;
    bus.hidden = !hasSeats;
    if (bar) bar.hidden = !hasSeats;
    if (empty) {
      empty.hidden = hasSeats;
      empty.textContent = hasSeats ? "" : trip.empty || "Chưa có số giường.";
    }
    if (!hasSeats) return;

    let taken = 0;

    DECKS.forEach(({ suffix, label }) => {
      const deck = el("div", "bus__deck");
      deck.appendChild(el("h4", "bus__label", label));

      const body = el("div", "bus__body");
      const front = el("div", "bus__front");
      front.appendChild(el("span", "bus__wheel"));
      front.appendChild(el("span", "bus__front-text", "Đầu xe"));
      body.appendChild(front);

      const grid = el("div", "bus__grid");
      LAYOUT.flat().forEach((num) => {
        if (num === null) {
          grid.appendChild(el("span", "seat seat--aisle"));
          return;
        }
        const code = `${num}${suffix}`;
        const ours = booked.has(code);
        const name = ours ? (assignments[code] || "").trim() : "";

        let state = "seat--other";
        let text = "Khách khác";
        if (ours && name) {
          state = "seat--taken";
          text = name;
          taken += 1;
        } else if (ours) {
          state = "seat--booked";
          text = "Chưa xếp";
        }

        const seat = el("div", `seat ${state}`);
        seat.dataset.seat = code;
        seat.title = name
          ? `${code} · ${name}${FULL_NAMES[name] ? ` (${FULL_NAMES[name]})` : ""}`
          : `${code} · ${text}`;
        seat.appendChild(el("span", "seat__pillow"));
        seat.appendChild(el("span", "seat__code", code));
        seat.appendChild(el("span", "seat__name", text));
        grid.appendChild(seat);
      });
      body.appendChild(grid);

      deck.appendChild(body);
      bus.appendChild(deck);
    });

    setText("[data-seat-count]", taken);
    setText("[data-seat-booked]", booked.size);
    setText("[data-seat-total]", booked.size);
  };

  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    if (panel) panel.setAttribute("aria-labelledby", tab.id);
    if (focus) tab.focus();
    render(tab.dataset.trip);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next, true);
    });
  });

  const initial = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  if (initial) select(initial, false);
  else render("di");
})();
