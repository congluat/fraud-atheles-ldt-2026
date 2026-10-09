/* Nút lọc danh sách thành viên theo cự ly (đọc data-km trên từng dòng). */
(function () {
  const bar = document.querySelector("[data-mem-filter]");
  const table = document.querySelector("[data-members]");
  if (!bar || !table) return;

  const rows = [...table.tBodies[0].rows];
  const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "15K", label: "15K" },
    { key: "55K", label: "55K" },
    { key: "85K", label: "85K" },
    { key: "none", label: "Không chạy" },
  ];

  const buttons = FILTERS.map(({ key, label }) => {
    const n = key === "all" ? rows.length : rows.filter((r) => r.dataset.km === key).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mem-filter__btn";
    btn.dataset.key = key;
    btn.setAttribute("aria-pressed", String(key === "all"));
    btn.disabled = n === 0;
    btn.innerHTML = `${label} <span class="mem-filter__n">${n}</span>`;
    btn.addEventListener("click", () => apply(key));
    return btn;
  });
  bar.append(...buttons);

  function apply(key) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key)));
    rows.forEach((r) => { r.hidden = key !== "all" && r.dataset.km !== key; });
  }
})();
