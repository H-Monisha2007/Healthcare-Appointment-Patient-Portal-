/* Main application: each feature is its own module */
const REG_KEY = 'spectrum_registrations', ENQ_KEY = 'spectrum_enquiries';
const { $, $$, el, load, save } = Utils;
const { events, departments } = PortalData;

const Nav = { init() {
  const btn = $('#menuBtn'), menu = $('#navMenu');
  const set = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', () => { if (innerWidth > 820) set(false); });
  if ('IntersectionObserver' in window) {
    const links = $$('.nav a'), obs = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('main section[id]').forEach(s => obs.observe(s));
  }
  $('#year-now').textContent = new Date().getFullYear();
}};

const Home = { init() {
  const days = new Set(events.map(e => e.date)).size;
  [[events.length, 'Events'], [days, 'Days'], ['5000+', 'Participants'], ['₹5L', 'Prize Pool']].forEach(([n, l]) => {
    const li = el('li'); li.append(el('strong', '', n), l); $('#stats').append(li);
  });
  PortalData.highlights.forEach(h => {
    const d = el('div', 'hl'); d.append(el('div', 'ic', h.ic), el('h3', '', h.t), el('p', '', h.d)); $('#highlights').append(d);
  });
  [...PortalData.announcements].sort((a, b) => b.date.localeCompare(a.date)).forEach((a, i) => {
    const li = el('li'), t = el('time', '', Utils.fmtDate(a.date)); t.dateTime = a.date;
    const p = el('span', '', a.text); if (i === 0) p.append(el('span', 'new', 'NEW'));
    li.append(t, p); $('#announcements').append(li);
  });
}};

const Events = {
  cat: 'All',
  init() {
    ['All', ...new Set(events.map(e => e.category))].forEach(c => {
      const b = el('button', 'chip', c); b.type = 'button'; b.setAttribute('aria-pressed', String(c === 'All'));
      b.addEventListener('click', () => { this.cat = c; $$('.chip', $('#filters')).forEach(x => x.setAttribute('aria-pressed', String(x === b))); this.render(); });
      $('#filters').append(b);
    });
    $('#eventSearch').addEventListener('input', () => this.render());
    events.forEach(e => $('#event').append(new Option(`${e.name} (${Utils.fmtDate(e.date)})`, e.name)));
    this.render();
  },
  render() {
    const q = $('#eventSearch').value.trim().toLowerCase(), grid = $('#eventGrid'); grid.replaceChildren();
    const list = events.filter(e => (this.cat === 'All' || e.category === this.cat) && `${e.name} ${e.venue} ${e.category}`.toLowerCase().includes(q));
    $('#eventCount').textContent = `Showing ${list.length} of ${events.length} events`;
    if (!list.length) grid.append(el('p', 'empty', 'No events match your filter.'));
    list.forEach(e => {
      const c = el('article', 'card ev'), btn = el('button', 'btn', 'Register'); btn.type = 'button';
      btn.setAttribute('aria-label', 'Register for ' + e.name);
      btn.addEventListener('click', () => Register.choose(e.name));
      c.append(el('span', 'tag ' + e.category, e.category), el('h3', '', e.name),
        el('p', 'meta', `📅 ${Utils.fmtDate(e.date)}`), el('p', 'meta', `🕘 ${Utils.fmtTime(e.time)}`), el('p', 'meta', `📍 ${e.venue}`),
        el('p', 'desc', e.desc), btn);
      grid.append(c);
    });
  }
};

const Schedule = {
  init() {
    const dates = [...new Set(events.map(e => e.date))].sort(), tabs = $('#dayTabs');
    dates.forEach((d, i) => {
      const b = el('button', 'chip', `Day ${i + 1} · ${new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`); b.type = 'button';
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => { $$('.chip', tabs).forEach(x => x.setAttribute('aria-pressed', String(x === b))); this.render(d); });
      tabs.append(b);
    });
    this.render(dates[0]);
  },
  render(date) {
    const body = $('#scheduleBody'); body.replaceChildren();
    events.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time)).forEach(e => {
      const tr = el('tr'); [Utils.fmtTime(e.time), e.name, e.venue, e.category].forEach(t => tr.append(el('td', '', t))); body.append(tr);
    });
  }
};

const Register = {
  init() {
    departments.forEach(d => $('#department').append(new Option(d, d)));
    this.form = $('#regForm');
    this.form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) { f.classList.remove('invalid'); $('.err', f).textContent = ''; } });
    $('#clearAll').addEventListener('click', () => {
      if (!load(REG_KEY).length) return Utils.status($('#formStatus'), 'There are no records to clear.', 'bad');
      if (confirm('Delete ALL registration records?')) { save(REG_KEY, []); this.render(); Utils.status($('#formStatus'), 'All records cleared.', 'ok'); }
    });
    this.render();
  },
  choose(name) {
    $('#event').value = name;
    $('#register').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('#name').focus({ preventScroll: true }), 500);
    Utils.status($('#formStatus'), `"${name}" selected. Fill in your details to register.`, 'ok');
  },
  submit() {
    const r = Utils.rules, st = $('#formStatus');
    const v = Utils.validate({
      name: [r.name, 'nameErr'], email: [r.email, 'emailErr'], mobile: [r.mobile, 'mobileErr'],
      department: [r.required('a department'), 'departmentErr'], year: [r.required('your year'), 'yearErr'], event: [r.required('an event'), 'eventErr']
    });
    if (!v) return Utils.status(st, 'Please fix the highlighted errors and try again.', 'bad');
    const list = load(REG_KEY);
    if (list.some(x => x.email.toLowerCase() === v.email.toLowerCase() && x.event === v.event))
      return Utils.status(st, 'This email is already registered for that event.', 'bad');
    list.push({ id: Date.now(), ...v, at: new Date().toISOString() });
    if (!save(REG_KEY, list)) return Utils.status(st, 'Could not save (browser storage unavailable).', 'bad');
    Utils.status(st, `🎉 Thank you, ${v.name}! You are registered for ${v.event}.`, 'ok');
    this.form.reset(); Utils.clearErrors(this.form); this.render();
  },
  render() {
    const list = load(REG_KEY), body = $('#recBody'); body.replaceChildren();
    $('#recCount').textContent = `${list.length} registration${list.length === 1 ? '' : 's'} saved`;
    if (!list.length) { const tr = el('tr'), td = el('td', 'empty', 'No registrations yet.'); td.colSpan = 5; tr.append(td); body.append(tr); return; }
    list.forEach(x => {
      const tr = el('tr'), act = el('td'), del = el('button', 'btn btn-danger btn-sm', 'Delete'); del.type = 'button';
      del.setAttribute('aria-label', `Delete registration of ${x.name}`);
      del.addEventListener('click', () => { save(REG_KEY, load(REG_KEY).filter(r => r.id !== x.id)); this.render(); Utils.status($('#formStatus'), 'Registration deleted.', 'ok'); });
      act.append(del);
      [x.name, x.event, `${x.department} / ${x.year}`, `${x.email} · ${x.mobile}`].forEach(t => tr.append(el('td', '', t)));
      tr.append(act); body.append(tr);
    });
  }
};

const Gallery = {
  i: 0,
  init() {
    this.dlg = $('#lightbox');
    PortalData.gallery.forEach((g, i) => {
      const b = el('button', 'g-item'); b.type = 'button'; b.style.background = `linear-gradient(135deg,${g.g[0]},${g.g[1]})`;
      b.setAttribute('aria-label', 'Open image: ' + g.c);
      b.append(el('span', 'emoji', g.e), el('span', 'cap', g.c));
      b.addEventListener('click', () => this.open(i)); $('#galleryGrid').append(b);
    });
    $('#lbClose').addEventListener('click', () => this.dlg.close());
    $('#lbPrev').addEventListener('click', () => this.show(this.i - 1));
    $('#lbNext').addEventListener('click', () => this.show(this.i + 1));
    this.dlg.addEventListener('click', e => { if (e.target === this.dlg) this.dlg.close(); });
    this.dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') this.show(this.i - 1); if (e.key === 'ArrowRight') this.show(this.i + 1); });
  },
  open(i) { this.show(i); if (!this.dlg.open) this.dlg.showModal(); },
  show(i) {
    const n = PortalData.gallery.length; this.i = (i + n) % n; const g = PortalData.gallery[this.i], img = $('#lbImg');
    img.style.background = `linear-gradient(135deg,${g.g[0]},${g.g[1]})`; img.textContent = g.e; img.setAttribute('aria-label', g.c);
    $('#lbCap').textContent = `${g.c} (${this.i + 1}/${n})`;
  }
};

const Contact = { init() {
  const form = $('#contactForm'), r = Utils.rules;
  form.addEventListener('input', e => { const f = e.target.closest('.field'); f.classList.remove('invalid'); $('.err', f).textContent = ''; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = Utils.validate({ cName: [r.name, 'cNameErr'], cEmail: [r.email, 'cEmailErr'], cMsg: [r.message, 'cMsgErr'] }), st = $('#contactStatus');
    if (!v) return Utils.status(st, 'Please correct the errors below.', 'bad');
    const list = load(ENQ_KEY); list.push({ name: v.cName, email: v.cEmail, message: v.cMsg, at: new Date().toISOString() }); save(ENQ_KEY, list);
    Utils.status(st, `Thanks ${v.cName}! Your enquiry has been sent. We'll reply soon.`, 'ok');
    form.reset(); Utils.clearErrors(form);
  });
}};

document.addEventListener('DOMContentLoaded', () => [Nav, Home, Events, Schedule, Register, Gallery, Contact].forEach(m => m.init()));
