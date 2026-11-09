// Gắn ?v=<thời gian> vào ./css/*.css và ./js/*.js trong index.html để trình duyệt không dùng bản cache cũ.
// Chạy trước khi commit: node scripts/bump-version.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const version = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
for (const name of ["index.html", "thu-chi.html"]) {
  const file = fileURLToPath(new URL(`../${name}`, import.meta.url));
  const html = readFileSync(file, "utf8");
  const next = html.replace(/((?:href|src)="\.\/(?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=\w+)?"/g, `$1?v=${version}"`);
  writeFileSync(file, next);
  console.log(`${name} assets → v=${version}`);
}
