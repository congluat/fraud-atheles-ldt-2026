/*
 * Ăn uống: đọc tab "Lịch trình" của sheet ăn uống.
 * Cột: Ngày | Buổi | Plan | Địa chỉ | Google Map. Ô Ngày chỉ ghi ở dòng đầu mỗi ngày.
 * Gala dinner: tab menu, phần chọn món nằm dưới bảng menu, bắt đầu từ dòng có ô "Danh mục":
 *   STT | Danh mục | Tên món | Số lượng | _ | Quy cách | Đơn giá | Thành tiền | Ghi chú
 *   dòng tổng: Tên món trống, Thành tiền = tổng, Ghi chú = bình quân / người.
 */
(function () {
  const root = document.querySelector("[data-food]");
  if (!root) return;

  const { sheet, pub, gid, gidMenu, year } = root.dataset;
  const daysEl = root.querySelector("[data-food-days]");
  const gala = document.querySelector("[data-gala]");
  const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const MEAL_ICONS = { "sáng": "☀", "trưa": "◐", "chiều": "◑", "tối": "☾" };

  const cell = (r, i) => String((r && r[i]) || "").replace(/\s+/g, " ").trim();
  const lines = (r, i) => String((r && r[i]) || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function dayLabel(raw) {
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})/);
    if (!m) return { title: raw, sub: "" };
    const date = new Date(Number(year), Number(m[2]) - 1, Number(m[1]));
    return {
      title: `${WEEKDAYS[date.getDay()]}`,
      sub: `${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}`,
    };
  }

  function parse(rows) {
    const days = [];
    let current = null;
    rows.slice(1).forEach((r) => {
      if (cell(r, 0)) {
        current = { date: cell(r, 0), meals: [] };
        days.push(current);
      }
      if (!current) return;
      const plan = lines(r, 2);
      if (!plan.length) return;
      current.meals.push({
        slot: cell(r, 1),
        plan,
        address: cell(r, 3),
        link: cell(r, 4),
      });
    });
    return days.filter((d) => d.meals.length);
  }

  function renderMeal(meal) {
    const text = meal.plan.join(" ");
    const kind = /race\s*day/i.test(text) ? "race" : /tự\s*túc/i.test(text) ? "free" : "";
    const li = el("li", `meal${kind ? ` meal--${kind}` : ""}`);

    const slot = el("span", "meal__slot");
    const icon = MEAL_ICONS[meal.slot.toLowerCase()];
    if (icon) slot.append(el("span", "meal__icon", icon));
    slot.append(meal.slot);
    li.append(slot);

    const body = el("div", "meal__body");
    const main = meal.plan[meal.plan.length - 1];
    if (meal.plan.length > 1) body.append(el("span", "meal__label", meal.plan.slice(0, -1).join(" · ")));
    body.append(el("strong", "meal__name", main));

    if (meal.address || meal.link) {
      const where = el(meal.link ? "a" : "span", "meal__where");
      where.textContent = meal.address || "Xem link";
      if (meal.link) {
        where.href = meal.link;
        where.target = "_blank";
        where.rel = "noopener";
        where.append(el("span", "meal__arrow", " ↗"));
      }
      body.append(where);
    }
    if (gala && /gala/i.test(text)) {
      const more = el("a", "meal__more", "Xem món đã chọn ↓");
      more.href = `#${gala.id}`;
      body.append(more);
    }
    li.append(body);
    return li;
  }

  const toNumber = (s) => Number(String(s || "").replace(/[^\d]/g, "")) || 0;
  const money = (n) => `${n.toLocaleString("vi-VN")}đ`;

  const orderStart = (rows) => rows.findIndex((r) => /^danh\s*mục$/i.test(cell(r, 1)));

  /* Full menu: STT | Phân loại | Tên món / Combo | Chi tiết / Quy cách | Đơn giá, phía trên phần chọn món. */
  function parseMenu(rows) {
    const end = orderStart(rows);
    return rows.slice(1, end < 0 ? undefined : end)
      .filter((r) => cell(r, 2))
      .map((r) => ({ group: cell(r, 1) || "Khác", name: cell(r, 2), spec: cell(r, 3), price: toNumber(r[4]) }));
  }

  function parseOrder(rows) {
    const start = orderStart(rows);
    if (start < 0) return null;
    const items = [];
    let total = 0;
    let note = "";
    rows.slice(start + 1).forEach((r) => {
      if (cell(r, 2)) {
        items.push({
          group: cell(r, 1) || "Khác",
          name: cell(r, 2),
          qty: cell(r, 3),
          spec: cell(r, 5),
          price: toNumber(r[6]),
          amount: toNumber(r[7]),
          note: cell(r, 8),
        });
      } else if (toNumber(r[7])) {
        total = toNumber(r[7]);
        note = cell(r, 8);
      }
    });
    return { items, total: total || items.reduce((s, it) => s + it.amount, 0), note };
  }

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();

  function renderMenu(menu, order) {
    const dialog = gala.querySelector("[data-menu-dialog]");
    const list = dialog.querySelector("[data-menu-list]");
    const search = dialog.querySelector("[data-menu-search]");
    const openBtn = gala.querySelector("[data-menu-open]");
    const chosenNames = (order ? order.items : []).map((it) => norm(it.name.replace(/\s*\(.*\)$/, "")));
    const isChosen = (name) => {
      const n = norm(name);
      return chosenNames.some((c) => c === n || c.startsWith(`${n} `));
    };

    const groups = new Map();
    menu.forEach((it) => {
      if (!groups.has(it.group)) groups.set(it.group, []);
      groups.get(it.group).push(it);
    });

    const sections = [...groups].map(([name, items]) => {
      const section = el("section", "menu__group");
      section.append(el("h4", "menu__group-title", name));
      const ul = el("ul", "menu__items");
      items.forEach((it) => {
        const li = el("li", "menu__item");
        li.dataset.search = norm(`${it.name} ${it.spec} ${name}`);
        const top = el("div", "menu__item-top");
        const title = el("strong", "menu__item-name", it.name);
        if (isChosen(it.name)) {
          li.classList.add("is-chosen");
          title.append(el("span", "menu__chosen", "Đã chọn"));
        }
        top.append(title, el("span", "menu__item-price", it.price ? money(it.price) : ""));
        li.append(top);
        if (it.spec) li.append(el("span", "menu__item-spec", it.spec));
        ul.append(li);
      });
      section.append(ul);
      return section;
    });
    const empty = el("p", "placeholder menu__empty", "Không có món nào khớp.");
    empty.hidden = true;
    list.replaceChildren(...sections, empty);

    search.addEventListener("input", () => {
      const q = norm(search.value);
      let shown = 0;
      sections.forEach((section) => {
        let any = false;
        section.querySelectorAll(".menu__item").forEach((li) => {
          const match = !q || li.dataset.search.includes(q);
          li.hidden = !match;
          any = any || match;
        });
        section.hidden = !any;
        if (any) shown++;
      });
      empty.hidden = shown > 0;
    });

    openBtn.textContent = `Xem full menu · ${menu.length} món`;
    openBtn.hidden = false;
    openBtn.addEventListener("click", () => {
      dialog.showModal();
      search.focus();
    });
    dialog.querySelector("[data-menu-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  function renderOrder(order) {
    const body = gala.querySelector("[data-gala-body]");
    if (!order || !order.items.length) {
      body.replaceChildren(el("p", "placeholder", "Chưa chọn món."));
      return;
    }

    const stats = el("ul", "gala__stats");
    const stat = (label, value) => {
      const li = el("li");
      li.append(el("span", "gala__stat-label", label), el("strong", "gala__stat-value", value));
      stats.append(li);
    };
    stat("Tổng", money(order.total));
    if (order.note) stat("Bình quân", order.note.replace(/^trung bình\s*/i, ""));
    stat("Số món", String(order.items.length));

    const groups = new Map();
    order.items.forEach((it) => {
      if (!groups.has(it.group)) groups.set(it.group, []);
      groups.get(it.group).push(it);
    });

    const grid = el("div", "gala__groups");
    groups.forEach((items, name) => {
      const block = el("section", "gala__group");
      block.append(el("h4", "gala__group-title", name));
      const ul = el("ul", "gala__items");
      items.forEach((it) => {
        const li = el("li", "gala__item");
        const top = el("div", "gala__item-top");
        top.append(el("strong", "gala__item-name", it.name), el("span", "gala__item-amount", money(it.amount)));
        const meta = [it.qty && `SL ${it.qty}`, it.spec, it.price && `đơn giá ${money(it.price)}`].filter(Boolean).join(" · ");
        li.append(top, el("span", "gala__item-meta", meta));
        if (it.note) li.append(el("span", "gala__item-note", it.note));
        ul.append(li);
      });
      block.append(ul);
      grid.append(block);
    });

    body.replaceChildren(stats, grid);
  }

  function render(days) {
    if (!days.length) throw new Error("Tab Lịch trình chưa có món nào");
    daysEl.replaceChildren(
      ...days.map((day) => {
        const { title, sub } = dayLabel(day.date);
        const card = el("article", "food-day");
        const head = el("header", "food-day__head");
        head.append(el("h3", "food-day__title", title), el("span", "food-day__date", sub));
        const list = el("ol", "food-day__meals");
        list.append(...day.meals.map(renderMeal));
        card.append(head, list);
        return card;
      })
    );
  }

  window.SheetCsv.load({ sheet, pub, gid })
    .then((rows) => render(parse(rows)))
    .catch((err) => {
      console.warn("Không tải được sheet ăn uống:", err);
      daysEl.replaceChildren(el("p", "placeholder", "Không tải được Google Sheet — mở link bên dưới để xem trực tiếp."));
    });

  if (gala && gidMenu) {
    window.SheetCsv.load({ sheet, pub, gid: gidMenu })
      .then((rows) => {
        const order = parseOrder(rows);
        renderOrder(order);
        const menu = parseMenu(rows);
        if (menu.length) renderMenu(menu, order);
      })
      .catch((err) => {
        console.warn("Không tải được menu gala:", err);
        gala.querySelector("[data-gala-body]").replaceChildren(el("p", "placeholder", "Không tải được menu từ Google Sheet."));
      });
  }
})();
