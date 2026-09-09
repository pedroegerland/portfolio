(function () {
  const DATA = window.PORTFOLIO;
  const SUPPORTED = ['pt', 'en'];
  const MONTHS = {
    pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  function detectLang() {
    const fromQuery = new URLSearchParams(location.search).get('lang');
    if (SUPPORTED.includes(fromQuery)) return fromQuery;
    try {
      const saved = localStorage.getItem('lang');
      if (SUPPORTED.includes(saved)) return saved;
    } catch (_) { /* storage blocked */ }
    return (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  }

  const t = (lang, key) => (DATA.ui[lang] && DATA.ui[lang][key]) || DATA.ui.pt[key] || key;
  const pick = (lang, value) => (value && typeof value === 'object' && !Array.isArray(value) ? value[lang] ?? value.pt : value);
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v === true ? '' : v);
    });
    [].concat(children).forEach((c) => c && node.append(c));
    return node;
  };

  function formatPeriod(lang, start, end) {
    const fmt = (ym) => {
      const [y, m] = ym.split('-').map(Number);
      return `${MONTHS[lang][m - 1]} ${y}`;
    };
    return `${fmt(start)} — ${end ? fmt(end) : t(lang, 'labels.current')}`;
  }

  function renderProjects(lang) {
    const root = document.getElementById('projects-list');
    root.replaceChildren();
    DATA.projects.forEach((p) => {
      const shots = p.shots || [];
      const main = el('figure', { class: `project__shot ${shots[0].fit === 'contain' ? 'project__shot--contain' : ''}` }, [
        el('img', { src: shots[0].src, alt: pick(lang, shots[0].alt), loading: 'eager', decoding: 'async' }),
      ]);
      const thumbs = el('div', { class: 'project__thumbs', role: 'tablist' });
      shots.forEach((s, i) => {
        const btn = el('button', { type: 'button', 'aria-current': i === 0, 'aria-label': pick(lang, s.alt) }, [
          el('img', { src: s.src, alt: '', loading: 'lazy' }),
        ]);
        btn.addEventListener('click', () => {
          const img = main.querySelector('img');
          img.src = s.src;
          img.alt = pick(lang, s.alt);
          main.classList.toggle('project__shot--contain', s.fit === 'contain');
          thumbs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', b === btn));
        });
        thumbs.append(btn);
      });
      main.addEventListener('click', () => openLightbox(main.querySelector('img')));

      const links = el('div', { class: 'project__links' });
      if (p.live) links.append(el('a', { class: 'btn btn--primary btn--sm', href: p.live, target: '_blank', rel: 'noreferrer', text: `${t(lang, 'labels.live')} ↗` }));
      if (p.repo && !p.repoPrivate) links.append(el('a', { class: 'btn btn--ghost btn--sm', href: p.repo, target: '_blank', rel: 'noreferrer', text: `${t(lang, 'labels.repo')} ↗` }));

      const body = el('div', { class: 'project__body' }, [
        el('div', { class: 'project__top' }, [
          el('h3', { text: p.name }),
          el('span', { class: `badge badge--${p.status}`, text: t(lang, `labels.status.${p.status}`) }),
        ]),
        el('p', { class: 'project__desc', text: pick(lang, p.desc) }),
        el('ul', { class: 'project__points' }, (p.points[lang] || p.points.pt).map((pt) => el('li', { text: pt }))),
        el('div', { class: 'tags' }, p.tags.map((tag) => el('span', { class: 'tag', text: tag }))),
        links,
        p.repoPrivate ? el('p', { class: 'project__note', text: `// ${t(lang, 'labels.private')}` }) : null,
      ]);

      root.append(el('article', { class: 'project', id: `project-${p.id}` }, [
        el('div', { class: 'project__media' }, [main, shots.length > 1 ? thumbs : null]),
        body,
      ]));
    });
  }

  function renderExperience(lang) {
    const root = document.getElementById('experience-list');
    root.replaceChildren();
    DATA.experience.forEach((x) => {
      root.append(el('li', { class: `tl ${x.end ? '' : 'tl--current'}` }, [
        el('div', { class: 'tl__meta' }, [
          el('span', { class: 'tl__period', text: formatPeriod(lang, x.start, x.end) }),
          el('span', { text: pick(lang, x.location) }),
        ]),
        el('h3', { class: 'tl__role' }, [
          document.createTextNode(`${pick(lang, x.role)} · `),
          el('span', { class: 'tl__company', text: pick(lang, x.company) }),
        ]),
        el('ul', { class: 'tl__points' }, (x.points[lang] || x.points.pt).map((pt) => el('li', { text: pt }))),
        el('p', { class: 'tl__stack', text: x.stack }),
      ]));
    });
  }

  function renderSkills(lang) {
    const root = document.getElementById('skills-list');
    root.replaceChildren();
    DATA.skills.forEach((group) => {
      root.append(el('div', { class: 'skill' }, [
        el('h3', { text: pick(lang, group.title) }),
        el('div', { class: 'tags' }, group.items.map((item) => el('span', { class: 'tag', text: item }))),
      ]));
    });
  }

  function renderLists(lang) {
    const edu = document.getElementById('education-list');
    edu.replaceChildren(...DATA.education.map((e) => el('li', {}, [el('strong', { text: pick(lang, e.title) }), el('span', { text: `${e.school} · ${e.year}` })])));
    const langs = document.getElementById('languages-list');
    langs.replaceChildren(...DATA.languages.map((l) => el('li', {}, [el('strong', { text: pick(lang, l.name) }), el('span', { text: pick(lang, l.level) })])));
    const goals = document.getElementById('goals-list');
    goals.replaceChildren(...(DATA.goals[lang] || DATA.goals.pt).map((g) => el('li', {}, [el('strong', { text: g })])));
  }

  function applyStatic(lang) {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(lang, node.getAttribute('data-i18n'));
    });
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  }

  function setLang(lang, persist = true) {
    applyStatic(lang);
    renderProjects(lang);
    renderExperience(lang);
    renderSkills(lang);
    renderLists(lang);
    if (persist) {
      try { localStorage.setItem('lang', lang); } catch (_) { /* ignore */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    }
  }

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  function openLightbox(img) {
    const target = lightbox.querySelector('img');
    target.src = img.src;
    target.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  document.getElementById('year').textContent = new Date().getFullYear();
  setLang(detectLang(), false);
})();
