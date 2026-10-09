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
    return rows.slice(1)
      .filter((r) => /\d/.test(cell(r, 0)))
      .map((r) => ({ date: cell(r, 0), amount: toNumber(r[r.length - 1]) * UNIT }))
      .filter((it) => it.amount > 0);
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

  function renderPeople(chi, summary) {
    const people = summary
      ? summary.people
      : chi.people.map((p) => ({
          name: p.name,
          paid: null,
          spent: chi.items.reduce((sum, it) => sum + (it.joined.includes(p) ? it.each : 0), 0),
          balance: null,
        }));

    peopleEl.replaceChildren(
      ...people.map((p) => {
        const li = el("li");
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
    .then(([chi, summary, rounds]) => {
      if (!chi.items.length) throw new Error("Tab Chi chưa có khoản nào");
      renderStats(chi, summary, rounds);
      renderItems(chi);
      renderPeople(chi, summary);
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
