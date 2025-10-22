(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

  function showOrderField(){
    const subj = $('#subject')?.value || '';
    const cond = $('.conditional[data-show-if="Order issue"]');
    if(!cond) return;
    const show = subj === 'Order issue';
    cond.hidden = !show;
  }

  function validate(){
    let ok = true;
    const req = ['email','subject','message','consent'];
    req.forEach(id=>{
      const el = document.getElementById(id);
      const err = document.querySelector(`.err[data-for="${id}"]`);
      if(!el) return;
      let valid = true;
      if(id==='consent'){ valid = el.checked; }
      else if(id==='email'){ valid = el.value.trim().length>3 && el.checkValidity(); }
      else { valid = el.value.trim().length>0; }
      if(!valid){ ok=false; if(err) err.textContent = 'Required'; el.classList.add('bad'); }
      else { if(err) err.textContent = ''; el.classList.remove('bad'); }
    });
    return ok;
  }

  function submitForm(e){
    e.preventDefault();
    const state = $('#form-state');
    if(!validate()){ state.textContent = 'Please correct the highlighted fields.'; return; }

    // Build payload (for Formspree/Netlify later)
    const payload = {
      email: $('#email').value.trim(),
      subject: $('#subject').value,
      order: $('#order')?.value.trim() || '',
      message: $('#message').value.trim(),
      consent: $('#consent').checked
    };

    // Mailto fallback (keeps static site working)
    const lines = [
      `Subject: ${payload.subject}`,
      payload.order ? `Order: ${payload.order}` : '',
      '',
      payload.message
    ].filter(Boolean).join('%0D%0A');

    const mailto = `mailto:support@garmr.shop?subject=${encodeURIComponent('Support — GARMR')}&body=${lines}`;
    window.location.href = mailto;

    // UX: show success state (for users without a mail client we still show confirmation)
    state.textContent = 'Received. We’ll reply within 1–2 working days.';
    $('#contact-form').reset();
    showOrderField();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    $('#subject')?.addEventListener('change', showOrderField);
    $('#contact-form')?.addEventListener('submit', submitForm);
    showOrderField();
  });
})();
