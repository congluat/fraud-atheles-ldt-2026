/*
 * Đồ bắt buộc trên mobile: dựng danh sách theo từng cự ly từ bảng .gear
 * (ô class "m" = bắt buộc, "r" = khuyến khích). Bảng vẫn hiện trên desktop.
 */
(function () {
  const table = document.querySelector("table.gear");
  const wrap = table && table.closest(".table-wrap");
  if (!wrap) return;

  const distances = [...table.tHead.rows[0].cells].slice(1).map((th) => th.textContent.trim());
  const items = [...table.tBodies[0].rows].map((tr) => ({
    name: tr.cells[0].textContent.trim(),
    levels: [...tr.cells].slice(1).map((td) => (td.classList.contains("m") ? "m" : td.classList.contains("r") ? "r" : "")),
  }));

  const root = document.createElement("div");
  root.className = "gear-pick";
  const tabs = document.createElement("div");
  tabs.className = "gear-pick__tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Chọn cự ly");
  const panel = document.createElement("div");
  panel.className = "gear-pick__panel";
  panel.setAttribute("role", "tabpanel");
  panel.id = "gear-pick-panel";

  const buttons = distances.map((d, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gear-pick__tab";
    btn.id = `gear-pick-tab-${i}`;
    btn.textContent = d;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-controls", panel.id);
    btn.addEventListener("click", () => select(i));
    btn.addEventListener("keydown", (e) => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = (i + step + distances.length) % distances.length;
      select(next);
      buttons[next].focus();
    });
    return btn;
  });
  tabs.append(...buttons);

  function group(title, level, col) {
    const list = items.filter((it) => it.levels[col] === level);
    if (!list.length) return [];
    const head = document.createElement("p");
    head.className = `gear-pick__group gear-pick__group--${level}`;
    head.textContent = `${title} · ${list.length}`;
    const ul = document.createElement("ul");
    ul.className = `gear-pick__list gear-pick__list--${level}`;
    list.forEach((it) => {
      const li = document.createElement("li");
      li.textContent = it.name;
      ul.append(li);
    });
    return [head, ul];
  }

  function select(col) {
    buttons.forEach((b, i) => {
      b.setAttribute("aria-selected", String(i === col));
      b.tabIndex = i === col ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", buttons[col].id);
    panel.replaceChildren(...group("Bắt buộc", "m", col), ...group("Khuyến khích", "r", col));
  }

  root.append(tabs, panel);
  wrap.classList.add("gear-table");
  const legend = wrap.nextElementSibling;
  if (legend && legend.classList.contains("legend")) legend.classList.add("gear-legend");
  wrap.after(root);
  select(0);
})();
