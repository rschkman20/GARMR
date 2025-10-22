(function(){
  const KEY = 'garmr_cart';
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }

  function loadCart(){
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ return []; }
  }
  function saveCart(items){ localStorage.setItem(KEY, JSON.stringify(items)); }
  function getCount(items){ return items.reduce((n,i)=>n + i.qty, 0); }
  function getSubtotal(items){ return items.reduce((s,i)=>s + i.price * i.qty, 0); }

  function addItem(prod){
    const items = loadCart();
    const idx = items.findIndex(i=>i.id===prod.id);
    if(idx>-1){ items[idx].qty += prod.qty||1; }
    else { items.push({ id:prod.id, name:prod.name, price:Number(prod.price), img:prod.img, qty:prod.qty||1 }); }
    saveCart(items);
    updateCountBadge();
    renderMiniCart();
    toast(`${prod.name} added to cart`);
  }
  function updateQty(id, qty){
    let items = loadCart();
    const it = items.find(i=>i.id===id);
    if(!it) return;
    it.qty = Math.max(1, Number(qty||1));
    saveCart(items); updateCountBadge();
  }
  function removeItem(id){
    let items = loadCart().filter(i=>i.id!==id);
    saveCart(items); updateCountBadge();
  }
  function clearCart(){
    saveCart([]); updateCountBadge();
  }

  function formatUSD(n){ return `$${n.toFixed(2)}`; }

  function updateCountBadge(){
    const items = loadCart();
    const el = $('#cart-count');
    if(el) el.textContent = getCount(items);
  }

  function toast(msg){
    let t = document.createElement('div');
    t.className = 'cart-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300);}, 1800);
  }

  function bindAddToCart(){
    $$('.add-to-cart').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        addItem({
          id: btn.dataset.id,
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
          img: btn.dataset.img,
          qty: 1
        });
      });
    });
  }

  // CART PAGE RENDER
  function renderCartPage(){
    const wrap = $('#cart-page');
    if(!wrap) return;
    const items = loadCart();
    const empty = items.length===0;

    wrap.innerHTML = empty ? `
      <div class="cart-empty">
        <h1>Your cart is empty.</h1>
        <a class="btn-gold" href="/collection.html">Explore Collection</a>
      </div>
    ` : `
      <div class="cart-grid">
        <div class="cart-items">
          ${items.map(i=>`
            <article class="cart-item" data-id="${i.id}">
              <img src="${i.img}" alt="${i.name}">
              <div class="ci-meta">
                <h3>${i.name}</h3>
                <p class="ci-price">${formatUSD(i.price)}</p>
                <div class="ci-qty">
                  <label for="qty-${i.id}">Qty</label>
                  <input id="qty-${i.id}" type="number" min="1" value="${i.qty}">
                  <button class="ci-remove" aria-label="Remove ${i.name}">Remove</button>
                </div>
              </div>
              <div class="ci-line">${formatUSD(i.price * i.qty)}</div>
            </article>
          `).join('')}
        </div>
        <aside class="cart-summary">
          <h2>Order Summary</h2>
          <div class="row"><span>Subtotal</span><span id="sum-sub">${formatUSD(getSubtotal(items))}</span></div>
          <div class="row small"><span>Shipping</span><span>Calculated at checkout</span></div>
          <div class="row small"><span>Tax</span><span>Estimated at checkout</span></div>
          <div class="divider"></div>
          <div class="row total"><span>Total</span><span id="sum-total">${formatUSD(getSubtotal(items))}</span></div>
          <p id="free-ship" class="small"></p>
          <a class="btn-gold btn-checkout" href="#" id="checkout-btn" role="button">Checkout</a>
          <button class="btn-outline btn-clear" id="clear-cart">Clear Cart</button>
          <a class="link-under" href="/collection.html">Continue shopping</a>
        </aside>
      </div>
    `;

    if(empty) return;

    // Bind qty & remove & clear
    $$('.cart-item').forEach(row=>{
      const id = row.dataset.id;
      const qtyInput = $('#qty-'+id, row);
      qtyInput.addEventListener('change', ()=>{
        updateQty(id, qtyInput.value);
        renderCartPage();
        renderMiniCart();
      });
      $('.ci-remove', row).addEventListener('click', ()=>{
        removeItem(id);
        renderCartPage();
        renderMiniCart();
      });
    });

    $('#clear-cart').addEventListener('click', ()=>{ clearCart(); renderCartPage(); renderMiniCart(); });

    // Free shipping threshold logic example ($300)
    const sub = getSubtotal(loadCart());
    const target = 300;
    const fs = $('#free-ship');
    if(sub >= target){
      fs.textContent = 'You’ve unlocked free shipping.';
    } else {
      fs.textContent = `Free shipping over $${target}. You’re $${(target - sub).toFixed(2)} away.`;
    }

    // Checkout placeholder (integrate Stripe/Shopify later)
    $('#checkout-btn').addEventListener('click', (e)=>{
      e.preventDefault();
      alert('Checkout not connected yet. Exporting order to console for now.');
      console.log('Order:', loadCart(), 'Subtotal:', getSubtotal(loadCart()));
    });
  }

  function openDrawer(){
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if(!drawer || !overlay) return;
    drawer.classList.add('show');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
    const closeBtn = document.getElementById('close-cart');
    if(closeBtn) closeBtn.focus();
    renderMiniCart();
  }
  function closeDrawer(){
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if(!drawer || !overlay) return;
    const wasOpen = drawer.classList.contains('show');
    drawer.classList.remove('show');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
    if(wasOpen){
      const trigger = document.getElementById('open-cart');
      if(trigger) trigger.focus();
    }
  }
  function renderMiniCart(){
    const wrap = document.getElementById('mini-cart-items');
    const subEl = document.getElementById('mini-subtotal');
    if(!wrap || !subEl) return;
    const items = loadCart();
    if(items.length===0){
      wrap.innerHTML = `<p style="opacity:.9">Your cart is empty.</p>`;
      subEl.textContent = '$0.00';
      return;
    }
    wrap.innerHTML = items.map(i=>`
      <article class="mini-item" data-id="${i.id}">
        <img src="${i.img}" alt="${i.name}">
        <div class="mini-meta">
          <h4>${i.name}</h4>
          <div class="price">$${i.price.toFixed(2)}</div>
          <div class="mini-qty">
            <label for="mqty-${i.id}" class="sr-only">Quantity</label>
            <input id="mqty-${i.id}" type="number" min="1" value="${i.qty}">
            <button class="mini-remove" aria-label="Remove ${i.name}">Remove</button>
          </div>
        </div>
        <div class="mini-line">$${(i.price*i.qty).toFixed(2)}</div>
      </article>
    `).join('');
    subEl.textContent = '$' + getSubtotal(items).toFixed(2);

    $$('.mini-item').forEach(row=>{
      const id = row.dataset.id;
      const qty = row.querySelector('#mqty-'+id);
      const rm  = row.querySelector('.mini-remove');
      if(qty) qty.addEventListener('change', ()=>{ updateQty(id, qty.value); renderMiniCart(); renderCartPage(); });
      if(rm)  rm.addEventListener('click', ()=>{ removeItem(id); renderMiniCart(); renderCartPage(); });
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updateCountBadge();
    bindAddToCart();
    renderCartPage();

    on(document.getElementById('open-cart'), 'click', (e)=>{ e.preventDefault(); openDrawer(); });
    on(document.getElementById('close-cart'), 'click', ()=> closeDrawer());
    on(document.getElementById('cart-overlay'), 'click', ()=> closeDrawer());
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawer(); });
    on(document.getElementById('mini-clear'), 'click', ()=>{ clearCart(); renderMiniCart(); renderCartPage(); });
  });

})();
