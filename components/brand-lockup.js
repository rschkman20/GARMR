const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      --brand-lockup-icon-size: 40px;
      --brand-lockup-word-width: 120px;
      --brand-lockup-word-height: 28px;
      --brand-lockup-gap: 12px;
      display: inline-flex;
      align-items: center;
    }

    :host([data-variant="compact"]) {
      --brand-lockup-icon-size: 32px;
      --brand-lockup-word-width: 96px;
      --brand-lockup-word-height: 22px;
      --brand-lockup-gap: 8px;
    }

    :host([data-variant="tiny"]) {
      --brand-lockup-icon-size: 28px;
      --brand-lockup-word-width: 84px;
      --brand-lockup-word-height: 20px;
      --brand-lockup-gap: 6px;
    }

    figure {
      display: inline-flex;
      align-items: center;
      gap: var(--brand-lockup-gap);
      margin: 0;
    }

    .icon,
    .wordmark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 12px;
    }

    .icon {
      width: var(--brand-lockup-icon-size);
      height: var(--brand-lockup-icon-size);
      background: rgba(0, 0, 0, 0.6);
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }

    .icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .wordmark {
      width: var(--brand-lockup-word-width);
      height: var(--brand-lockup-word-height);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .wordmark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    @media (max-width: 520px) {
      :host(:not([data-force-wordmark])) .wordmark {
        display: none;
      }
    }
  </style>
  <figure>
    <div class="icon">
      <img src="images/Logo.png" width="40" height="40" fetchpriority="high" alt="GARMR wolf emblem">
    </div>
    <div class="wordmark">
      <img src="images/Brand Name.png" width="120" height="28" loading="lazy" decoding="async" alt="GARMR wordmark">
    </div>
  </figure>
`;

export class BrandLockup extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', 'GARMR brand');
  }
}

if (!customElements.get('brand-lockup')) {
  customElements.define('brand-lockup', BrandLockup);
}
