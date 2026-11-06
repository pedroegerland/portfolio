/* Résumé generator: builds an ATS-first, single-column PDF in the browser from window.PORTFOLIO
   in the requested language. pdfmake is loaded on demand from cdnjs only when the user asks for the file.
   Entries flagged `cv: 'brief'` render as one line under "Earlier experience"; `cv: false` stay off the PDF. */
(function () {
  const PDFMAKE_VERSION = '0.2.12';
  const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/${PDFMAKE_VERSION}`;
  const INK = '#1a1a1a';
  const GRAY = '#555555';
  const RULE = '#8a8a8a';

  let loader = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.append(s);
    });
  }
  function ensurePdfMake() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve(window.pdfMake);
    if (!loader) {
      loader = loadScript(`${CDN}/pdfmake.min.js`)
        .then(() => loadScript(`${CDN}/vfs_fonts.min.js`))
        .then(() => window.pdfMake)
        .catch((err) => { loader = null; throw err; });
    }
    return loader;
  }

  // Roboto (bundled with pdfmake) lacks a few glyphs used on the site.
  const GLYPHS = { '→': '->', '↗': '', '↓': '' };
  function sanitize(node) {
    if (typeof node === 'string') return node.replace(/[→↗↓]/g, (c) => GLYPHS[c]);
    if (Array.isArray(node)) return node.map(sanitize);
    if (node && typeof node === 'object') {
      const out = {};
      Object.keys(node).forEach((k) => { out[k] = sanitize(node[k]); });
      return out;
    }
    return node;
  }

  function build(lang) {
    const DATA = window.PORTFOLIO;
    const t = (key) => (DATA.ui[lang] && DATA.ui[lang][key]) || DATA.ui.pt[key] || key;
    const pick = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value[lang] ?? value.pt : value);
    const list = (value) => (value && !Array.isArray(value) ? value[lang] || value.pt : value) || [];
    const months = DATA.months[lang] || DATA.months.pt;
    const fmt = (ym) => { const [y, m] = ym.split('-').map(Number); return `${months[m - 1]} ${y}`; };
    const period = (start, end) => `${fmt(start)} – ${end ? fmt(end) : t('labels.current')}`;
    const profile = DATA.profile;

    const pageSize = lang === 'en' ? 'LETTER' : 'A4';
    const pageWidth = pageSize === 'LETTER' ? 612 : 595.28;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    const heading = (text) => [
      { text: text.toUpperCase(), style: 'h2' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.6, lineColor: RULE }], margin: [0, 1, 0, 5] },
    ];
    const bullets = (items) => ({ ul: items.map((text) => ({ text, style: 'body' })), margin: [0, 2, 0, 0] });
    const sep = '   ·   ';
    const inline = (parts) => parts.filter(Boolean).flatMap((part, i) => (i ? [{ text: sep, color: GRAY }, part] : [part]));

    // ---- Header: name, one-line title, one contact line, one location line ----
    const phone = pick(profile.phone);
    const header = {
      stack: [
        { text: profile.name, style: 'name' },
        { text: pick(profile.title), style: 'title' },
        { text: inline([
          { text: profile.email, link: `mailto:${profile.email}` },
          phone ? { text: phone } : null,
          { text: profile.linkedin, link: `https://${profile.linkedin}` },
          { text: profile.github, link: `https://${profile.github}` },
          { text: profile.site, link: `https://${profile.site}` },
        ]), style: 'contact' },
        { text: pick(profile.location), style: 'contact' },
      ],
      margin: [0, 0, 0, 10],
    };

    const summary = [...heading(t('cv.summary')), { text: pick(profile.summary), style: 'body' }];

    const impactItems = list(DATA.impact);
    const impact = impactItems.length ? [...heading(t('cv.impact')), bullets(impactItems)] : [];

    // ---- Skills: one plain line per group ----
    const skills = [...heading(t('cv.skills'))];
    DATA.skills.filter((g) => g.cv !== false).forEach((group) => {
      skills.push({ text: [{ text: `${pick(group.title)}: `, bold: true }, group.items.map(pick).join(', ')], style: 'body', margin: [0, 0, 0, 2] });
    });

    // ---- Experience: full entries, then compact one-liners ----
    const full = DATA.experience.filter((x) => x.cv !== 'brief' && x.cv !== false);
    const brief = DATA.experience.filter((x) => x.cv === 'brief');
    const experience = [...heading(t('cv.experience'))];
    full.forEach((x, i) => {
      experience.push({
        unbreakable: true,
        margin: [0, i ? 4 : 0, 0, 0],
        stack: [
          {
            columns: [
              { text: [{ text: pick(x.role), bold: true }, { text: ` — ${pick(x.company)}, ${pick(x.location)}`, color: INK }], style: 'role' },
              { text: period(x.start, x.end), style: 'dates', width: 96 },
            ],
            columnGap: 12,
          },
          bullets(list(x.points)),
          { text: [{ text: `${t('cv.stack')}: `, bold: true }, x.stack], style: 'stack' },
        ],
      });
    });
    const earlier = brief.length ? [
      ...heading(t('cv.earlier')),
      ...brief.map((x) => ({
        text: [
          { text: pick(x.role), bold: true },
          { text: `, ${pick(x.company)} (${period(x.start, x.end)}) — ` },
          { text: list(x.points).join(' ') },
        ],
        style: 'body',
        margin: [0, 0, 0, 3],
      })),
    ] : [];

    const education = [
      ...heading(t('cv.education')),
      ...DATA.education.filter((e) => e.cv !== false).map((e) => ({
        text: [{ text: pick(e.title), bold: true }, { text: ` — ${pick(e.school)}, ${e.year}` }],
        style: 'body',
        margin: [0, 0, 0, 2],
      })),
    ];

    const languages = [
      ...heading(t('cv.languages')),
      { text: inline(DATA.languages.map((l) => ({ text: [{ text: pick(l.name), bold: true }, ` — ${pick(l.level)}`] }))), style: 'body' },
    ];

    const links = [
      ...heading(t('cv.links')),
      { text: inline([
        { text: profile.linkedin, link: `https://${profile.linkedin}` },
        { text: profile.github, link: `https://${profile.github}` },
        { text: profile.site, link: `https://${profile.site}` },
      ]), style: 'body' },
    ];

    const gap = () => ({ text: '', margin: [0, 3] });
    const today = new Date().toISOString().slice(0, 10);

    return sanitize({
      pageSize,
      pageMargins: [margin, 34, margin, 40],
      info: { title: `${profile.name} — ${lang === 'en' ? 'Résumé' : 'Currículo'}`, author: profile.name, subject: pick(profile.title), language: lang === 'en' ? 'en' : 'pt-BR' },
      footer: (page, pages) => ({
        columns: [
          { text: `${t('cv.footer')} ${today}`, style: 'footer' },
          { text: `${page} / ${pages}`, style: 'footer', alignment: 'right' },
        ],
        margin: [margin, 16, margin, 0],
      }),
      content: [
        header,
        ...summary, gap(),
        ...impact, impact.length ? gap() : null,
        ...skills, gap(),
        ...experience, gap(),
        ...earlier, earlier.length ? gap() : null,
        ...education, gap(),
        ...languages, gap(),
        ...links,
      ].filter(Boolean),
      styles: {
        name: { fontSize: 19, bold: true, color: INK },
        title: { fontSize: 10.5, bold: true, color: INK, margin: [0, 2, 0, 4] },
        contact: { fontSize: 8.8, color: GRAY, margin: [0, 0, 0, 1] },
        h2: { fontSize: 9.8, bold: true, color: INK, characterSpacing: 0.8, margin: [0, 4, 0, 0] },
        role: { fontSize: 9.6 },
        dates: { fontSize: 8.8, color: GRAY, alignment: 'right', margin: [0, 1, 0, 0] },
        body: { fontSize: 8.7, color: INK, lineHeight: 1.16 },
        stack: { fontSize: 7.8, color: GRAY, margin: [0, 2, 0, 0] },
        footer: { fontSize: 7.5, color: GRAY },
      },
      defaultStyle: { font: 'Roboto', fontSize: 8.7, color: INK },
    });
  }

  async function download(lang) {
    const pdfMake = await ensurePdfMake();
    const filename = (window.PORTFOLIO.ui[lang] || window.PORTFOLIO.ui.pt)['cv.filename'];
    await new Promise((resolve) => pdfMake.createPdf(build(lang)).download(filename, resolve));
  }

  window.PortfolioCV = { build, download };
})();
