const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMhDPTkKagccSS7r_54PlF87LyXS-M6Q1nVIfxnHn97pziUeG8Rp1-HqgfgQ11n9rTtAMJynDjvQuY/pub?output=csv";

const DEFAULT_IMAGES = {
  fashion_blog: [
    "assets/images/story-2.jpg",
    "assets/images/feed-1.jpg",
    "assets/images/feed-2.jpg",
    "assets/images/feed-5.jpg",
  ],
  name_a_better_plan: [
    "assets/images/feed-4.jpg",
    "assets/images/feed-3.jpg",
    "assets/images/feed-6.jpg",
    "assets/images/hub.jpg",
  ],
};

function parseCSV(text) {
  const lines = text.trim().split("\n");
  // Row 0 is empty, Row 1 is headers
  if (lines.length < 3) return [];
  const headers = lines[1].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.every((c) => !c.trim())) continue; // skip empty rows
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function driveUrl(url) {
  if (!url) return null;
  // Convierte cualquier link de Drive a URL directa de imagen
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  // Si ya es una URL directa de Drive (uc?id=...)
  if (url.includes("drive.google.com/uc")) return url;
  // Cualquier otra URL la usa tal cual
  return url;
}

const SHEET_LABELS = {
  fashion_blog: "fashion blog",
  name_a_better_plan: "name a better plan",
};

function postCard(post, index, sheetName, isFeatured = false) {
  const defaults = DEFAULT_IMAGES[sheetName] || [];
  const rawImg = post["imagen"] || "";
  const img = driveUrl(rawImg) || defaults[index % defaults.length] || "assets/images/feed-1.jpg";
  const title = post["Titulo"] || post["titulo"] || "sin título";
  const cat = post["categoría"] || post["categoria"] || "";
  const text = post["texto"] || "";
  const fecha = post["fecha"] || "";
  const sectionLabel = SHEET_LABELS[sheetName] || sheetName;

  if (isFeatured) {
    const catLine = cat
      ? `( ${cat} · ${sectionLabel} )`
      : `( última edición · ${sectionLabel} )`;
    return `
      <div class="blog-hero__featured">
        <img class="blog-hero__img" src="${img}" alt="${title}" onerror="this.src='assets/images/feed-1.jpg'"/>
        <div class="blog-hero__text">
          <p class="blog-hero__category">${catLine}</p>
          <h1 class="blog-hero__title">${title}</h1>
          <p class="blog-hero__body">${text}</p>
          ${fecha ? `<p class="blog-hero__meta">${fecha}</p>` : ""}
          <a class="blog-hero__read">leer la nota →</a>
        </div>
      </div>`;
  }

  return `
    <article class="blog-card">
      <div class="blog-card__img-wrap">
        <img class="blog-card__img" src="${img}" alt="${title}" onerror="this.src='assets/images/feed-1.jpg'"/>
      </div>
      <p class="blog-card__cat">${cat}</p>
      <h2 class="blog-card__title">${title}</h2>
      <p class="blog-card__excerpt">${text.length > 140 ? text.slice(0, 140) + "…" : text}</p>
      ${fecha ? `<p class="blog-card__meta">${fecha}</p>` : ""}
    </article>`;
}

async function loadBlog(sheetName) {
  const heroEl = document.getElementById("blog-hero");
  const gridEl = document.getElementById("blog-grid");
  if (!heroEl || !gridEl) return;

  try {
    const url = `${SHEET_BASE}&sheet=${sheetName}&t=${Date.now()}`;
    const res = await fetch(url);
    const text = await res.text();
    const posts = parseCSV(text);

    if (!posts.length) {
      heroEl.innerHTML = `<div style="padding:8rem 3rem;text-align:center;color:var(--navy);font-family:var(--ff-serif);font-size:1.5rem"><em>próximamente...</em></div>`;
      gridEl.innerHTML = "";
      return;
    }

    // First post → featured hero
    heroEl.innerHTML = postCard(posts[0], 0, sheetName, true);

    // Rest → Vogue-style grid (all posts including first)
    gridEl.style.display = "grid";
    gridEl.innerHTML = posts
      .map((p, i) => postCard(p, i, sheetName, false))
      .join("");
  } catch (err) {
    heroEl.innerHTML = `<div style="padding:8rem 3rem;text-align:center;opacity:0.4;font-size:0.85rem">no se pudo cargar el contenido</div>`;
  }
}
