/* Shared helpers: storage, DOM, validation */
const Utils = {
  $: (s, r = document) => r.querySelector(s),
  $$: (s, r = document) => [...r.querySelectorAll(s)],
  el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; },
  load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } },
  save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
  fmtDate(iso, long) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', long ? {weekday:'long',day:'numeric',month:'long'} : {day:'numeric',month:'short',year:'numeric'}); },
  fmtTime(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; },
  rules: {
    name: v => !v ? 'Name is required.' : !/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v) ? 'Enter a valid name (letters only, 2–50 characters).' : '',
    email: v => !v ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Enter a valid email address.' : '',
    mobile: v => !v ? 'Mobile number is required.' : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit mobile number starting with 6–9.' : '',
    required: label => v => v ? '' : `Please select ${label}.`,
    message: v => !v ? 'Message is required.' : v.length < 10 ? 'Message must be at least 10 characters.' : ''
  },
  /* validate: {fieldId: [rule, errorElementId]} -> values object, or null when invalid */
  validate(map) {
    let ok = true, first = null; const vals = {};
    for (const [id, [rule, errId]] of Object.entries(map)) {
      const input = Utils.$('#' + id), v = input.value.trim(), msg = rule(v);
      Utils.$('#' + errId).textContent = msg;
      input.closest('.field').classList.toggle('invalid', !!msg);
      input.setAttribute('aria-invalid', String(!!msg));
      if (msg) { ok = false; first = first || input; }
      vals[id] = v;
    }
    if (first) first.focus();
    return ok ? vals : null;
  },
  status(node, msg, type) { node.textContent = msg; node.className = 'alert ' + type; node.hidden = false; },
  clearErrors(form) { Utils.$$('.field', form).forEach(f => f.classList.remove('invalid')); Utils.$$('.err', form).forEach(e => e.textContent = ''); }
};
