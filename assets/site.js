/* jackdebrabander.com — motion layer. Everything here is decoration: the page reads fine without it. */
(() => {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---- split the hero name into letters, then play the intro ---- */
  $$('.name .line').forEach(line => {
    let i = Number(line.dataset.offset || 0);
    line.innerHTML = [...line.textContent].map(c => c === ' ' ? ' ' : `<span class="ch" style="--i:${i++}">${c}</span>`).join('');
  });
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('is-ready')));

  /* ---- nav: progress bar, hide on scroll down, mobile menu ---- */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    nav.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 20);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menu = $('.menu-btn');
  if (menu) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }));
  }

  /* ---- rotating role line ---- */
  const slot = $('.role .slot');
  if (slot) {
    const words = $$('b', slot);
    let k = 0;
    words[0].classList.add('is-on');
    if (!reduce) setInterval(() => {
      const cur = words[k];
      k = (k + 1) % words.length;
      cur.classList.remove('is-on'); cur.classList.add('is-off');
      words[k].classList.remove('is-off'); words[k].classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-off'), 700);
    }, 2600);
  }

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], .wheel').forEach(el => io.observe(el));

  /* ---- hero network canvas: three product colors, drifting, reacts to the pointer ---- */
  const canvas = $('#net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const colors = ['139,92,246', '61,155,255', '255,138,61'];
    let w = 0, h = 0, dpr = 1, pts = [], running = true, mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 16000));
      pts = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8, c: colors[i % 3],
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = Math.min(150, w / 7);
      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) { const f = (1 - Math.sqrt(d2) / 140) * 0.9; p.x += (dx / 140) * f; p.y += (dy / 140) * f; }
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < link) {
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / link) * 0.35})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${a.c},0.9)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduce) requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', () => { resize(); if (reduce) draw(); });
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    hero.addEventListener('pointerleave', () => { mouse = { x: -9999, y: -9999 }; });
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was && !reduce) draw(); }).observe(hero);
  }

  /* ---- pointer toys (desktop only) ---- */
  if (fine && !reduce) {
    const cursor = $('.cursor');
    if (cursor) {
      let cx = 0, cy = 0, tx = 0, ty = 0;
      window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
      document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
      const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cursor.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
      loop();
      $$('a, button, [data-tilt]').forEach(el => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-big'));
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
      });
    }
    $$('[data-tilt]').forEach(el => {
      const card = el.querySelector('.portrait-card') || el;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${x * 10}deg`); card.style.setProperty('--rx', `${-y * 10}deg`);
      });
      el.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- stacked product panels shrink as the next one slides over ---- */
  const panels = $$('.panel');
  const about = $('.about-photo img');
  const onFrame = () => {
    if (window.innerWidth > 960) {
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        if (!next) return;
        const top = parseFloat(getComputedStyle(p).top) || 96;
        const gap = next.getBoundingClientRect().top - top;
        const t = Math.min(1, Math.max(0, 1 - gap / p.offsetHeight));
        p.style.setProperty('--s', (1 - t * 0.06).toFixed(4));
      });
    }
    if (about) {
      const r = about.parentElement.getBoundingClientRect();
      const t = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      about.style.setProperty('--py', `${(t * -40).toFixed(1)}px`);
    }
  };
  if (!reduce) { window.addEventListener('scroll', () => requestAnimationFrame(onFrame), { passive: true }); onFrame(); }

  /* ---- live demos: each loops only while on screen ---- */
  const whenVisible = (el, start) => {
    let timer = null, on = false;
    const run = async () => { while (on) { await start(); } };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; el.classList.add('live'); run(); }
      else if (!e.isIntersecting) { on = false; }
    }, { threshold: 0.3 }).observe(el);
    return () => clearTimeout(timer);
  };
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  const crm = $('#demo-crm');
  if (crm) {
    const thread = $('.thread', crm), typing = $('.typing', crm), booked = $('[data-count="booked"]', crm);
    const script = [
      ['lead', 'New lead · Facebook', 'Hi, I saw your ad. How much is a plan for me and my wife?'],
      ['out', 'Workflow · 2s', 'Happy to help! How old are you both?'],
      ['lead', 'Lead', '58 and 55'],
      ['out', 'AI assistant · drafted', 'Thanks! I found a few plans that fit the two of you. Does Tuesday at 3:30 work for a quick call?'],
      ['lead', 'Lead', 'Tuesday works'],
      ['booked', '', 'Booked · Tue 3:30 PM · calendar synced'],
    ];
    let count = 41;
    whenVisible(crm, async () => {
      thread.innerHTML = '';
      for (const [kind, label, text] of script) {
        if (kind === 'out') { typing.classList.add('on'); thread.appendChild(typing); await wait(1100); typing.classList.remove('on'); }
        const m = document.createElement('div');
        m.className = `msg ${kind}`;
        m.innerHTML = label ? `<small>${label}</small>${text}` : text;
        thread.appendChild(m);
        requestAnimationFrame(() => m.classList.add('in'));
        if (kind === 'booked') { count += 1; booked.textContent = count; }
        await wait(kind === 'lead' ? 1300 : 1500);
      }
      await wait(3200);
    });
  }

  const health = $('#demo-health');
  if (health) {
    const people = $$('.household span', health), plans = $$('.plan', health);
    whenVisible(health, async () => {
      people.forEach(p => p.classList.remove('on')); plans.forEach(p => p.classList.remove('on'));
      await wait(600);
      for (const p of people) { p.classList.add('on'); await wait(450); }
      for (const p of plans) { await wait(800); p.classList.add('on'); }
      await wait(3600);
    });
  }

  const data = $('#demo-data');
  if (data) {
    const rows = $$('.row', data), meter = $('.meter', data);
    const nums = { checked: $('[data-count="checked"]', data), removed: $('[data-count="removed"]', data), ready: $('[data-count="ready"]', data) };
    whenVisible(data, async () => {
      rows.forEach(r => r.classList.remove('done', 'drop'));
      meter.style.setProperty('--m', 0);
      Object.values(nums).forEach(n => { n.textContent = '0'; });
      await wait(500);
      let removed = 0;
      for (let i = 0; i < rows.length; i++) {
        await wait(650);
        const r = rows[i];
        r.classList.add('done');
        if (r.dataset.drop) { r.classList.add('drop'); removed++; }
        meter.style.setProperty('--m', ((i + 1) / rows.length) * 100);
        nums.checked.textContent = i + 1;
        nums.removed.textContent = removed;
        nums.ready.textContent = i + 1 - removed;
      }
      await wait(3600);
    });
  }

  /* ---- copy email ---- */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const note = $('.copy-note');
    try { await navigator.clipboard.writeText(btn.dataset.copy); if (note) note.textContent = 'Email copied.'; }
    catch { if (note) note.textContent = btn.dataset.copy; }
  }));

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
