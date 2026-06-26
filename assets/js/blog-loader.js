const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMhDPTkKagccSS7r_54PlF87LyXS-M6Q1nVIfxnHn97pziUeG8Rp1-HqgfgQ11n9rTtAMJynDjvQuY/pub?output=csv";

const SECTION_LABELS = {
  fashion_blog:       "fashion blog",
  name_a_better_plan: "name a better plan",
};

/* ── CSV PARSER ── */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 3) return [];
  const headers = splitLine(lines[1]).map(h => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

function splitLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

/* ── DRIVE URL CONVERTER ── */
function driveUrl(url) {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  if (url.includes("drive.google.com/uc")) return url;
  if (url.startsWith("http")) return url;
  return null;
}

/* ── GET FIELD ── */
function field(post, ...keys) {
  for (const k of keys) if (post[k]) return post[k];
  return "";
}

/* ── FEATURED CARD ── */
function renderFeatured(post, sheetName) {
  const img   = driveUrl(field(post, "imagen")) || "";
  const title = field(post, "Titulo", "titulo") || "sin título";
  const cat   = field(post, "categoría", "categoria");
  const text  = field(post, "texto");
  const fecha = field(post, "fecha");
  const label = SECTION_LABELS[sheetName] || sheetName;
  const catLine = cat ? `( ${cat} · ${label} )` : `( última edición · ${label} )`;

  return `
  <div class="blog-featured">
    ${img ? `<img class="blog-featured__img" src="${img}" alt="${title}" onerror="this.style.display='none'"/>` : `<div class="blog-featured__img" style="background:var(--navy)"></div>`}
    <div class="blog-featured__content">
      <p class="blog-featured__label">${catLine}</p>
      <h1 class="blog-featured__title">${title}</h1>
      <p class="blog-featured__text">${text}</p>
      ${fecha ? `<p class="blog-featured__date">${fecha}</p>` : ""}
      <span class="blog-featured__read">leer la nota →</span>
    </div>
  </div>`;
}

/* ── GRID CARD ── */
function renderCard(post, sheetName) {
  const img   = driveUrl(field(post, "imagen")) || "";
  const title = field(post, "Titulo", "titulo") || "sin título";
  const cat   = field(post, "categoría", "categoria");
  const text  = field(post, "texto");
  const fecha = field(post, "fecha");
  const excerpt = text.length > 130 ? text.slice(0, 130) + "…" : text;

  return `
  <article class="blog-card">
    <div class="blog-card__img-wrap">
      ${img
        ? `<img class="blog-card__img" src="${img}" alt="${title}" onerror="this.closest('.blog-card__img-wrap').style.display='none'"/>`
        : `<div class="blog-card__img" style="background:var(--cream-dk,#e8e1d6)"></div>`}
    </div>
    ${cat ? `<p class="blog-card__cat">${cat}</p>` : ""}
    <h2 class="blog-card__title">${title}</h2>
    ${excerpt ? `<p class="blog-card__excerpt">${excerpt}</p>` : ""}
    ${fecha ? `<p class="blog-card__date">${fecha}</p>` : ""}
  </article>`;
}

/* ── MAIN LOADER ── */
async function loadBlog(sheetName) {
  const featuredEl = document.getElementById("blog-featured");
  const gridEl     = document.getElementById("blog-grid");
  if (!featuredEl && !gridEl) return;

  try {
    const url = `${SHEET_BASE}&sheet=${sheetName}&nocache=${Date.now()}`;
    const res  = await fetch(url, { cache: "no-store" });
    const csv  = await res.text();
    const posts = parseCSV(csv);

    if (!posts.length) {
      if (featuredEl) featuredEl.innerHTML = `<div style="padding:8rem 3rem;text-align:center;font-family:var(--ff-display);font-style:italic;font-size:1.5rem;color:var(--navy);opacity:0.4">próximamente...</div>`;
      if (gridEl) gridEl.innerHTML = "";
      return;
    }

    if (featuredEl) featuredEl.innerHTML = renderFeatured(posts[0], sheetName);
    if (gridEl) {
      gridEl.innerHTML = posts.map(p => renderCard(p, sheetName)).join("");
      gridEl.style.display = "grid";
    }
  } catch (err) {
    console.error("blog-loader:", err);
    if (featuredEl) featuredEl.innerHTML = `<div style="padding:8rem 3rem;text-align:center;opacity:0.35;font-size:0.85rem">no se pudo cargar el contenido</div>`;
  }
}

/* ── HOME PREVIEW LOADER ── */
async function loadHomePreview(sheetName, titleEl, excerptEl, imgWrapEl) {
  try {
    const url   = `${SHEET_BASE}&sheet=${sheetName}&nocache=${Date.now()}`;
    const res   = await fetch(url, { cache: "no-store" });
    const csv   = await res.text();
    const posts = parseCSV(csv);
    if (!posts.length) return;

    const post  = posts[0];
    const title = field(post, "Titulo", "titulo");
    const text  = field(post, "texto");
    const img   = driveUrl(field(post, "imagen"));

    if (titleEl && title)   titleEl.textContent  = title;
    if (excerptEl && text)  excerptEl.textContent = text.length > 120 ? text.slice(0, 120) + "…" : text;
    if (imgWrapEl && img)   imgWrapEl.querySelector("img").src = img;
  } catch (e) { /* silently skip */ }
}
