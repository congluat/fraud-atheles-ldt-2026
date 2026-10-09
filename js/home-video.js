(() => {
  const video = document.querySelector(".home__video");
  if (!video) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;

  if (saveData) {
    video.removeAttribute("autoplay");
    video.querySelectorAll("source").forEach((source) => source.remove());
    video.load();
    return;
  }

  const sync = () => {
    if (reducedMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  sync();
  reducedMotion.addEventListener?.("change", sync);
})();
