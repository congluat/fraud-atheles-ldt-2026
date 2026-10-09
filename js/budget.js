/*
 * Thu chi: đọc 3 tab của Google Sheet qua CSV (số tiền trong sheet tính bằng nghìn đồng).
 *  - Chi:      Ngày | Hoạt động | Số tiền | Số người | Mỗi người | <tên từng người, đánh "x">...
 *  - Thu:      Ngày thu | <tên từng người> ... | Total
 *  - Tổng kết: dòng "Đã đóng" / "Đã xài" / "Dư / (Thiếu)" theo từng người,
 *              và các dòng "Tổng thu" / "Tổng chi" / "Quỹ còn lại" (giá trị ở cột 2).
 * data-sheet / data-pub: xem js/sheet.js.
 */
(function () {
  const root = document.querySelector("[data-budget]");
  if (!root) return;

  const { sheet, pub, gidChi, gidThu, gidSummary } = root.dataset;

  const UNIT = 1000;
  const PEOPLE_FROM = 5;
  const LIMIT = 5;
  const SUMMARY_LABEL = /tổng|\/\s*người|đã\s*(đóng|xài)/i;

  const $ = (sel) => root.querySelector(sel);
  const rowsEl = $("[data-budget-rows]");
  const peopleEl = $("[data-budget-people]");
  const moreBtn = $("[data-budget-more]");
  const statusEl = $("[data-budget-status]");

  const load = (gid) => window.SheetCsv.load({ sheet, pub, gid });

  const toNumber = (s) => Number(String(s || "").replace(/[^\d.-]/g, "")) || 0;
  const money = (n) => `${Math.round(n).toLocaleString("vi-VN")}đ`;
  const isMarked = (s) => String(s || "").trim().toLowerCase() === "x";
  const cell = (r, i) => String((r && r[i]) || "").trim();

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function parseChi(rows) {
    const people = (rows[0] || [])
      .slice(PEOPLE_FROM)
      .map((name, i) => ({ name: name.trim(), col: PEOPLE_FROM + i }))
      .filter((p) => p.name);

    const items = rows.slice(1)
      .filter((r) => cell(r, 1) && toNumber(r[2]) > 0 && !SUMMARY_LABEL.test(cell(r, 1)))
      .map((r) => {
        const joined = people.filter((p) => isMarked(r[p.col]));
        const amount = toNumber(r[2]) * UNIT;
        const count = toNumber(r[3]) || joined.length;
        return {
          date: cell(r, 0),
          title: cell(r, 1),
          amount,
          count,
          each: toNumber(r[4]) * UNIT || (count ? amount / count : 0),
          joined,
          skipped: people.filter((p) => !isMarked(r[p.col])),
        };
      });

    return { people, items };
  }

  function parseSummary(rows) {
    const names = (rows[0] || []).slice(1).map((s) => s.trim());
    const find = (re) => rows.find((r) => re.test(cell(r, 0)));
    const perPerson = (re) => {
      const r = find(re);
      return r ? names.map((_, i) => toNumber(r[i + 1]) * UNIT) : null;
    };
    const single = (re) => {
      const r = find(re);
      return r ? toNumber(r[1]) * UNIT : null;
    };

    const paid = perPerson(/^đã\s*đóng/i);
    const spent = perPerson(/^đã\s*xài/i);
    const balance = perPerson(/^dư/i);
    const people = names
      .map((name, i) => ({
        name,
        paid: paid ? paid[i] : null,
        spent: spent ? spent[i] : null,
        balance: balance ? balance[i] : paid && spent ? paid[i] - spent[i] : null,
      }))
      .filter((p) => p.name);

    return {
      people,
      totalIn: single(/^tổng\s*thu/i),
      totalOut: single(/^tổng\s*chi/i),
      remaining: single(/^quỹ\s*còn/i),
    };
  }

  function parseThu(rows) {
    const header = rows[0] || [];
    const totalCol = header.findIndex((h, i) => i > 0 && /^total$/i.test(String(h).trim()));
    const names = header.slice(1, totalCol > 0 ? totalCol : undefined).map((s) => s.trim());
    const rounds = rows.slice(1)
      .filter((r) => /\d/.test(cell(r, 0)))
      .map((r) => ({
        date: cell(r, 0),
        amount: toNumber(totalCol > 0 ? r[totalCol] : r[r.length - 1]) * UNIT,
        each: names.map((_, i) => toNumber(r[i + 1]) * UNIT),
      }))
      .filter((it) => it.amount > 0);
    return { names, rounds };
  }

  /* Tên giữa các tab có thể lệch (vd. "Vợ Lộc" / "Vợ Luật") → khớp theo tên, không thấy thì theo thứ tự cột. */
  const normName = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
  function matchIndex(names, name, fallback) {
    const i = names.findIndex((n) => normName(n) === normName(name));
    if (i >= 0) return i;
    return fallback < names.length ? fallback : -1;
  }

  function renderStats(chi, summary, rounds) {
    const totalOut = summary?.totalOut ?? chi.items.reduce((sum, it) => sum + it.amount, 0);
    const totalIn = summary?.totalIn ?? (rounds ? rounds.reduce((sum, it) => sum + it.amount, 0) : null);
    const remaining = summary?.remaining ?? (totalIn == null ? null : totalIn - totalOut);

    $("[data-budget-paid]").textContent = totalIn == null ? "—" : money(totalIn);
    $("[data-budget-paid-hint]").textContent = rounds && rounds.length
      ? `${rounds.length} đợt · ${rounds.map((r) => r.date).join(", ")}`
      : "";
    $("[data-budget-total]").textContent = money(totalOut);
    $("[data-budget-count]").textContent = String(chi.items.length);
    $("[data-budget-last]").textContent = chi.items.length
      ? `Gần nhất ${chi.items[chi.items.length - 1].date}`
      : "";

    const node = $("[data-budget-balance]");
    node.classList.remove("is-plus", "is-minus");
    if (remaining == null) {
      node.textContent = "—";
      return;
    }
    node.textContent = remaining < 0 ? `(${money(-remaining)})` : money(remaining);
    if (remaining > 0) node.classList.add("is-plus");
    if (remaining < 0) node.classList.add("is-minus");
    $("[data-budget-balance-hint]").textContent =
      remaining < 0 ? "Quỹ đang âm · Tổng thu − Tổng chi" : "Tổng thu − Tổng chi";
  }

  function renderItems({ people, items }) {
    const newestFirst = items.slice().reverse();
    rowsEl.replaceChildren(
      ...newestFirst.map((it, i) => {
        const tr = el("tr");
        if (i >= LIMIT) {
          tr.hidden = true;
          tr.dataset.extra = "";
        }
        tr.append(el("td", "budget__date", it.date));
        const title = el("td", "budget__title");
        title.append(el("strong", null, it.title));
        if (it.skipped.length && it.skipped.length < people.length) {
          title.append(el("span", "budget__skip", `Không tính: ${it.skipped.map((p) => p.name).join(", ")}`));
        }
        tr.append(title);
        tr.append(el("td", "num budget__amount", money(it.amount)));
        tr.append(el("td", "num budget__count", String(it.count)));
        tr.append(el("td", "num budget__each", money(it.each)));
        return tr;
      })
    );

    const total = items.reduce((sum, it) => sum + it.amount, 0);
    const totalRow = el("tr", "budget__total");
    totalRow.append(
      el("td", "budget__date"),
      el("td", "budget__title", "Tổng chi"),
      el("td", "num budget__amount", money(total)),
      el("td", "budget__count"),
      el("td", "budget__each")
    );
    rowsEl.append(totalRow);

    const extra = items.length - LIMIT;
    moreBtn.hidden = extra <= 0;
    if (extra > 0) {
      const btnText = (open) => (open ? "Thu gọn" : `Xem tất cả ${items.length} khoản`);
      moreBtn.textContent = btnText(false);
      moreBtn.onclick = () => {
        const open = moreBtn.getAttribute("aria-expanded") !== "true";
        rowsEl.querySelectorAll("[data-extra]").forEach((tr) => { tr.hidden = !open; });
        moreBtn.setAttribute("aria-expanded", String(open));
        moreBtn.textContent = btnText(open);
      };
    }
  }

  const balanceText = (n) => (n > 0 ? `Dư ${money(n)}` : n < 0 ? `(Thiếu ${money(-n)})` : "Đủ");

  function renderPerson(p, i, chi, thu) {
    const dialog = root.querySelector("[data-person-dialog]");
    const body = dialog.querySelector("[data-person-body]");
    dialog.querySelector("[data-person-title]").textContent = p.name;

    const chiIdx = matchIndex(chi.people.map((c) => c.name), p.name, i);
    const chiPerson = chi.people[chiIdx];
    const spends = chiPerson ? chi.items.filter((it) => it.joined.includes(chiPerson)) : [];
    const skipped = chiPerson ? chi.items.filter((it) => !it.joined.includes(chiPerson)) : [];

    const thuIdx = thu ? matchIndex(thu.names, p.name, i) : -1;
    const payments = thuIdx < 0 ? [] : thu.rounds
      .map((r, n) => ({ round: n + 1, date: r.date, amount: r.each[thuIdx] }))
      .filter((r) => r.amount > 0);

    const paid = p.paid ?? payments.reduce((s, r) => s + r.amount, 0);
    const spent = p.spent ?? spends.reduce((s, it) => s + it.each, 0);
    const balance = p.balance ?? paid - spent;

    const stats = el("ul", "person__stats");
    [["Đã đóng", money(paid)], ["Đã xài", money(spent)], ["Dư / (Thiếu)", balanceText(balance)]].forEach(([k, v], n) => {
      const li = el("li");
      const value = el("strong", "person__stat-value", v);
      if (n === 2) value.classList.add(balance > 0 ? "is-plus" : balance < 0 ? "is-minus" : "is-even");
      li.append(el("span", "person__stat-label", k), value);
      stats.append(li);
    });

    const block = (title, rows, total, empty) => {
      const section = el("section", "person__block");
      section.append(el("h4", "menu__group-title", title));
      if (!rows.length) {
        section.append(el("p", "placeholder", empty));
        return section;
      }
      const ul = el("ul", "person__rows");
      ul.append(...rows);
      if (total != null) {
        const li = el("li", "person__row person__row--total");
        li.append(el("span", "person__date"), el("span", "person__what", "Tổng"), el("span", "person__amount", money(total)));
        ul.append(li);
      }
      section.append(ul);
      return section;
    };

    const payRows = payments.map((r) => {
      const li = el("li", "person__row");
      li.append(el("span", "person__date", r.date), el("span", "person__what", `Đợt ${r.round}`), el("span", "person__amount", money(r.amount)));
      return li;
    });

    const spendRows = spends.map((it) => {
      const li = el("li", "person__row");
      const what = el("span", "person__what");
      what.append(el("strong", null, it.title), el("span", "person__sub", `${money(it.amount)} ÷ ${it.count} người`));
      li.append(el("span", "person__date", it.date), what, el("span", "person__amount", money(it.each)));
      return li;
    });

    const payLink = root.querySelector(".budget__pay");
    const parts = [stats];
    if (balance < 0 && payLink) {
      const pay = payLink.cloneNode(true);
      pay.classList.add("person__pay");
      pay.querySelector(".budget__pay-label").textContent = `Đóng thêm ${money(-balance)} qua MoMo`;
      parts.push(pay);
    }
    parts.push(
      block(`Đã đóng · ${payments.length} lần`, payRows, payments.length ? payments.reduce((s, r) => s + r.amount, 0) : null, "Chưa đóng đợt nào."),
      block(`Đã chi · ${spends.length} khoản`, spendRows, spends.length ? spends.reduce((s, it) => s + it.each, 0) : null, "Chưa có khoản chi nào.")
    );
    if (skipped.length) {
      parts.push(el("p", "hint person__skip", `Không tính: ${skipped.map((it) => `${it.title} (${it.date})`).join(", ")}`));
    }
    body.replaceChildren(...parts);
    dialog.showModal();
  }

  function renderPeople(chi, summary, thu) {
    const people = summary
      ? summary.people
      : chi.people.map((p) => ({
          name: p.name,
          paid: null,
          spent: chi.items.reduce((sum, it) => sum + (it.joined.includes(p) ? it.each : 0), 0),
          balance: null,
        }));

    const dialog = root.querySelector("[data-person-dialog]");
    if (dialog && !dialog.dataset.ready) {
      dialog.dataset.ready = "1";
      dialog.querySelector("[data-person-close]").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    peopleEl.replaceChildren(
      ...people.map((p, i) => {
        const li = el("li");
        if (dialog) {
          li.classList.add("is-clickable");
          li.tabIndex = 0;
          li.setAttribute("role", "button");
          li.setAttribute("aria-haspopup", "dialog");
          li.setAttribute("aria-label", `Xem chi tiết đóng / chi của ${p.name}`);
          const open = () => renderPerson(p, i, chi, thu);
          li.addEventListener("click", open);
          li.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          });
        }
        li.append(el("span", "budget__name", p.name));
        const lines = el("dl", "budget__lines");
        const line = (k, v) => {
          const row = el("div");
          row.append(el("dt", null, k), el("dd", null, v));
          lines.append(row);
        };
        if (p.paid != null) line("Đóng", money(p.paid));
        if (p.spent != null) line("Xài", money(p.spent));
        li.append(lines);
        if (p.balance != null) {
          const bal = el("span", "budget__balance");
          if (p.balance > 0) {
            bal.textContent = `Dư ${money(p.balance)}`;
            bal.classList.add("is-plus");
          } else if (p.balance < 0) {
            bal.textContent = `(Thiếu ${money(-p.balance)})`;
            bal.classList.add("is-minus");
          } else {
            bal.textContent = "Đủ";
          }
          li.append(bal);
        }
        return li;
      })
    );
  }

  const optional = (gid, parse) =>
    gid
      ? load(gid).then(parse).catch((err) => {
          console.warn("Không tải được tab", gid, err);
          return null;
        })
      : Promise.resolve(null);

  Promise.all([load(gidChi).then(parseChi), optional(gidSummary, parseSummary), optional(gidThu, parseThu)])
    .then(([chi, summary, thu]) => {
      if (!chi.items.length) throw new Error("Tab Chi chưa có khoản nào");
      renderStats(chi, summary, thu ? thu.rounds : null);
      renderItems(chi);
      renderPeople(chi, summary, thu);
    })
    .catch((err) => {
      console.warn("Không tải được sheet thu chi:", err);
      rowsEl.replaceChildren();
      const tr = el("tr");
      const td = el("td", "placeholder", "Không tải được Google Sheet — mở link bên dưới để xem trực tiếp.");
      td.colSpan = 5;
      tr.append(td);
      rowsEl.append(tr);
      statusEl.classList.add("budget__status--error");
    });
})();
