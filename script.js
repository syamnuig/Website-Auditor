// ---------- Checklist data ----------
const categories = [
  {
    id: "seo",
    title: "SEO Basics",
    items: [
      { id: "meta-title", label: "Meta title present and under ~60 characters", help: "Clear, unique, includes target keyword." },
      { id: "meta-desc", label: "Meta description present (~155–160 chars)", help: "Compelling CTA, unique per page." },
      { id: "h1-single", label: "Single H1 per page, descriptive", help: "Use H2/H3 for structure." },
      { id: "urls-clean", label: "Clean, readable URLs", help: "Lowercase, hyphens, no query clutter." },
      { id: "canonical", label: "Canonical tags for duplicate content", help: "Avoid index bloat." },
      { id: "sitemap", label: "XML sitemap submitted to search engines", help: "Updated and accessible." },
      { id: "robots", label: "Robots.txt properly configured", help: "Blocks non-public areas only." },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    items: [
      { id: "images-optimized", label: "Images compressed and sized correctly", help: "Use modern formats (WebP/AVIF) where possible." },
      { id: "lazy-loading", label: "Lazy-load offscreen images", help: "Improve initial render." },
      { id: "caching", label: "Caching enabled (HTTP and app-level)", help: "ETag/Cache-Control headers." },
      { id: "minification", label: "CSS/JS minified and bundled reasonably", help: "Reduce round trips." },
      { id: "critical-css", label: "Critical CSS inlined for above-the-fold", help: "Faster first paint." },
      { id: "cdn", label: "Use CDN for static assets (if global audience)", help: "Lower latency." },
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    items: [
      { id: "alt-text", label: "Alt text for images", help: "Descriptive, not keyword stuffing." },
      { id: "color-contrast", label: "Adequate color contrast", help: "WCAG AA minimum." },
      { id: "keyboard-nav", label: "Keyboard navigable", help: "Focusable, visible focus states." },
      { id: "labels", label: "Form fields with labels and error messages", help: "ARIA where needed." },
      { id: "semantics", label: "Semantic HTML structure", help: "Landmarks: header, main, nav, footer." },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      { id: "freshness", label: "Content updated and accurate", help: "No outdated info." },
      { id: "clarity", label: "Clear value proposition above the fold", help: "What, who, why." },
      { id: "readability", label: "Readable copy (short paragraphs, headings)", help: "Plain language." },
      { id: "internal-links", label: "Internal links to key pages", help: "Logical navigation." },
      { id: "ctas", label: "Strong CTAs with clear actions", help: "Visible and consistent." },
    ],
  },
  {
    id: "ux",
    title: "Design & UX",
    items: [
      { id: "mobile", label: "Mobile-responsive layout", help: "Test across devices." },
      { id: "navigation", label: "Intuitive navigation and menu structure", help: "Few clicks to important content." },
      { id: "consistency", label: "Consistent styling and spacing", help: "No visual noise." },
      { id: "forms", label: "Forms simple and short", help: "Only essential fields." },
      { id: "feedback", label: "Clear feedback on actions", help: "Loading states, success/error." },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { id: "https", label: "HTTPS enabled site-wide", help: "No mixed content." },
      { id: "headers", label: "Security headers configured", help: "CSP, HSTS, X-Frame-Options, etc." },
      { id: "updates", label: "Platform/plugins up to date", help: "No known vulnerabilities." },
      { id: "backup", label: "Regular backups with restore plan", help: "Test restores." },
      { id: "forms-security", label: "Spam protection and validation on forms", help: "Server-side validation." },
    ],
  },
];

// ---------- Elements ----------
const els = {
  checklist: document.getElementById("checklist"),
  error: document.getElementById("error"),
  expandAllBtn: document.getElementById("expandAllBtn"),
  collapseAllBtn: document.getElementById("collapseAllBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),

  outCompleted: document.getElementById("outCompleted"),
  outTotal: document.getElementById("outTotal"),
  outOverall: document.getElementById("outOverall"),
  outSections: document.getElementById("outSections"),
  outCategoryScores: document.getElementById("outCategoryScores"),
  outOutstanding: document.getElementById("outOutstanding"),

  chart: document.getElementById("chart"),
};

// ---------- State ----------
const state = {
  checks: {},     // { itemId: boolean }
  notes: {},      // { categoryId: string }
};

// ---------- Rendering: Checklist ----------
function renderChecklist() {
  const parts = [];

  categories.forEach(cat => {
    parts.push(`
      <div class="section" data-section="${cat.id}">
        <div class="section-header">
          <div class="section-title">${cat.title}</div>
          <div class="section-toggle">Toggle</div>
        </div>
        <div class="section-body">
          ${cat.items.map(item => `
            <div class="check-item">
              <input type="checkbox" id="${item.id}" data-item="${item.id}" />
              <div>
                <label class="item-label" for="${item.id}">${item.label}</label>
                <div class="item-help">${item.help}</div>
              </div>
            </div>
          `).join("")}
          <label class="item-label" for="notes-${cat.id}">Notes</label>
          <textarea id="notes-${cat.id}" class="notes" placeholder="Optional notes for ${cat.title}"></textarea>
        </div>
      </div>
    `);
  });

  els.checklist.innerHTML = parts.join("");

  // Wire section toggles
  els.checklist.querySelectorAll(".section-header").forEach(h => {
    const body = h.nextElementSibling;
    h.addEventListener("click", () => {
      body.classList.toggle("open");
    });
  });

  // Default: open first two sections
  els.checklist.querySelectorAll(".section .section-body").forEach((b, i) => {
    if (i < 2) b.classList.add("open");
  });

  // Wire checkboxes
  els.checklist.querySelectorAll("input[type='checkbox'][data-item]").forEach(cb => {
    cb.addEventListener("change", () => {
      state.checks[cb.dataset.item] = cb.checked;
      updateSummary();
    });
  });

  // Wire notes
  categories.forEach(cat => {
    const ta = document.getElementById(`notes-${cat.id}`);
    ta.addEventListener("input", () => {
      state.notes[cat.id] = ta.value;
    });
  });
}

// ---------- Computation ----------
function computeScores() {
  const totals = {};
  const completed = {};
  let totalItems = 0;
  let totalCompleted = 0;

  categories.forEach(cat => {
    totals[cat.id] = cat.items.length;
    const compCount = cat.items.reduce((acc, item) => acc + (state.checks[item.id] ? 1 : 0), 0);
    completed[cat.id] = compCount;
    totalItems += cat.items.length;
    totalCompleted += compCount;
  });

  const categoryPercents = categories.map(cat => {
    const pct = totals[cat.id] ? (completed[cat.id] / totals[cat.id]) * 100 : 0;
    return { id: cat.id, title: cat.title, pct: pct };
  });

  const overall = categoryPercents.length
    ? categoryPercents.reduce((sum, c) => sum + c.pct, 0) / categoryPercents.length
    : 0;

  return {
    totals,
    completed,
    totalItems,
    totalCompleted,
    categoryPercents,
    overall,
  };
}

// ---------- Summary rendering ----------
function renderSummary(scores) {
  els.outCompleted.textContent = `${scores.totalCompleted}`;
  els.outTotal.textContent = `${scores.totalItems}`;

  els.outOverall.textContent = `${scores.overall.toFixed(0)}%`;
  els.outOverall.className =
    "value " + (scores.overall >= 80 ? "good" : scores.overall >= 50 ? "warn" : "bad");

  els.outSections.textContent = `${categories.length}`;

  const scoreText = scores.categoryPercents
    .map(c => `${c.title}: ${c.pct.toFixed(0)}%`)
    .join(" • ");
  els.outCategoryScores.textContent = scoreText || "—";

  // Outstanding items (top 6)
  const outstanding = [];
  categories.forEach(cat => {
    cat.items.forEach(item => {
      if (!state.checks[item.id]) outstanding.push({ cat: cat.title, label: item.label });
    });
  });
  const topOutstanding = outstanding.slice(0, 6);
  els.outOutstanding.innerHTML = topOutstanding.length
    ? topOutstanding.map(o => `<li>${o.cat}: ${o.label}</li>`).join("")
    : `<li>All items checked — great job!</li>`;
}

// ---------- Chart rendering (bar chart) ----------
function drawChart(scores) {
  const svg = els.chart;
  const w = 600, h = 240, pad = 32;
  const bars = scores.categoryPercents;
  const n = bars.length;

  const maxY = 100;
  const barW = (w - 2 * pad) / n * 0.7;
  const gap = ((w - 2 * pad) / n) - barW;

  const xMap = i => pad + i * (barW + gap) + gap / 2;
  const yMap = v => h - pad - (v / maxY) * (h - 2 * pad);

  const parts = [];

  // Axes & grid
  parts.push(`<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#475569" stroke-width="1"/>`);
  parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#475569" stroke-width="1"/>`);
  // 50% line
  parts.push(`<line x1="${pad}" y1="${yMap(50)}" x2="${w - pad}" y2="${yMap(50)}" stroke="${getComputedStyle(document.body).getPropertyValue('--grid').trim()}" stroke-width="1" stroke-dasharray="4 3"/>`);

  // Bars + tooltips
  bars.forEach((b, i) => {
    const x = xMap(i);
    const y = yMap(b.pct);
    const hBar = (h - pad) - y;

    parts.push(`<rect x="${x}" y="${y}" width="${barW}" height="${hBar}" fill="${getComputedStyle(document.body).getPropertyValue('--blue').trim()}">
      <title>${b.title}: ${b.pct.toFixed(0)}%</title>
    </rect>`);

    // Labels
    parts.push(`<text x="${x + barW / 2}" y="${h - pad + 14}" fill="#9ca3af" font-size="11" text-anchor="middle">${b.title.split(" ")[0]}</text>`);
    parts.push(`<text x="${x + barW / 2}" y="${y - 4}" fill="#9ca3af" font-size="11" text-anchor="middle">${b.pct.toFixed(0)}%</text>`);
  });

  svg.innerHTML = parts.join("");
}

// ---------- Update ----------
function updateSummary() {
  const scores = computeScores();
  renderSummary(scores);
  drawChart(scores);
}

// ---------- Controls ----------
function expandAll() {
  document.querySelectorAll(".section-body").forEach(b => b.classList.add("open"));
}
function collapseAll() {
  document.querySelectorAll(".section-body").forEach(b => b.classList.remove("open"));
}
function clearAll() {
  Object.keys(state.checks).forEach(id => (state.checks[id] = false));
  document.querySelectorAll("input[type='checkbox'][data-item]").forEach(cb => (cb.checked = false));
  updateSummary();
}

// ---------- Init ----------
renderChecklist();
updateSummary();

els.expandAllBtn.addEventListener("click", expandAll);
els.collapseAllBtn.addEventListener("click", collapseAll);
els.clearAllBtn.addEventListener("click", clearAll);

// ---------- Export to PDF ----------
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text("Website Audit Checklist Report", 14, 20);

  // Summary
  doc.setFontSize(12);
  doc.text("Summary:", 14, 35);
  doc.text(`Completed: ${els.outCompleted.textContent} / ${els.outTotal.textContent}`, 14, 45);
  doc.text(`Overall Score: ${els.outOverall.textContent}`, 14, 55);
  doc.text(`Sections: ${els.outSections.textContent}`, 14, 65);

  // Category scores
  doc.text("Category Scores:", 14, 80);
  const scores = els.outCategoryScores.textContent.split("•");
  scores.forEach((s, i) => {
    doc.text(s.trim(), 20, 90 + i * 10);
  });

  // Outstanding items
  doc.text("Outstanding Items:", 14, 140);
  const items = els.outOutstanding.querySelectorAll("li");
  items.forEach((li, i) => {
    doc.text(`- ${li.textContent}`, 20, 150 + i * 10);
  });

  // Save
  doc.save("website-audit-report.pdf");
}

// Wire up button
document.getElementById("exportBtn").addEventListener("click", exportPDF);
