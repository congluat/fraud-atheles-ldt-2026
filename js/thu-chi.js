/*
 * Trang thu chi riêng (thu-chi.html): đọc 3 tab của Google Sheet chi tiêu qua CSV (js/sheet.js),
 * nhóm theo cặp và tính quyết toán: ai cần nộp thêm, quỹ hoàn lại cho ai.
 * Số tiền trong sheet tính bằng nghìn đồng.
 *  - Chi:      Ngày | Hoạt động | Số tiền | Số suất | Mỗi suất | <tên: "x" = 1 suất, số = số suất, trống = không>
 *  - Thu:      Ngày thu | <tên> ... | Total
 *  - Tổng kết: "Đã đóng" / "Đã xài" / "Dư / (Thiếu)" theo người; "Tổng thu" / "Tổng chi" / "Quỹ còn lại".
 */
(function () {
  const root = document.querySelector("[data-thu-chi]");
  if (!root) return;

  /* Cặp đi cùng nhau — tên phải trùng tên cột trong sheet. Ai không có ở đây thì tính lẻ. */
  const GROUPS = [
    { label: "Luật & Thảo", members: ["Luật", "Vợ Luật"] },
    { label: "Nhà Lộc · Zino", members: ["Lộc", "Vợ Lộc"] },
    { label: "Timmie & vợ", members: ["Timmie", "Vợ Timmie"] },
    { label: "Tú & Thuỳ", members: ["Tú", "Thuỳ"] },
    { label: "Trí & Dori", members: ["Trí", "Dori"] },
    { label: "Bơ & Bíp", members: ["Amber", "Bíp"] },
    { label: "Luna & Quân", members: ["Luna", "Quân"] },
  ];
  /* Tên hiển thị khác tên cột */
  const DISPLAY = { "Vợ Luật": "Thảo", Amber: "Bơ (Amber)" };

  const { sheet, pub, gidChi, gidThu, gidSummary } = root.dataset;
  const UNIT = 1000;
  const PEOPLE_FROM = 5;
  const SUMMARY_LABEL = /^(tổng|đã\s*(đóng|xài))/i;

  const $ = (sel) => root.querySelector(sel);
  const cell = (r, i) => String((r && r[i]) || "").trim();
  const toNumber = (s) => Number(String(s || "").replace(/[^\d.-]/g, "")) || 0;
  const norm = (s) =>
    String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
  const show = (name) => DISPLAY[name] || name;
  const money = (n) => `${Math.round(n).toLocaleString("vi-VN")}đ`;
  /* Quyết toán làm tròn tới nghìn đồng cho dễ chuyển khoản */
  const kRound = (n) => Math.round(n / UNIT) * UNIT;
  const signed = (n) => (Math.round(n / UNIT) === 0 ? "0đ" : `${n > 0 ? "+" : "−"}${money(Math.abs(kRound(n)))}`);
  const weightOf = (s) => {
    const v = String(s || "").trim();
    if (v.toLowerCase() === "x") return 1;
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- đọc sheet ---------- */

  function parseChi(rows) {
    let h = rows.findIndex((r) => /ho[aạ]t/i.test(cell(r, 1)));
    if (h < 0) h = 0;
    const names = (rows[h] || []).slice(PEOPLE_FROM).map((s) => s.trim());
    const items = rows
      .slice(h + 1)
      .filter((r) => cell(r, 1) && toNumber(r[2]) !== 0 && !SUMMARY_LABEL.test(cell(r, 1)))
      .map((r) => {
        const weights = {};
        names.forEach((n, i) => {
          const w = weightOf(r[PEOPLE_FROM + i]);
          if (n && w > 0) weights[norm(n)] = w;
        });
        const total = Object.values(weights).reduce((s, w) => s + w, 0);
        const amount = toNumber(r[2]) * UNIT;
        const uneven = Object.values(weights).some((w) => w !== 1);
        return {
          date: cell(r, 0),
          title: cell(r, 1),
          amount,
          uneven,
          count: Object.keys(weights).length,
          share: (name) => (total ? ((weights[norm(name)] || 0) * amount) / total : 0),
        };
      });
    return { names: names.filter(Boolean), items };
  }

  function parseThu(rows) {
    let h = rows.findIndex((r) => r.some((c, i) => i > 0 && /^total$/i.test(String(c).trim())));
    if (h < 0) h = 0;
    const header = rows[h] || [];
    const totalCol = header.findIndex((c, i) => i > 0 && /^total$/i.test(String(c).trim()));
    const names = header.slice(1, totalCol > 0 ? totalCol : undefined).map((s) => s.trim());
    const rounds = rows
      .slice(h + 1)
      .filter((r) => /\d/.test(cell(r, 0)))
      .map((r) => {
        const by = {};
        names.forEach((n, i) => {
          const v = toNumber(r[i + 1]) * UNIT;
          if (n && v) by[norm(n)] = v;
        });
        const amount = Object.values(by).reduce((s, v) => s + v, 0);
        return { date: cell(r, 0), amount, of: (name) => by[norm(name)] || 0, by };
      })
      .filter((it) => it.amount !== 0); // số âm = quỹ hoàn lại
    return { names: names.filter(Boolean), rounds };
  }

  function parseSummary(rows) {
    const find = (re) => rows.find((r) => re.test(cell(r, 0)));
    const paidRow = find(/^đã\s*đóng/i);
    const hIdx = paidRow ? rows.indexOf(paidRow) - 1 : 0;
    const names = (rows[Math.max(hIdx, 0)] || []).slice(1).map((s) => s.trim());
    const perPerson = (re) => {
      const r = find(re);
      if (!r) return null;
      const out = {};
      names.forEach((n, i) => n && (out[norm(n)] = toNumber(r[i + 1]) * UNIT));
      return out;
    };
    const single = (re) => {
      const r = find(re);
      return r ? toNumber(r[1]) * UNIT : null;
    };
    return {
      names: names.filter(Boolean),
      paid: perPerson(/^đã\s*đóng/i),
      spent: perPerson(/^đã\s*xài/i),
      totalIn: single(/^tổng\s*thu/i),
      totalOut: single(/^tổng\s*chi/i),
      remaining: single(/^quỹ\s*còn/i),
    };
  }

  /* ---------- dựng dữ liệu theo người / theo cặp ---------- */

  function build(chi, thu, summary) {
    const names = summary?.names?.length ? summary.names : chi.names;
    const people = names.map((name) => {
      const key = norm(name);
      /* Tính từ từng dòng Thu/Chi cho chính xác (tab Tổng kết đã làm tròn tới nghìn). */
      const paid = thu.rounds.length ? thu.rounds.reduce((s, r) => s + r.of(name), 0) : summary?.paid?.[key] ?? 0;
      const spent = chi.items.length ? chi.items.reduce((s, it) => s + it.share(name), 0) : summary?.spent?.[key] ?? 0;
      return { name, key, paid, spent, balance: paid - spent };
    });
    const byKey = Object.fromEntries(people.map((p) => [p.key, p]));

    const used = new Set();
    const couples = [];
    GROUPS.forEach((g) => {
      const members = g.members.map((m) => byKey[norm(m)]).filter(Boolean);
      if (!members.length) return;
      members.forEach((m) => used.add(m.key));
      couples.push(unit(g.label, members));
    });
    people.filter((p) => !used.has(p.key)).forEach((p) => couples.push(unit(show(p.name), [p])));

    const singles = people.map((p) => unit(show(p.name), [p]));
    return { people, couples, singles };
  }

  function unit(label, members) {
    const sum = (k) => members.reduce((s, m) => s + m[k], 0);
    // Làm tròn tới nghìn theo từng người (như tab Tổng kết); cả nhóm lệch dưới 1.000đ thì coi như đủ
    const balance = Math.abs(sum("balance")) < UNIT ? 0 : members.reduce((s, m) => s + kRound(m.balance), 0);
    return { label, members, paid: sum("paid"), spent: sum("spent"), balance };
  }

  /* ---------- vẽ ---------- */

  let state = null;
  let mode = "couple";

  function renderStats({ chi, thu, summary }) {
    const totalIn = thu.rounds.length ? thu.rounds.reduce((s, r) => s + r.amount, 0) : summary?.totalIn ?? 0;
    const totalOut = chi.items.length ? chi.items.reduce((s, it) => s + it.amount, 0) : summary?.totalOut ?? 0;
    const left = totalIn - totalOut;
    $('[data-stat="in"]').textContent = money(totalIn);
    $('[data-stat="out"]').textContent = money(totalOut);
    $('[data-stat="left"]').textContent = money(left);
    $('[data-stat="count"]').textContent = String(chi.items.length);
    return left;
  }

  function renderSettle(units, left) {
    const owe = units.filter((u) => u.balance < 0).sort((a, b) => a.balance - b.balance);
    const back = units.filter((u) => u.balance > 0).sort((a, b) => b.balance - a.balance);
    const amt = new Map(units.map((u) => [u, Math.abs(u.balance)]));
    const oweSum = owe.reduce((s, u) => s + amt.get(u), 0);
    let backSum = back.reduce((s, u) => s + amt.get(u), 0);

    /* Làm tròn từng người có thể làm tổng hoàn lệch vài nghìn so với quỹ thật:
       dồn phần lẻ vào khoản hoàn lớn nhất để tổng hoàn = quỹ còn + phần thu thêm. */
    const diff = backSum - (left + oweSum);
    let note = "";
    if (back.length && Math.abs(diff) >= 1 && Math.abs(diff) < 20 * UNIT) {
      amt.set(back[0], amt.get(back[0]) - diff);
      backSum -= diff;
      note = ` ${back[0].label} ${diff > 0 ? "bớt" : "thêm"} ${money(Math.abs(diff))} do làm tròn.`;
    }

    const fill = (sel, list, cls) => {
      const ul = $(sel);
      ul.replaceChildren();
      if (!list.length) ul.append(el("li", "tc-empty", "Không có ai."));
      list.forEach((u) => {
        const li = el("li");
        li.append(el("span", "tc-settle__name", u.label), el("span", `tc-amount ${cls}`, money(amt.get(u))));
        ul.append(li);
      });
    };
    fill("[data-settle-owe]", owe, "is-neg");
    fill("[data-settle-back]", back, "is-pos");
    $("[data-settle-owe-sum]").textContent = `Tổng: ${money(oweSum)}`;
    $("[data-settle-back-sum]").textContent = `Tổng: ${money(backSum)}`;
    $("[data-settle-lead]").textContent =
      (oweSum
        ? `Quỹ đang còn ${money(left)}. Khi thu đủ ${money(oweSum)} từ người thiếu, quỹ có ${money(left + oweSum)} để hoàn lại cho người dư.`
        : `Không còn ai thiếu. Quỹ còn ${money(left)}, hoàn lại hết cho người dư.`) + note;
  }


  function badge(n) {
    const r = Math.round(n / UNIT);
    const b = el("span", `tc-badge ${r < 0 ? "is-neg" : r > 0 ? "is-pos" : "is-done"}`);
    b.textContent = r < 0 ? `Thiếu ${money(-r * UNIT)}` : r > 0 ? `Dư ${money(r * UNIT)}` : "✓ Đã xong";
    return b;
  }

  function renderGroups(units) {
    const wrap = $("[data-groups]");
    wrap.replaceChildren();
    $("[data-groups-title]").textContent = mode === "couple" ? "Theo cặp" : "Từng người";

    units.forEach((u) => {
      const card = el("details", "tc-card");
      const sum = el("summary");
      const head = el("div", "tc-card__head");
      const title = el("div", "tc-card__title");
      title.append(el("strong", null, u.label));
      if (u.members.length > 1) title.append(el("span", "tc-sub", u.members.map((m) => show(m.name)).join(" · ")));
      head.append(title, badge(u.balance));

      const nums = el("dl", "tc-card__nums");
      [["Đã đóng", u.paid], ["Đã xài", u.spent]].forEach(([k, v]) => {
        const d = el("div");
        d.append(el("dt", null, k), el("dd", null, money(v)));
        nums.append(d);
      });
      sum.append(head, nums);
      card.append(sum);

      const body = el("div", "tc-card__body");

      if (u.members.length > 1) {
        const t = el("table", "tc-mini");
        const thead = el("thead");
        const hr = el("tr");
        ["", "Đóng", "Xài", "Dư/thiếu"].forEach((h) => hr.append(el("th", null, h)));
        thead.append(hr);
        const tb = el("tbody");
        u.members.forEach((m) => {
          const tr = el("tr");
          tr.append(el("td", null, show(m.name)), el("td", null, money(m.paid)), el("td", null, money(m.spent)));
          const td = el("td", Math.round(m.balance / UNIT) < 0 ? "is-neg" : "is-pos", signed(m.balance));
          tr.append(td);
          tb.append(tr);
        });
        t.append(thead, tb);
        body.append(t);
      }

      const spends = state.chi.items
        .map((it) => ({ it, v: u.members.reduce((s, m) => s + it.share(m.name), 0) }))
        .filter((x) => x.v > 0.5);
      body.append(el("h4", null, `Đã xài · ${spends.length} khoản`));
      const ls = el("ul", "tc-lines");
      spends.forEach(({ it, v }) => {
        const li = el("li");
        const who =
          u.members.length > 1
            ? u.members.filter((m) => it.share(m.name) > 0).map((m) => show(m.name)).join(", ")
            : "";
        const what = el("span", "tc-lines__what");
        what.append(el("span", "tc-date", it.date), el("span", null, it.title));
        if (who && who.split(", ").length < u.members.length) what.append(el("span", "tc-sub", `chỉ ${who}`));
        li.append(what, el("span", "tc-amount", money(v)));
        ls.append(li);
      });
      body.append(ls);

      const pays = state.thu.rounds
        .map((r) => ({ r, v: u.members.reduce((s, m) => s + r.of(m.name), 0) }))
        .filter((x) => x.v !== 0);
      body.append(el("h4", null, `Đã đóng / hoàn · ${pays.length} lần`));
      const lp = el("ul", "tc-lines");
      if (!pays.length) lp.append(el("li", "tc-empty", "Chưa đóng lần nào."));
      pays.forEach(({ r, v }) => {
        const li = el("li");
        const what = el("span", "tc-lines__what");
        what.append(el("span", "tc-date", r.date));
        if (u.members.length > 1)
          what.append(
            el("span", "tc-sub", u.members.filter((m) => r.of(m.name)).map((m) => `${show(m.name)} ${money(r.of(m.name))}`).join(" · "))
          );
        if (v < 0) what.append(el("span", "tc-sub", "Quỹ hoàn lại"));
        li.append(what, el("span", `tc-amount ${v < 0 ? "is-neg" : ""}`, money(v)));
        lp.append(li);
      });
      body.append(lp);

      card.append(body);
      wrap.append(card);
    });
  }

  function renderItems() {
    const ol = $("[data-items]");
    ol.replaceChildren();
    const names = state.people.map((p) => p.name);
    state.chi.items
      .slice()
      .reverse()
      .forEach((it) => {
        const li = el("li");
        const d = el("details", "tc-item");
        const s = el("summary");
        const what = el("span", "tc-lines__what");
        what.append(el("span", "tc-date", it.date), el("strong", null, it.title));
        what.append(el("span", "tc-sub", it.uneven ? `${it.count} người · chia theo phần` : `${it.count} người · ${money(it.amount / it.count)}/người`));
        s.append(what, el("span", "tc-amount", money(it.amount)));
        const chips = el("ul", "tc-chips");
        names.forEach((n) => {
          const v = it.share(n);
          if (v > 0) {
            const c = el("li");
            c.append(el("span", null, show(n)), el("b", null, money(v)));
            chips.append(c);
          }
        });
        const out = names.filter((n) => !(it.share(n) > 0)).map(show);
        d.append(s, chips);
        if (out.length) d.append(el("p", "tc-sub tc-out", `Không tham gia: ${out.join(", ")}`));
        li.append(d);
        ol.append(li);
      });
  }

  function renderRounds() {
    const ol = $("[data-rounds]");
    ol.replaceChildren();
    const names = state.people.map((p) => p.name);
    state.thu.rounds
      .slice()
      .reverse()
      .forEach((r) => {
        const li = el("li");
        const d = el("details", "tc-item");
        const s = el("summary");
        const payers = names.filter((n) => r.of(n) !== 0);
        const refund = r.amount < 0;
        const what = el("span", "tc-lines__what");
        what.append(
          el("strong", null, r.date),
          el("span", "tc-sub", refund ? `Quỹ hoàn lại · ${payers.length} người` : `${payers.length} người đóng`)
        );
        s.append(what, el("span", `tc-amount ${refund ? "is-neg" : "is-pos"}`, money(r.amount)));
        const chips = el("ul", "tc-chips");
        payers.forEach((n) => {
          const c = el("li");
          c.append(el("span", null, show(n)), el("b", null, money(r.of(n))));
          chips.append(c);
        });
        d.append(s, chips);
        li.append(d);
        ol.append(li);
      });
  }

  function render() {
    const units = mode === "couple" ? state.couples : state.singles;
    renderSettle(units, state.left);
    renderGroups(units);
    root.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
  }

  /* ---------- tải ---------- */

  const load = (gid) => window.SheetCsv.load({ sheet, pub, gid });
  const statusEl = $("[data-status]");

  function refresh() {
    statusEl.textContent = "Đang tải số liệu…";
    return Promise.all([
      load(gidChi).then(parseChi),
      load(gidThu).then(parseThu),
      load(gidSummary).then(parseSummary).catch(() => null),
    ])
      .then(([chi, thu, summary]) => {
        state = { chi, thu, summary, ...build(chi, thu, summary) };
        state.left = renderStats(state);
        render();
        renderItems();
        renderRounds();
        const t = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        statusEl.textContent = `Cập nhật lúc ${t}`;
      })
      .catch((err) => {
        console.error(err);
        statusEl.textContent = "Không tải được Google Sheet. Thử tải lại sau.";
      });
  }

  root.querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      if (state) render();
    })
  );
  $("[data-refresh]").addEventListener("click", refresh);
  refresh();
})();
