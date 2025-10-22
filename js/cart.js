(function(){
  const KEY = 'garmr_cart';
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];

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
      });
      $('.ci-remove', row).addEventListener('click', ()=>{
        removeItem(id);
        renderCartPage();
      });
    });

    $('#clear-cart').addEventListener('click', ()=>{ clearCart(); renderCartPage(); });

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

  document.addEventListener('DOMContentLoaded', ()=>{
    updateCountBadge();
    bindAddToCart();
    renderCartPage();
  });

})();
