/**
 * Bản đồ 2D + profile độ cao — hiện khi bấm thẻ cự ly.
 */
(() => {
  const COURSES = {
    "15k": { url: "./data/courses/15k.json", label: "15K" },
    "55k": { url: "./data/courses/55k.json", label: "55K" },
    "85k": { url: "./data/courses/85k.json", label: "85K" },
  };

  const cache = new Map();

  function haversineM(a, b) {
    const R = 6371000;
    const toR = Math.PI / 180;
    const dLat = (b[1] - a[1]) * toR;
    const dLon = (b[0] - a[0]) * toR;
    const lat1 = a[1] * toR;
    const lat2 = b[1] * toR;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function parseCourse(geojson) {
    const line = geojson.features.find((f) => f.geometry?.type === "LineString");
    const waypoints = geojson.features.filter((f) => f.geometry?.type === "Point");
    const coords = line.geometry.coordinates;
    const dist = [0];
    for (let i = 1; i < coords.length; i++) {
      dist.push(
        dist[i - 1] +
          haversineM(
            [coords[i - 1][0], coords[i - 1][1]],
            [coords[i][0], coords[i][1]]
          )
      );
    }
    const eles = coords.map((c) => (c[2] != null ? c[2] : null));
    let last = eles.find((e) => e != null) ?? 1500;
    const elev = eles.map((e) => {
      if (e == null) return last;
      last = e;
      return e;
    });
    return {
      coords,
      dist,
      elev,
      totalM: dist[dist.length - 1],
      props: line.properties || {},
      waypoints,
    };
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Gán waypoint vào điểm gần nhất trên track → km + độ cao. */
  function projectWaypoints(course) {
    return course.waypoints.map((w) => {
      const lon = w.geometry.coordinates[0];
      const lat = w.geometry.coordinates[1];
      let bestI = 0;
      let bestD = Infinity;
      for (let i = 0; i < course.coords.length; i++) {
        const d = haversineM([lon, lat], [course.coords[i][0], course.coords[i][1]]);
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      const name = w.properties?.name || "";
      return {
        name,
        short: name.replace(/^CP\s*/i, "CP"),
        distM: course.dist[bestI],
        elev: course.elev[bestI],
        kind: /start/i.test(name) ? "start" : /finish/i.test(name) ? "finish" : "cp",
      };
    });
  }

  function renderMap(svg, course) {
    const W = 720;
    const H = 420;
    const pad = 28;
    const lons = course.coords.map((c) => c[0]);
    const lats = course.coords.map((c) => c[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const midLat = (minLat + maxLat) / 2;
    const cos = Math.cos((midLat * Math.PI) / 180);
    const spanX = Math.max((maxLon - minLon) * cos, 1e-6);
    const spanY = Math.max(maxLat - minLat, 1e-6);
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const scale = Math.min(innerW / spanX, innerH / spanY) * 0.92;
    const ox = (W - spanX * scale) / 2;
    const oy = (H - spanY * scale) / 2;

    const toXY = (lon, lat) => {
      const x = ox + (lon - minLon) * cos * scale;
      const y = oy + (maxLat - lat) * scale;
      return [x, y];
    };

    const pts = course.coords.map((c) => toXY(c[0], c[1]));
    const d = pts
      .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join(" ");

    const start = toXY(course.coords[0][0], course.coords[0][1]);
    const end = toXY(
      course.coords[course.coords.length - 1][0],
      course.coords[course.coords.length - 1][1]
    );

    const marks = course.waypoints
      .map((w) => {
        const [x, y] = toXY(w.geometry.coordinates[0], w.geometry.coordinates[1]);
        const name = w.properties?.name || "";
        const short = name.replace(/^CP\s*/i, "CP");
        return `<g class="cmap__mark">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" />
          <text x="${(x + 8).toFixed(1)}" y="${(y - 8).toFixed(1)}">${escapeXml(short)}</text>
        </g>`;
      })
      .join("");

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <rect class="cmap__bg" width="${W}" height="${H}" />
      <path class="cmap__track-glow" d="${d}" />
      <path class="cmap__track" d="${d}" />
      <circle class="cmap__start" cx="${start[0].toFixed(1)}" cy="${start[1].toFixed(1)}" r="7" />
      <circle class="cmap__finish" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="7" />
      ${marks}
    `;
  }

  function renderElev(svg, course) {
    const W = 720;
    const H = 220;
    const padL = 48;
    const padR = 16;
    const padT = 36;
    const padB = 36;
    const minE = Math.min(...course.elev);
    const maxE = Math.max(...course.elev);
    const spanE = Math.max(maxE - minE, 1);
    const total = course.totalM || 1;
    const marks = projectWaypoints(course);

    const xAt = (m) => padL + ((W - padL - padR) * m) / total;
    const yAt = (e) => padT + (H - padT - padB) * (1 - (e - minE) / spanE);

    const line = course.coords
      .map((_, i) => {
        const x = xAt(course.dist[i]);
        const y = yAt(course.elev[i]);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const area = `${line} L${xAt(total).toFixed(1)},${(H - padB).toFixed(1)} L${padL},${(H - padB).toFixed(1)} Z`;

    const yTicks = 4;
    const grid = [];
    for (let i = 0; i <= yTicks; i++) {
      const e = minE + (spanE * i) / yTicks;
      const y = yAt(e);
      grid.push(
        `<line class="cmap__grid" x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" />
         <text class="cmap__axis" x="${padL - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end">${Math.round(e)}</text>`
      );
    }

    const kmMax = total / 1000;
    const xLabels = [];
    const step = kmMax > 40 ? 10 : kmMax > 20 ? 5 : kmMax > 8 ? 2 : 1;
    for (let km = 0; km <= kmMax + 0.01; km += step) {
      const x = xAt(Math.min(km * 1000, total));
      xLabels.push(
        `<text class="cmap__axis" x="${x.toFixed(1)}" y="${H - 12}" text-anchor="middle">${km === 0 ? "0" : km}</text>`
      );
    }

    const gain =
      course.props.gainM ??
      Math.round(
        course.elev.reduce((g, e, i) => {
          if (i === 0) return 0;
          const d = e - course.elev[i - 1];
          return g + (d > 0 ? d : 0);
        }, 0)
      );

    // Stagger labels when CPs are close on the x-axis
    const sorted = [...marks].sort((a, b) => a.distM - b.distM);
    let lastX = -Infinity;
    const cpSvg = sorted
      .map((m) => {
        const x = xAt(m.distM);
        const y = yAt(m.elev);
        const cls =
          m.kind === "start"
            ? "cmap__cp cmap__cp--start"
            : m.kind === "finish"
              ? "cmap__cp cmap__cp--finish"
              : "cmap__cp";
        let labelY = y - 12;
        if (x - lastX < 36) labelY -= 14;
        lastX = x;
        const label = m.kind === "start" ? "S" : m.kind === "finish" ? "F" : m.short;
        return `<g class="${cls}">
          <line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(H - padB).toFixed(1)}" />
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" />
          <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle">${escapeXml(label)}</text>
        </g>`;
      })
      .join("");

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <rect class="cmap__bg" width="${W}" height="${H}" />
      ${grid.join("")}
      <path class="cmap__elev-fill" d="${area}" />
      <path class="cmap__elev-line" d="${line}" />
      ${cpSvg}
      ${xLabels.join("")}
      <text class="cmap__axis cmap__axis--unit" x="${W / 2}" y="${H - 2}" text-anchor="middle">km</text>
      <text class="cmap__axis cmap__axis--unit" x="14" y="${H / 2}" text-anchor="middle" transform="rotate(-90 14 ${H / 2})">m</text>
      <text class="cmap__stat" x="${W - padR}" y="16" text-anchor="end">↑ ${gain} m · ${(total / 1000).toFixed(1)} km</text>
    `;
  }

  async function loadCourse(id) {
    if (cache.has(id)) return cache.get(id);
    const meta = COURSES[id];
    if (!meta) throw new Error("unknown course");
    const res = await fetch(meta.url);
    if (!res.ok) throw new Error(res.status === 404 ? "missing" : res.statusText);
    const course = parseCourse(await res.json());
    cache.set(id, course);
    return course;
  }

  function boot() {
    const picker = document.querySelector("[data-dist-picker]");
    const panel = document.querySelector("[data-course-panel]");
    if (!picker || !panel) return;

    const titleEl = panel.querySelector("[data-course-title]");
    const statusEl = panel.querySelector("[data-course-status]");
    const mapSvg = panel.querySelector("[data-course-map]");
    const elevSvg = panel.querySelector("[data-course-elev]");
    const cards = [...picker.querySelectorAll("[data-course]")];

    async function selectCourse(id) {
      const meta = COURSES[id];
      cards.forEach((btn) => {
        const on = btn.getAttribute("data-course") === id;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });

      panel.hidden = false;
      if (titleEl) titleEl.textContent = `${meta?.label || id.toUpperCase()} · bản đồ & độ cao`;
      if (statusEl) statusEl.textContent = "Đang tải…";
      mapSvg.innerHTML = "";
      elevSvg.innerHTML = "";

      try {
        const course = await loadCourse(id);
        renderMap(mapSvg, course);
        renderElev(elevSvg, course);
        if (statusEl) {
          statusEl.textContent = `${course.props.name || meta.label} · ${(course.totalM / 1000).toFixed(1)} km · ↑ ${course.props.gainM ?? "—"} m`;
        }
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (err) {
        console.warn(err);
        if (statusEl) {
          statusEl.textContent =
            err.message === "missing"
              ? "Chưa có file GPX cho cự ly này — sẽ bổ sung sau."
              : "Không tải được đường chạy.";
        }
      }
    }

    function onPick(e) {
      const btn = e.target.closest("[data-course]");
      if (!btn || !picker.contains(btn)) return;
      selectCourse(btn.getAttribute("data-course"));
    }

    picker.addEventListener("click", onPick);
    picker.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = e.target.closest("[data-course]");
      if (!btn || !picker.contains(btn)) return;
      e.preventDefault();
      selectCourse(btn.getAttribute("data-course"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
