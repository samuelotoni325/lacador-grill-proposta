(() => {
  const D = JSON.parse(document.getElementById('site-data').textContent);
  const PT = D.lang === 'pt';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + n.toFixed(2);
  document.documentElement.classList.add('js');

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };

  /* Hora de Orlando */
  function orlandoNow() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { dow, h: +get('hour') + +get('minute') / 60 };
  }
  const now = orlandoNow();
  const weekend = now.dow === 0 || now.dow >= 5;
  const rateToday = weekend ? D.lb.weekend : D.lb.week;
  const [OPEN, CLOSE] = D.open;
  const isOpen = now.h >= OPEN && now.h < CLOSE;
  const DAYS = PT ? ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function statusText() {
    if (isOpen) {
      const left = CLOSE - now.h;
      if (left <= 0.75) return PT ? `Aberto · fecha às 16h (faltam ${Math.round(left * 60)} min)` : `Open · closes at 4 PM (${Math.round(left * 60)} min left)`;
      return PT ? 'Aberto agora · até as 16h' : 'Open now · until 4 PM';
    }
    if (now.h < OPEN) return PT ? 'Fechado · abre hoje às 11h30' : 'Closed · opens today at 11:30 AM';
    return PT ? 'Fechado · abre amanhã às 11h30' : 'Closed · opens tomorrow at 11:30 AM';
  }
  $$('[data-status]').forEach((el) => {
    el.classList.add(isOpen ? 'is-open' : 'is-closed');
    $('[data-status-text]', el).textContent = statusText();
  });
  $$('[data-status-inline]').forEach((el) => { el.textContent = statusText(); });
  const tl = $('[data-today-label]');
  if (tl) {
    const showTomorrow = now.h >= CLOSE;
    const d = showTomorrow ? (now.dow + 1) % 7 : now.dow;
    const wk = d === 0 || d >= 5;
    tl.textContent = (showTomorrow ? (PT ? 'Amanhã, ' : 'Tomorrow, ') : (PT ? 'Hoje, ' : 'Today, ')) + DAYS[d];
    $('[data-today-price]').textContent = money(wk ? D.lb.weekend : D.lb.week);
  }
  $$('[data-hours] tr').forEach((tr) => { if (+tr.dataset.dow === now.dow) tr.classList.add('is-today'); });

  /* Cabeçalho e menu */
  const head = $('[data-head]');
  const onScroll = () => {
    head.classList.toggle('solid', scrollY > 40);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const toggle = $('[data-menu]'); const drawer = $('[data-drawer]');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    drawer.hidden = !open;
    document.body.classList.toggle('drawer-open', open);
  });

  /* Barra de ação: some perto do rodapé e do formulário */
  const bar = $('[data-actionbar]');
  const hideZones = $$('.site-foot, .ticket, .ev-form');
  if (bar && 'IntersectionObserver' in window) {
    const vis = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
      bar.classList.toggle('away', vis.size > 0);
    }, { threshold: 0.05 });
    hideZones.forEach((z) => io.observe(z));
  }

  /* Revelações e corda */
  const reveal = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(e.target.classList.contains('rope') ? 'drawn' : 'in'); reveal.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], .rope').forEach((el) => reveal.observe(el));

  /* Laço do hero */
  const lasso = $('.lasso path');
  if (lasso && !reduce) {
    lasso.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1600, delay: 500, easing: 'cubic-bezier(.6,.1,.2,1)', fill: 'forwards' });
  } else if (lasso) lasso.style.strokeDashoffset = 0;

  /* Balança */
  const scale = $('[data-scale]');
  if (scale) {
    const range = $('[data-lbrange]'); const needle = $('[data-needle]'); const fill = $('[data-dialfill]');
    const outP = $('[data-scaleprice]'); const outL = $('[data-scalelb]');
    const ticks = $('[data-ticks]');
    const MAX = 3; let rate = weekend ? 'weekend' : 'week';
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI; const r1 = 142; const r2 = i % 4 === 0 ? 124 : 132;
      const x1 = 200 + r1 * Math.cos(a); const y1 = 220 + r1 * Math.sin(a);
      const x2 = 200 + r2 * Math.cos(a); const y2 = 220 + r2 * Math.sin(a);
      ticks.insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
      if (i % 4 === 0) ticks.insertAdjacentHTML('beforeend', `<text x="${200 + 104 * Math.cos(a)}" y="${220 + 104 * Math.sin(a) + 5}" text-anchor="middle">${i / 4} lb</text>`);
    }
    const update = () => {
      const lb = +range.value; const f = lb / MAX;
      needle.style.transform = `rotate(${-90 + f * 180}deg)`;
      fill.style.strokeDashoffset = 1 - f;
      outP.textContent = money(lb * D.lb[rate]);
      outL.textContent = `${lb.toFixed(2)} lb × ${money(D.lb[rate])}/lb`;
      range.style.setProperty('--p', ((lb - 0.25) / (MAX - 0.25)) * 100 + '%');
    };
    $$('[data-daytoggle] button').forEach((b) => {
      b.setAttribute('aria-checked', b.dataset.rate === rate);
      b.addEventListener('click', () => {
        rate = b.dataset.rate;
        $$('[data-daytoggle] button').forEach((x) => x.setAttribute('aria-checked', x === b));
        update();
      });
    });
    range.addEventListener('input', update);
    needle.style.transition = reduce ? 'none' : 'transform .5s cubic-bezier(.3,1.5,.5,1)';
    update();
  }

  /* Mesa: escolha de tábua */
  const table = $('[data-table]');
  if (table) {
    const plates = $('[data-plates]');
    const draw = (n) => {
      plates.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const x = 210 + 118 * Math.cos(a); const y = 210 + 118 * Math.sin(a);
        const r = n > 6 ? 22 : 30;
        plates.insertAdjacentHTML('beforeend', `<g class="plate-g" style="transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${r * 0.65}"/></g>`);
      }
      if (!reduce) $$('.plate-g', plates).forEach((g, i) => g.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: i * 50, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'backwards' }));
    };
    $$('[data-board]', table).forEach((b) => b.addEventListener('click', () => {
      $$('[data-board]', table).forEach((x) => x.setAttribute('aria-checked', x === b));
      $$('[data-boardinfo]', table).forEach((p) => { p.hidden = p.dataset.boardinfo !== b.dataset.board; });
      draw(+b.dataset.seats);
    }));
    draw(4);
  }

  /* Balcão: rolagem horizontal fixada no desktop */
  const counter = $('[data-counter]');
  if (counter && window.gsap && window.ScrollTrigger && !reduce && matchMedia('(min-width: 900px)').matches) {
    gsap.registerPlugin(ScrollTrigger);
    counter.classList.add('is-pinned');
    const track = $('[data-track]', counter);
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: counter, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  }

  /* Hero: leve zoom ao rolar */
  const heroImg = $('.hero-img');
  if (heroImg && window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(heroImg, { scale: 1.12, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* Lenis */
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ lerp: 0.12 });
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -64 }); history.replaceState(null, '', id);
    }));
  }

  /* Pedido (comanda) */
  const ticket = $('[data-ticket]');
  if (ticket && D.items) {
    const ITEMS = Object.fromEntries(D.items.map((i) => [i.id, i]));
    let bag = store.get('lacador-bag') || {};
    Object.keys(bag).forEach((k) => { if (!ITEMS[k] || !(bag[k] > 0)) delete bag[k]; });
    const lines = $('[data-lines]'); const empty = $('[data-empty]'); const totalEl = $('[data-total]');
    const bagbar = $('[data-bagbar]');
    const when = $('[data-when]');
    // horários de retirada: hoje (se ainda der) e amanhã, a cada 15 min
    const slots = [];
    const fmt = (h) => {
      const H = Math.floor(h); const M = Math.round((h - H) * 60);
      return PT ? `${H}h${M ? String(M).padStart(2, '0') : ''}` : `${((H + 11) % 12) + 1}:${String(M).padStart(2, '0')} ${H < 12 ? 'AM' : 'PM'}`;
    };
    if (isOpen) slots.push([PT ? 'O quanto antes' : 'As soon as possible', 'asap']);
    const startToday = Math.max(OPEN, Math.ceil((now.h + 0.25) * 4) / 4);
    for (let h = startToday; h <= CLOSE - 0.25; h += 0.25) slots.push([(PT ? 'Hoje, ' : 'Today, ') + fmt(h), 'today ' + fmt(h)]);
    for (let h = OPEN; h <= CLOSE - 0.25; h += 0.25) slots.push([(PT ? 'Amanhã, ' : 'Tomorrow, ') + fmt(h), 'tomorrow ' + fmt(h)]);
    when.innerHTML = slots.map(([l]) => `<option>${l}</option>`).join('');

    const render = () => {
      let total = 0; let count = 0;
      $$('li:not(.empty)', lines).forEach((l) => l.remove());
      Object.entries(bag).forEach(([id, n]) => {
        const it = ITEMS[id]; total += it.price * n; count += n;
        lines.insertAdjacentHTML('beforeend', `<li><span>${n}×</span><span>${it.name}</span><span>${money(it.price * n)}</span><button type="button" data-rm="${id}" aria-label="${PT ? 'Tirar' : 'Remove'} ${it.name}">×</button></li>`);
      });
      empty.hidden = count > 0;
      totalEl.textContent = money(total);
      $$('[data-qty]').forEach((q) => {
        const n = bag[q.dataset.qty] || 0;
        $('[data-n]', q).textContent = n; q.classList.toggle('on', n > 0);
      });
      if (bagbar) {
        bagbar.hidden = count === 0;
        $('[data-bagcount]', bagbar).textContent = count;
        $('[data-bagtotal]', bagbar).textContent = money(total);
      }
      store.set('lacador-bag', bag);
      return { total, count };
    };
    document.addEventListener('click', (e) => {
      const plus = e.target.closest('[data-plus]'); const minus = e.target.closest('[data-minus]'); const rm = e.target.closest('[data-rm]');
      if (plus) { const id = plus.closest('[data-qty]').dataset.qty; bag[id] = Math.min(20, (bag[id] || 0) + 1); render(); }
      if (minus) { const id = minus.closest('[data-qty]').dataset.qty; bag[id] = (bag[id] || 0) - 1; if (bag[id] <= 0) delete bag[id]; render(); }
      if (rm) { delete bag[rm.dataset.rm]; render(); }
    });
    // esconde a barrinha quando a comanda está à vista
    if (bagbar && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => bagbar.classList.toggle('away', e.isIntersecting)).observe(ticket);
    }
    const msg = $('[data-formmsg]', ticket);
    ticket.addEventListener('submit', (e) => {
      e.preventDefault();
      const { total, count } = render();
      const name = ticket.name.value.trim();
      if (!count) { msg.textContent = PT ? 'Adicione pelo menos um prato ou tábua.' : 'Add at least one plate or board.'; msg.hidden = false; return; }
      if (!name) { msg.textContent = PT ? 'Diga seu nome para a comanda.' : 'Add your name for the ticket.'; msg.hidden = false; ticket.name.focus(); return; }
      msg.hidden = true;
      const mode = ticket.mode.value === 'dinein' ? (PT ? 'comer aqui' : 'dine in') : (PT ? 'para levar' : 'take out');
      const itemsTxt = Object.entries(bag).map(([id, n]) => `• ${n}x ${ITEMS[id].name} — ${money(ITEMS[id].price * n)}`).join('\n');
      const notes = ticket.notes.value.trim();
      const text = PT
        ? `Olá, Laçador! Pedido pela janela:\n\n${itemsTxt}\n\nTotal estimado: ${money(total)}\nNome: ${name}\nRetirada: ${when.value} (${mode})${notes ? `\nObs.: ${notes}` : ''}\n\nPodem confirmar?`
        : `Hi Laçador! Window order:\n\n${itemsTxt}\n\nEstimated total: ${money(total)}\nName: ${name}\nPickup: ${when.value} (${mode})${notes ? `\nNotes: ${notes}` : ''}\n\nCould you confirm?`;
      const iron = $('[data-iron]');
      iron.classList.remove('stamp'); void iron.getBoundingClientRect(); iron.classList.add('stamp');
      const url = `https://wa.me/${D.wa}?text=${encodeURIComponent(text)}`;
      ticket.dataset.lastUrl = url;
      setTimeout(() => window.open(url, '_blank', 'noopener'), reduce ? 0 : 450);
    });
    render();
  }

  /* Formulário de eventos */
  const ev = $('[data-evform]');
  if (ev) {
    const msg = $('[data-formmsg]', ev);
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    ev.date.min = today.toISOString().slice(0, 10);
    ev.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = ev.name.value.trim(); const date = ev.date.value; const guests = +ev.guests.value;
      if (!name || !date || !(guests >= 5)) {
        msg.textContent = PT ? 'Preencha nome, data e número de convidados (5 ou mais).' : 'Fill in your name, date and guest count (5 or more).';
        msg.hidden = false; return;
      }
      msg.hidden = true;
      const dt = new Date(date + 'T12:00').toLocaleDateString(PT ? 'pt-BR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
      const place = ev.place.value === 'venue' ? (PT ? 'no meu local' : 'at my venue') : (PT ? 'no espaço do Laçador' : 'at Laçador');
      const notes = ev.notes.value.trim();
      const text = PT
        ? `Olá, Laçador! Quero um orçamento para evento.\n\nNome: ${name}\nData: ${dt}\nConvidados: ${guests}\nOnde: ${place}\nTipo: ${ev.kind.value}${notes ? `\nO que procuro: ${notes}` : ''}`
        : `Hi Laçador! I'd like a quote for an event.\n\nName: ${name}\nDate: ${dt}\nGuests: ${guests}\nWhere: ${place}\nType: ${ev.kind.value}${notes ? `\nLooking for: ${notes}` : ''}`;
      const url = `https://wa.me/${D.wa}?text=${encodeURIComponent(text)}`;
      ev.dataset.lastUrl = url;
      window.open(url, '_blank', 'noopener');
    });
  }
})();
