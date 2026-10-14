/*
 * Thời tiết Đà Lạt cho từng ngày trong timeline (li[data-date="d/m"]), nguồn Open-Meteo (không cần key).
 * Dự báo chỉ có ~16 ngày tới → khi chưa tới thì hiện thời tiết thực tế cùng kỳ năm trước để tham khảo.
 */
(function () {
  const timeline = document.querySelector("[data-timeline]");
  if (!timeline) return;

  const YEAR = 2026;
  const LAT = 11.94;
  const LON = 108.44;
  const FORECAST_DAYS = 16;
  const DAILY = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max";

  const items = [...timeline.querySelectorAll("[data-date]")];
  const dateOf = (li, year) => {
    const [d, m] = li.dataset.date.split("/").map(Number);
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  if (!items.length) return;

  const first = dateOf(items[0], YEAR);
  const last = dateOf(items[items.length - 1], YEAR);
  const horizon = new Date(Date.now() + (FORECAST_DAYS - 1) * 86400000).toISOString().slice(0, 10);
  const forecast = last <= horizon;
  const year = forecast ? YEAR : YEAR - 1;

  const base = forecast ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive";
  const daily = forecast ? DAILY : DAILY.replace(",precipitation_probability_max", "");
  const url = `${base}?latitude=${LAT}&longitude=${LON}&daily=${daily}&timezone=Asia%2FHo_Chi_Minh` +
    `&start_date=${first.replace(YEAR, year)}&end_date=${last.replace(YEAR, year)}`;

  function describe(code) {
    if (code === 0) return ["☀", "Nắng"];
    if (code <= 2) return ["⛅", "Ít mây"];
    if (code === 3) return ["☁", "Nhiều mây"];
    if (code <= 48) return ["≋", "Sương mù"];
    if (code <= 57) return ["☂", "Mưa phùn"];
    if (code <= 67) return ["☂", code >= 65 ? "Mưa to" : "Mưa"];
    if (code <= 77) return ["❄", "Mưa đá"];
    if (code <= 82) return ["☂", "Mưa rào"];
    return ["ϟ", "Dông"];
  }

  const round = (n) => Math.round(n);

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(({ daily: d }) => {
      items.forEach((li) => {
        const i = d.time.indexOf(dateOf(li, year));
        if (i < 0) return;
        const [icon, text] = describe(d.weather_code[i]);
        const rain = forecast && d.precipitation_probability_max
          ? `mưa ${d.precipitation_probability_max[i]}%`
          : d.precipitation_sum[i] > 0.2 ? `${d.precipitation_sum[i].toLocaleString("vi-VN")} mm` : "";

        const wx = document.createElement("p");
        wx.className = "timeline__wx";
        wx.title = forecast ? "Dự báo Open-Meteo" : `Thời tiết thực tế ngày này năm ${year}`;
        const iconEl = document.createElement("span");
        iconEl.className = "timeline__wx-icon";
        iconEl.setAttribute("aria-hidden", "true");
        iconEl.textContent = icon;
        wx.append(iconEl, `${text} · ${round(d.temperature_2m_min[i])}–${round(d.temperature_2m_max[i])}°C${rain ? ` · ${rain}` : ""}`);
        li.querySelector(".timeline__day").after(wx);
      });

      const note = document.querySelector("[data-weather-note]");
      if (note) {
        note.textContent = forecast
          ? "Thời tiết: dự báo Open-Meteo, cập nhật mỗi lần mở trang."
          : `Thời tiết: chưa có dự báo (có khoảng 16 ngày trước chuyến đi), đang hiện thời tiết thực tế cùng kỳ ${year} để tham khảo.`;
        note.hidden = false;
      }
    })
    .catch((err) => console.warn("Không tải được thời tiết:", err));
})();
