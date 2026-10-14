// Gắn ?v=<thời gian> vào ./css/*.css và ./js/*.js trong index.html để trình duyệt không dùng bản cache cũ.
// Chạy trước khi commit: node scripts/bump-version.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../index.html", import.meta.url));
const version = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
const html = readFileSync(file, "utf8");
const next = html.replace(/((?:href|src)="\.\/(?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=\w+)?"/g, `$1?v=${version}"`);

writeFileSync(file, next);
console.log(`index.html assets → v=${version}`);
