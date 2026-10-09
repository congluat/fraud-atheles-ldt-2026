// Sơ đồ 2 villa · chia phòng (Villa 1 = villa cũ, Villa 2 = villa mới)
// floors: liệt kê từ tầng cao xuống trệt
// room.who = người ở; room.tentative = true khi chưa chốt chắc phòng
// villa.pending = người đã biết villa/tầng nhưng chưa chốt phòng cụ thể
// floor.common = tầng không có phòng ngủ (hiện 1 ô mô tả)
const VILLAS = [
  {
    name: "Villa 1",
    meta: "8 phòng · trệt + 3 lầu",
    floors: [
      {
        label: "Lầu 3",
        rooms: [{ no: 8, bed: "Phòng đơn", wc: "WC riêng + ngoài", who: ["Luna", "Quân"] }],
      },
      {
        label: "Lầu 2",
        rooms: [
          { no: 5, bed: "Phòng đơn", wc: "WC ngoài", who: ["Linh Đậu"] },
          { no: 6, bed: "Phòng đôi", wc: "WC ngoài", who: ["Lệ"] },
          { no: 7, bed: "Phòng đơn", wc: "WC riêng", who: ["Thy"] },
        ],
      },
      {
        label: "Lầu 1",
        rooms: [
          { no: 2, bed: "Phòng đơn", wc: "WC ngoài", who: ["Lộc"] },
          { no: 3, bed: "Phòng đôi", wc: "WC ngoài", who: ["Đăng", "Thành"] },
          { no: 4, bed: "Phòng đơn", wc: "WC riêng", who: ["Luật", "Vợ Luật"] },
        ],
      },
      {
        label: "Trệt",
        ground: true,
        rooms: [{ no: 1, bed: "Phòng đơn", wc: "WC ngoài", who: [] }],
      },
    ],
  },
  {
    name: "Villa 2",
    meta: "4 phòng ngủ · trệt + 2 lầu",
    floors: [
      {
        label: "Lầu 2",
        rooms: [
          { no: 2, bed: "Giường 1m8", wc: "View kính góc L", who: ["Amber", "Bịp"] },
          { no: 4, bed: "Giường 1m6", wc: "Ban công", who: ["Tú", "Thuỳ"] },
        ],
      },
      {
        label: "Lầu 1",
        rooms: [
          { no: 1, bed: "Giường 1m8", wc: "View kính góc L", who: ["Timmie", "Vợ Timmie"] },
          { no: 3, bed: "Giường 1m6", wc: "Ban công", who: ["Trí Quan", "Dori"] },
        ],
      },
      {
        label: "Trệt",
        ground: true,
        common: "Sinh hoạt chung · không có phòng ngủ",
        rooms: [],
      },
    ],
  },
];

(() => {
  const root = document.querySelector("[data-villas]");
  if (!root) return;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const renderRoom = (room) => {
    const occupied = room.who.length > 0;
    const state = !occupied ? "room--empty" : room.tentative ? "room--tentative" : "room--taken";
    const card = el("div", `room ${state}`);

    const head = el("div", "room__head");
    head.appendChild(el("span", "room__no", `P.${room.no}`));
    head.appendChild(el("span", "room__bed", room.bed));
    card.appendChild(head);
    card.appendChild(el("span", "room__tag", room.wc));

    const who = el("div", "room__who");
    if (occupied) {
      room.who.forEach((name) => who.appendChild(el("span", "room__person", name)));
      if (room.tentative) who.appendChild(el("span", "room__flag", "dự kiến"));
    } else {
      who.appendChild(el("span", "room__vacant", "Chưa xếp"));
    }
    card.appendChild(who);
    return card;
  };

  VILLAS.forEach((villa) => {
    const wrap = el("article", "villa");

    const header = el("header", "villa__header");
    header.appendChild(el("h4", "villa__name", villa.name));
    header.appendChild(el("span", "villa__meta", villa.meta));
    wrap.appendChild(header);

    wrap.appendChild(el("div", "villa__roof"));

    const body = el("div", "villa__body");
    villa.floors.forEach((floor) => {
      const row = el("div", `floor${floor.ground ? " floor--ground" : ""}`);
      row.appendChild(el("span", "floor__label", floor.label));
      const rooms = el("div", "floor__rooms");
      rooms.style.setProperty("--rooms", floor.rooms.length || 1);
      floor.rooms.forEach((room) => rooms.appendChild(renderRoom(room)));
      if (floor.common) rooms.appendChild(el("div", "room room--common", floor.common));
      row.appendChild(rooms);
      body.appendChild(row);
    });
    wrap.appendChild(body);
    wrap.appendChild(el("div", "villa__ground"));

    if (villa.pending && villa.pending.length) {
      const box = el("div", "villa__pending");
      box.appendChild(el("p", "villa__pending-title", "Chờ chốt phòng"));
      const list = el("ul");
      villa.pending.forEach(({ who, where }) => {
        const li = el("li");
        li.appendChild(el("strong", null, who));
        li.appendChild(document.createTextNode(` · ${where}`));
        list.appendChild(li);
      });
      box.appendChild(list);
      wrap.appendChild(box);
    }

    root.appendChild(wrap);
  });
})();
