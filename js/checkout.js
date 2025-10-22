(function() {
  const KEY = 'garmr_cart';
  const FREE_SHIP_THRESHOLD = 300;
  const SHIPPING_RATES = {
    std: 19,
    exp: 39
  };
  const PROMOS = {
    GOLD15: { type: 'percent', value: 0.15, label: 'Gold tier – 15% off' },
    VIP20: { type: 'percent', value: 0.2, label: 'VIP – 20% off' }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    cart: [],
    subtotal: 0,
    discount: 0,
    discountCode: null,
    shipping: {},
    shippingMethod: 'std',
    shippingLabel: 'Standard — $19.00 (Free over $300)',
    shippingCost: SHIPPING_RATES.std
  };

  const countryNames = {
    AU: 'Australia',
    US: 'United States',
    GB: 'United Kingdom',
    EU: 'European Union'
  };

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (err) {
      console.error('Failed to parse cart', err);
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function computeSubtotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function computeShipping(method, subtotal) {
    if (method === 'exp') return SHIPPING_RATES.exp;
    if (subtotal >= FREE_SHIP_THRESHOLD) return 0;
    return SHIPPING_RATES.std;
  }

  function computeDiscount(subtotal) {
    if (!state.discountCode) return 0;
    const promo = PROMOS[state.discountCode];
    if (!promo) return 0;
    if (promo.type === 'percent') {
      return Math.min(subtotal, subtotal * promo.value);
    }
    if (promo.type === 'flat') {
      return Math.min(subtotal, promo.value);
    }
    return 0;
  }

  function setStep(step) {
    const panels = $$('.co-left [data-step]');
    panels.forEach(panel => {
      const isCurrent = Number(panel.dataset.step) === step;
      panel.hidden = !isCurrent;
      panel.classList.toggle('active', isCurrent);
    });

    const navSteps = $$('.co-steps .step[data-step]');
    navSteps.forEach(nav => {
      const navStep = Number(nav.dataset.step);
      nav.classList.toggle('current', navStep === step);
      nav.classList.toggle('done', navStep < step);
    });

    const currentPanel = panels.find(p => Number(p.dataset.step) === step);
    if (currentPanel) {
      const focusable = currentPanel.querySelector('input, select, button');
      if (focusable) {
        setTimeout(() => focusable.focus(), 40);
      }
    }
  }

  function clearErrors(form) {
    form.querySelectorAll('.err').forEach(err => (err.textContent = ''));
    form.querySelectorAll('input, select').forEach(field => field.classList.remove('invalid'));
  }

  function setFieldError(form, fieldName, message) {
    const field = form.querySelector(`#${fieldName}`);
    const err = form.querySelector(`.err[data-for="${fieldName}"]`);
    if (field) field.classList.add('invalid');
    if (err) err.textContent = message || '';
  }

  function validateShipping(form) {
    clearErrors(form);
    let valid = true;
    const required = ['email', 'first', 'last', 'address', 'city', 'state', 'zip', 'country', 'ship-method'];

    required.forEach(name => {
      const input = form.querySelector(`#${name}`);
      if (!input) return;
      if (!input.value.trim()) {
        setFieldError(form, name, 'Required');
        valid = false;
      }
    });

    const email = form.querySelector('#email');
    if (email && email.value.trim()) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!emailValid) {
        setFieldError(form, 'email', 'Enter a valid email');
        valid = false;
      }
    }

    const zip = form.querySelector('#zip');
    if (zip && zip.value.trim() && zip.value.trim().length < 3) {
      setFieldError(form, 'zip', 'Too short');
      valid = false;
    }

    return valid;
  }

  function collectShipping(form) {
    if (!form) return;
    const methodSelect = $('#ship-method');
    state.shippingMethod = methodSelect ? methodSelect.value : 'std';
    state.shippingLabel = methodSelect ? methodSelect.options[methodSelect.selectedIndex].text : '';

    state.shipping = {
      email: $('#email', form)?.value.trim() || '',
      phone: $('#phone', form)?.value.trim() || '',
      first: $('#first', form)?.value.trim() || '',
      last: $('#last', form)?.value.trim() || '',
      address1: $('#address', form)?.value.trim() || '',
      address2: $('#address2', form)?.value.trim() || '',
      city: $('#city', form)?.value.trim() || '',
      state: $('#state', form)?.value.trim() || '',
      zip: $('#zip', form)?.value.trim() || '',
      country: $('#country', form)?.value || 'AU'
    };
  }

  function validatePayment(form) {
    clearErrors(form);
    let valid = true;

    const required = ['cardname', 'cardnum', 'cardexp', 'cardcvc'];
    required.forEach(name => {
      const input = form.querySelector(`#${name}`);
      if (!input) return;
      if (!input.value.trim()) {
        setFieldError(form, name, 'Required');
        valid = false;
      }
    });

    const cardnum = form.querySelector('#cardnum');
    if (cardnum && cardnum.value.trim()) {
      const digits = cardnum.value.replace(/\D+/g, '');
      if (digits.length < 12) {
        setFieldError(form, 'cardnum', 'Card number is incomplete');
        valid = false;
      }
    }

    const exp = form.querySelector('#cardexp');
    if (exp && exp.value.trim()) {
      const match = exp.value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!match) {
        setFieldError(form, 'cardexp', 'Use MM/YY');
        valid = false;
      }
    }

    const cvc = form.querySelector('#cardcvc');
    if (cvc && cvc.value.trim()) {
      const digits = cvc.value.replace(/\D+/g, '');
      if (digits.length < 3) {
        setFieldError(form, 'cardcvc', 'CVC is incomplete');
        valid = false;
      }
    }

    return valid;
  }

  function renderSummary() {
    const itemsWrap = $('#sum-items');
    const subEl = $('#sum-sub');
    const shipEl = $('#sum-ship');
    const totalEl = $('#sum-total');
    const discountEl = $('#sum-discount');
    const shipNote = $('#ship-note');

    state.subtotal = computeSubtotal(state.cart);
    state.shippingCost = computeShipping(state.shippingMethod, state.subtotal);
    state.discount = computeDiscount(state.subtotal);

    if (itemsWrap) {
      if (!state.cart.length) {
        itemsWrap.innerHTML = '<p class="muted">Your cart is empty. <a href="/collection.html" class="link-under">Return to shop</a></p>';
      } else {
        itemsWrap.innerHTML = state.cart.map(item => {
          const safeName = escapeHtml(item.name);
          const safeImg = escapeHtml(item.img);
          return `
            <div class="item-row">
              <img src="${safeImg}" alt="${safeName}">
              <div class="item-meta">
                <h4>${safeName}</h4>
                <div class="qty">Qty ${item.qty}</div>
              </div>
              <div class="item-price">${formatCurrency(item.price * item.qty)}</div>
            </div>
          `;
        }).join('');
      }
    }

    if (subEl) subEl.textContent = formatCurrency(state.subtotal);

    if (discountEl) {
      discountEl.textContent = state.discount > 0 ? `−${formatCurrency(state.discount)}` : '—';
    }

    if (shipEl) {
      if (!state.cart.length) {
        shipEl.textContent = '—';
      } else {
        shipEl.textContent = state.shippingCost === 0 ? 'Complimentary' : formatCurrency(state.shippingCost);
      }
    }

    const total = Math.max(0, state.subtotal - state.discount) + (state.cart.length ? state.shippingCost : 0);
    if (totalEl) totalEl.textContent = formatCurrency(total);

    if (shipNote) {
      if (!state.cart.length) {
        shipNote.textContent = '';
      } else if (state.shippingMethod === 'exp') {
        shipNote.textContent = 'Express shipping arrives within 1-2 business days to most metro areas.';
      } else if (state.shippingCost === 0) {
        shipNote.textContent = 'Complimentary standard shipping unlocked.';
      } else {
        const diff = Math.max(0, FREE_SHIP_THRESHOLD - state.subtotal);
        shipNote.textContent = `Spend $${diff.toFixed(2)} more to unlock complimentary standard shipping.`;
      }
    }
  }

  function renderReview() {
    const shipWrap = $('#review-ship');
    const itemsWrap = $('#review-items');

    if (shipWrap) {
      const ship = state.shipping || {};
      const countryName = countryNames[ship.country] || ship.country || '';
      const nameLine = [ship.first, ship.last].filter(Boolean).join(' ');
      const cityState = [ship.city, ship.state].filter(Boolean).join(', ');
      const locality = [cityState, ship.zip].filter(Boolean).join(' ');
      const lines = [
        nameLine,
        ship.address1,
        ship.address2,
        locality,
        countryName,
        state.shippingLabel,
        ship.email,
        ship.phone && `Phone: ${ship.phone}`
      ].filter(Boolean);
      shipWrap.innerHTML = lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
    }

    if (itemsWrap) {
      if (!state.cart.length) {
        itemsWrap.innerHTML = '<p class="muted">No items found.</p>';
      } else {
        const list = state.cart.map(item => `
          <div class="item">
            <span>${escapeHtml(item.name)} × ${item.qty}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
          </div>
        `).join('');
        const totals = `
          <div class="review-totals">
            <div class="row"><span>Subtotal</span><span>${formatCurrency(state.subtotal)}</span></div>
            <div class="row"><span>Discount</span><span>${state.discount > 0 ? `−${formatCurrency(state.discount)}` : '—'}</span></div>
            <div class="row"><span>Shipping</span><span>${state.shippingCost === 0 ? 'Complimentary' : formatCurrency(state.shippingCost)}</span></div>
            <div class="row"><span>Tax</span><span>Calculated at payment</span></div>
            <div class="row total"><span>Total</span><span>${formatCurrency(Math.max(0, state.subtotal - state.discount) + state.shippingCost)}</span></div>
          </div>
        `;
        itemsWrap.innerHTML = `<div class="review-list">${list}</div>${totals}`;
      }
    }
  }

  function applyPromo(code) {
    const promoMsg = $('#promo-msg');
    if (promoMsg) {
      promoMsg.textContent = '';
      promoMsg.classList.remove('error', 'success');
    }

    const trimmed = (code || '').toUpperCase().trim();
    if (!trimmed) {
      state.discountCode = null;
      state.discount = 0;
      if (promoMsg) {
        promoMsg.textContent = 'Discount cleared.';
        promoMsg.classList.add('success');
      }
      renderSummary();
      renderReview();
      return;
    }

    const promo = PROMOS[trimmed];
    if (!promo) {
      state.discountCode = null;
      state.discount = 0;
      if (promoMsg) {
        promoMsg.textContent = 'Code not recognized.';
        promoMsg.classList.add('error');
      }
      renderSummary();
      renderReview();
      return;
    }

    state.discountCode = trimmed;
    state.discount = computeDiscount(state.subtotal);
    if (promoMsg) {
      promoMsg.textContent = `${promo.label} applied.`;
      promoMsg.classList.add('success');
    }
    renderSummary();
    renderReview();
  }

  function handlePlaceOrder(button) {
    button.disabled = true;
    const orderId = `GAR-${Math.floor(100000 + Math.random() * 900000)}`;

    saveCart([]);
    state.cart = [];
    state.subtotal = 0;
    state.discount = 0;
    state.discountCode = null;

    const countEl = $('#cart-count');
    if (countEl) countEl.textContent = '0';
    const miniWrap = $('#mini-cart-items');
    if (miniWrap) miniWrap.innerHTML = '<p style="opacity:0.9">Your cart is empty.</p>';
    const miniSub = $('#mini-subtotal');
    if (miniSub) miniSub.textContent = '$0.00';

    renderSummary();

    const left = $('.co-left');
    if (left) {
      left.innerHTML = `
        <section class="place-confirm">
          <h2>Order Placed</h2>
          <p>Your order <strong>${orderId}</strong> is confirmed. A confirmation email has been sent to ${escapeHtml(state.shipping.email || 'your inbox')}.</p>
          <a href="/collection.html" class="btn btn-gold">Continue Shopping</a>
        </section>
      `;
    }

    const navSteps = $$('.co-steps .step[data-step]');
    navSteps.forEach(step => {
      step.classList.remove('current');
      step.classList.add('done');
    });
    const reviewStep = navSteps.find(step => step.dataset.step === '3');
    if (reviewStep) reviewStep.classList.add('current');
  }

  document.addEventListener('DOMContentLoaded', () => {
    state.cart = loadCart();

    const methodSelect = $('#ship-method');
    if (methodSelect) {
      state.shippingMethod = methodSelect.value;
      state.shippingLabel = methodSelect.options[methodSelect.selectedIndex].text;
      methodSelect.addEventListener('change', () => {
        state.shippingMethod = methodSelect.value;
        state.shippingLabel = methodSelect.options[methodSelect.selectedIndex].text;
        state.shippingCost = computeShipping(state.shippingMethod, state.subtotal);
        renderSummary();
        renderReview();
      });
    }

    renderSummary();

    if (!state.cart.length) {
      const left = $('.co-left');
      if (left) {
        left.innerHTML = `
          <section class="place-confirm">
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before checking out. Explore the latest drops below.</p>
            <a href="/collection.html" class="btn btn-gold">Explore Collection</a>
          </section>
        `;
      }
      const steps = $$('.co-steps .step[data-step]');
      steps.forEach(step => step.classList.remove('current', 'done'));
      return;
    }

    const shippingForm = $('#step-shipping');
    const paymentForm = $('#step-payment');

    $('#to-payment')?.addEventListener('click', () => {
      if (!shippingForm) return;
      if (!validateShipping(shippingForm)) {
        return;
      }
      collectShipping(shippingForm);
      renderSummary();
      setStep(2);
    });

    $('#back-to-shipping')?.addEventListener('click', () => setStep(1));

    $('#to-review')?.addEventListener('click', () => {
      if (!paymentForm) return;
      if (!validatePayment(paymentForm)) {
        return;
      }
      renderReview();
      setStep(3);
    });

    $('#back-to-payment')?.addEventListener('click', () => setStep(2));

    $('#place-order')?.addEventListener('click', (e) => {
      e.preventDefault();
      const button = e.currentTarget;
      if (button instanceof HTMLElement) {
        handlePlaceOrder(button);
      }
    });

    $('#apply-code')?.addEventListener('click', () => {
      const code = $('#promo')?.value;
      applyPromo(code || '');
    });

    $('#promo')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromo(e.target.value || '');
      }
    });

    // Prefill review data if user goes directly to payment
    collectShipping(shippingForm);
    renderReview();

    setStep(1);
  });
})();
