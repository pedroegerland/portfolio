/* Résumé generator: builds a PDF in the browser from window.PORTFOLIO in the requested language.
   pdfmake is loaded on demand from cdnjs only when the user asks for the file. */
(function () {
  const PDFMAKE_VERSION = '0.2.12';
  const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/${PDFMAKE_VERSION}`;
  const NAVY = '#2b3a67';
  const BLUE = '#1f3a93';
  const INK = '#1f2430';
  const GRAY = '#5b6270';
  const LINE = '#3a3f4b';

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
    const bandHeight = 112;
    const rightWidth = 168;
    const gap = 22;
    const leftWidth = pageWidth - margin * 2 - rightWidth - gap;

    const heading = (text, width) => [
      { text: text.toUpperCase(), style: 'h2' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 1.2, lineColor: LINE }], margin: [0, 2, 0, 8] },
    ];
    const divider = (width) => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 0.5, lineColor: '#c9ced8', dash: { length: 2, space: 2 } }], margin: [0, 4, 0, 4] });
    const spacer = () => ({ text: '', margin: [0, 4] });
    const bullets = (items) => ({ ul: items.map((text) => ({ text, style: 'body' })), markerColor: BLUE, margin: [0, 2, 0, 0] });

    const contact = [profile.email, profile.linkedin, profile.github, profile.site, profile.phone]
      .filter(Boolean)
      .map((v, i, arr) => ({ text: v + (i < arr.length - 1 ? '   ·   ' : '') }));

    const header = {
      stack: [
        { text: profile.name.toUpperCase(), style: 'name' },
        { text: pick(profile.title), style: 'title' },
        { text: contact, style: 'contact' },
        { text: pick(profile.location), style: 'contact' },
      ],
      margin: [0, 0, 0, bandHeight - margin - 56],
    };

    const summary = [
      ...heading(t('cv.summary'), leftWidth),
      { text: pick(profile.summary) || `${t('about.p1')} ${t('about.p2')}`, style: 'body' },
    ];

    const experience = [...heading(t('cv.experience'), leftWidth)];
    const full = DATA.experience.filter((x) => !x.brief);
    const brief = DATA.experience.filter((x) => x.brief);
    full.forEach((x, i) => {
      if (i > 0) experience.push(divider(leftWidth));
      experience.push({
        unbreakable: true,
        stack: [
          { text: pick(x.role), style: 'h3' },
          { text: pick(x.company), style: 'company' },
          { text: `${period(x.start, x.end)}   ·   ${pick(x.location)}`, style: 'meta' },
          bullets(list(x.points)),
          { text: [{ text: `${t('cv.stack')}: `, bold: true }, x.stack], style: 'stack' },
        ],
      });
    });
    if (brief.length) {
      experience.push(divider(leftWidth), { text: t('cv.earlier'), style: 'h3', margin: [0, 0, 0, 4] });
      brief.forEach((x) => {
        experience.push({
          text: [
            { text: pick(x.role), bold: true },
            { text: `, ${pick(x.company)} (${period(x.start, x.end)}) — `, color: GRAY },
            { text: list(x.points).join(' ') },
          ],
          style: 'body',
          margin: [0, 0, 0, 4],
        });
      });
    }

    const education = [
      ...heading(t('cv.education'), rightWidth),
      ...DATA.education.map((e) => ({ stack: [{ text: pick(e.title), style: 'h4' }, { text: `${pick(e.school)} · ${e.year}`, style: 'meta' }], margin: [0, 0, 0, 5] })),
    ];

    const languages = [
      ...heading(t('cv.languages'), rightWidth),
      ...DATA.languages.map((l) => ({ text: [{ text: pick(l.name), bold: true }, { text: ` — ${pick(l.level)}`, color: GRAY }], style: 'body', margin: [0, 0, 0, 3] })),
    ];

    // Skill chips: label with a detached underline, packed greedily into rows that fit the column.
    const chipFont = 8;
    const chipPad = 5;
    const chipGap = 5;
    const chipLayout = {
      hLineWidth: (i, node) => (i === node.table.body.length ? 0.8 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#aeb4c0',
      paddingLeft: () => chipPad,
      paddingRight: () => chipPad,
      paddingTop: () => 1,
      paddingBottom: () => 3,
    };
    const chipWidth = (label) => label.length * chipFont * 0.58 + chipPad * 2;
    const chips = (labels, width) => {
      const rows = [];
      let row = [];
      let used = 0;
      labels.forEach((label) => {
        const w = chipWidth(label);
        if (row.length && used + chipGap + w > width) { rows.push(row); row = []; used = 0; }
        row.push(label);
        used += (row.length > 1 ? chipGap : 0) + w;
      });
      if (row.length) rows.push(row);
      return rows.map((r) => ({
        columns: r.map((label) => ({ width: 'auto', table: { body: [[{ text: label, style: 'chip' }]] }, layout: chipLayout })),
        columnGap: chipGap,
        margin: [0, 0, 0, chipGap],
      }));
    };

    const skills = [...heading(t('cv.skills'), rightWidth)];
    DATA.skills.forEach((group) => {
      skills.push({ text: pick(group.title), style: 'skillTitle' }, ...chips(group.items.map(pick), rightWidth));
    });

    const goals = [...heading(t('cv.goals'), rightWidth), bullets(list(DATA.goals))];

    const links = [
      ...heading(t('cv.links'), rightWidth),
      { text: profile.email, link: `mailto:${profile.email}`, style: 'link' },
      { text: profile.linkedin, link: `https://${profile.linkedin}`, style: 'link' },
      { text: profile.github, link: `https://${profile.github}`, style: 'link' },
      { text: profile.site, link: `https://${profile.site}`, style: 'link' },
    ];

    const today = new Date().toISOString().slice(0, 10);

    const content = sanitize([
      header,
      {
        columns: [
          { width: leftWidth, stack: [...summary, spacer(), ...experience] },
          { width: rightWidth, stack: [...skills, spacer(), { unbreakable: true, stack: education }, spacer(), { unbreakable: true, stack: languages }, spacer(), { unbreakable: true, stack: goals }, spacer(), { unbreakable: true, stack: links }] },
        ],
        columnGap: gap,
      },
    ]);

    return {
      pageSize,
      pageMargins: [margin, margin, margin, 40],
      info: { title: `${profile.name} — ${lang === 'en' ? 'Résumé' : 'Currículo'}`, author: profile.name, subject: pick(profile.title), language: lang === 'en' ? 'en' : 'pt-BR' },
      background: (page, size) => (page === 1 ? { canvas: [{ type: 'rect', x: 0, y: 0, w: size.width, h: bandHeight, color: NAVY }] } : null),
      footer: (page, pages) => ({
        columns: [
          { text: `${t('cv.footer')} ${today}`, style: 'footer' },
          { text: `${page} / ${pages}`, style: 'footer', alignment: 'right' },
        ],
        margin: [margin, 14, margin, 0],
      }),
      content,
      styles: {
        name: { fontSize: 22, bold: true, color: '#ffffff', characterSpacing: 0.5 },
        title: { fontSize: 10.5, bold: true, color: '#ffffff', margin: [0, 4, 0, 6] },
        contact: { fontSize: 8.5, color: '#e3e7f2', margin: [0, 0, 0, 2] },
        h2: { fontSize: 11, bold: true, color: INK, characterSpacing: 0.6, margin: [0, 8, 0, 0] },
        h3: { fontSize: 10.5, bold: true, color: INK },
        h4: { fontSize: 9, bold: true, color: INK },
        company: { fontSize: 10, bold: true, color: BLUE, margin: [0, 1, 0, 0] },
        meta: { fontSize: 8.3, color: GRAY, margin: [0, 1, 0, 1] },
        body: { fontSize: 8.6, color: INK, lineHeight: 1.18 },
        stack: { fontSize: 7.8, color: GRAY, margin: [0, 3, 0, 0] },
        skillTitle: { fontSize: 9, bold: true, color: BLUE, margin: [0, 4, 0, 4] },
        chip: { fontSize: chipFont, bold: true, color: INK },
        link: { fontSize: 8.5, color: BLUE, decoration: 'underline', margin: [0, 0, 0, 3] },
        footer: { fontSize: 7.5, color: GRAY },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9, color: INK },
    };
  }

  async function download(lang) {
    const pdfMake = await ensurePdfMake();
    const filename = (window.PORTFOLIO.ui[lang] || window.PORTFOLIO.ui.pt)['cv.filename'];
    await new Promise((resolve) => pdfMake.createPdf(build(lang)).download(filename, resolve));
  }

  window.PortfolioCV = { build, download };
})();
