/* Đọc 1 tab Google Sheet dạng CSV (file chia sẻ "ai có link đều xem được"). */
window.SheetCsv = (function () {
  function parse(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  /* pub: id "Xuất bản lên web" (2PACX-...), nếu có thì dùng thay sheet id. */
  function url({ sheet, pub, gid }) {
    return pub
      ? `https://docs.google.com/spreadsheets/d/e/${pub}/pub?gid=${gid}&single=true&output=csv`
      : `https://docs.google.com/spreadsheets/d/${sheet}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  function load(opts) {
    return fetch(url(opts), { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error(`gid ${opts.gid}: HTTP ${res.status}`);
      return res.text().then(parse);
    });
  }

  return { parse, url, load };
})();
