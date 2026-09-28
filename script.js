/* ====== EDIT YOUR LINKS HERE ====== */
const CONFIG = {
  youtube: "https://youtube.com/@kudooff1cial?si=bvS3wBZ0t_yZMY3Q",             // your channel URL, e.g. https://youtube.com/@yourchannel
  tutorial: "https://youtube.com/@kudooff1cial?si=bvS3wBZ0t_yZMY3Q",           // a YouTube video URL, e.g. https://youtu.be/VIDEO_ID
  scriptDownload: "https://loot-link.com/s?N332kBj7", // file URL, e.g. scripts/my-script.js or a full https link
  statsNamespace: "james-kudo-site-official"  // any unique name; keeps your counters separate from other sites
};

/* ====== SCRIPT INFO (shown in the download card) ====== */
const SCRIPT = {
  name: "James Kudo Script",
  description: "Latest script in mobile legends.",
  version: "v1.4",
  type: ".lua",
  filename: "james-kudo-script.lua",
  code: `-- James Kudo Script v1.4
`
};
/* ================================== */

const $ = (s) => document.querySelector(s);
const isSet = (v) => v && !/^YOUR_/i.test(v);

/* ---- toast ---- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---- navigation (hash based, back button works) ---- */
const views = ["home", "tutorial", "download"];
function show(id) {
  if (!views.includes(id)) id = "home";
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-go]").forEach((el) =>
  el.addEventListener("click", () => {
    const id = el.dataset.go;
    id === "home" ? history.pushState(null, "", location.pathname) : (location.hash = id);
    show(id);
  })
);
window.addEventListener("popstate", () => show(location.hash.slice(1)));
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
show(location.hash.slice(1));

/* ---- YouTube channel ---- */
const yt = $("#ytCard");
if (isSet(CONFIG.youtube)) yt.href = CONFIG.youtube;
else yt.addEventListener("click", (e) => { e.preventDefault(); toast("Set your YouTube link in script.js"); });
if (isSet(CONFIG.youtube)) yt.addEventListener("click", () => Stats.hit("subscribe"));

/* ---- Tutorial ---- */
function videoId(url) {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
const vid = isSet(CONFIG.tutorial) ? videoId(CONFIG.tutorial) : null;
if (vid) {
  const th = $("#thumb");
  th.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  th.hidden = false;
}
if (isSet(CONFIG.tutorial)) {
  const l = $("#tutLink");
  l.href = CONFIG.tutorial;
  l.hidden = false;
}
$("#watchBtn").addEventListener("click", () => {
  if (!isSet(CONFIG.tutorial)) return toast("Set your tutorial link in script.js");
  Stats.hit("tutorial");
  if (!vid) return window.open(CONFIG.tutorial, "_blank", "noopener");
  const box = $("#player");
  box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&playsinline=1"
    title="Tutorial video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
});

/* ---- Script download ---- */
$("#sName").textContent = SCRIPT.name;
$("#sDesc").textContent = SCRIPT.description;
$("#sVer").textContent = SCRIPT.version;
$("#sType").textContent = SCRIPT.type;
$("#sSize").textContent = (new Blob([SCRIPT.code]).size / 1024).toFixed(1) + " KB";
$("#code").textContent = SCRIPT.code;

$("#copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(SCRIPT.code);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = SCRIPT.code;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) return toast("Copy failed. Select the code and copy manually.");
  }
  toast("Copied!");
});

$("#dlBtn").addEventListener("click", () => {
  const btn = $("#dlBtn"), lbl = btn.querySelector(".lbl");
  if (btn.classList.contains("busy")) return;
  Stats.hit("downloads");
  btn.classList.remove("done");
  btn.classList.add("busy");
  lbl.textContent = "DOWNLOADING...";

  const a = document.createElement("a");
  if (isSet(CONFIG.scriptDownload)) {
    a.href = CONFIG.scriptDownload;
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener";
  } else {
    // No link configured yet: download the script shown above
    a.href = URL.createObjectURL(new Blob([SCRIPT.code], { type: "text/plain" }));
    a.download = SCRIPT.filename;
  }
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    btn.classList.remove("busy");
    btn.classList.add("done");
    lbl.textContent = "DOWNLOADED";
    toast("Download started");
    setTimeout(() => { btn.classList.remove("done"); lbl.textContent = "DOWNLOAD SCRIPT"; }, 2200);
  }, 1100);
});


/* ---- live stats (shared counters via free Abacus service) ---- */
const Stats = (() => {
  const base = "https://abacus.jasoncameron.dev";
  const ns = encodeURIComponent(CONFIG.statsNamespace);
  const keys = { visitors: "visitors", downloads: "downloads", tutorial: "tutorial-views", subscribe: "subscribe-clicks" };
  const shown = {};

  function render(k, n) {
    const el = document.querySelector(`[data-stat="${k}"]`);
    if (!el || n == null) return;
    const from = shown[k] || 0, t0 = performance.now();
    shown[k] = n;
    (function step(t) {
      const p = Math.min((t - t0) / 800, 1);
      el.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  async function call(mode, k) {
    try {
      const r = await fetch(`${base}/${mode}/${ns}/${keys[k]}`);
      if (r.status === 404) return 0;
      if (!r.ok) return null;
      return (await r.json()).value;
    } catch { return null; }
  }
  const hit = (k) => call("hit", k).then((v) => render(k, v));

  function init() {
    let isNew = false;
    try {
      if (!localStorage.getItem("jk_visited")) { isNew = true; localStorage.setItem("jk_visited", "1"); }
    } catch {}
    // count each device once as a visitor
    if (isNew) hit("visitors"); else call("get", "visitors").then((v) => render("visitors", v));
    ["downloads", "tutorial", "subscribe"].forEach((k) => call("get", k).then((v) => render(k, v)));
  }
  return { hit, init };
})();
Stats.init();

/* ---- floating particles ---- */
(function () {
  const c = $("#bg"), ctx = c.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dots = [];
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * d; c.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    dots = Array.from({ length: Math.min(60, Math.floor(w / 9)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + .4, vy: Math.random() * .3 + .08, vx: (Math.random() - .5) * .15,
      hue: Math.random() < .5 ? "124,92,255" : "34,211,238"
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of dots) {
      p.y -= p.vy; p.x += p.vx;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},.65)`;
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  size(); frame();
  addEventListener("resize", size);
})();
