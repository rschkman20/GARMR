const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .media-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1fr);
    }

    .frame {
      position: relative;
      aspect-ratio: 4 / 5;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 28px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.1);
      background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.85));
      transform: translateY(18px);
      opacity: 0;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .frame.revealed {
      transform: translateY(0);
      opacity: 1;
    }

    .frame::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    .frame picture,
    .frame img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .frame img {
      object-fit: cover;
      filter: saturate(1.05) contrast(1.05);
    }

    @media (min-width: 768px) {
      .media-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: end;
        gap: 24px;
      }

      .frame {
        margin-bottom: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .frame {
        transition: none;
        transform: none;
        opacity: 1;
      }
    }
  </style>
  <div class="media-grid">
    <figure class="frame" data-index="0">
      <picture>
        <source class="source-webp" type="image/webp" />
        <img class="model-image" width="800" height="1000" loading="lazy" decoding="async" fetchpriority="high" alt="Male model wearing black GARMR tee with gold wolf crest" src="images/Model 1 rev 1.png" />
      </picture>
    </figure>
    <figure class="frame" data-index="1">
      <picture>
        <source class="source-webp" type="image/webp" />
        <img class="model-image" width="800" height="1000" loading="lazy" decoding="async" alt="Female model wearing black GARMR tee with gold wolf crest" src="images/Model 2 rev 2.png" />
      </picture>
    </figure>
  </div>
`;

const MODEL_CONFIG = [
  {
    png: 'images/Model 1 rev 1.png',
    alt: 'Male model wearing black GARMR tee with gold wolf crest',
    priority: true
  },
  {
    png: 'images/Model 2 rev 2.png',
    alt: 'Female model wearing black GARMR tee with gold wolf crest',
    priority: false
  }
];

const WIDTH_STEPS = [640, 960, 1024];

export class HeroMedia extends HTMLElement {
  constructor() {
    super();
    this._prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this._upgradeImages();
    this._reveal();
  }

  _upgradeImages() {
    const frames = Array.from(this.shadowRoot.querySelectorAll('.frame'));
    frames.forEach((frame, index) => {
      const config = MODEL_CONFIG[index];
      if (!config) return;
      const img = frame.querySelector('img');
      const source = frame.querySelector('.source-webp');
      img.setAttribute('alt', config.alt);
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('sizes', '(min-width: 768px) 50vw, 100vw');
      if (config.priority) {
        img.setAttribute('fetchpriority', 'high');
      }
      img.setAttribute('src', config.png);
      img.setAttribute('width', '800');
      img.setAttribute('height', '1000');
      img.setAttribute('srcset', WIDTH_STEPS.map((step) => `${config.png} ${step}w`).join(', '));
      this._generateWebp(config.png).then((webpUrl) => {
        if (webpUrl) {
          source.setAttribute('srcset', webpUrl);
        }
      });
    });
  }

  async _generateWebp(src) {
    if (!HTMLCanvasElement.prototype.toDataURL) {
      return null;
    }
    try {
      const img = await this._loadImage(src);
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / img.naturalWidth || 1);
      const width = Math.round((img.naturalWidth || 1) * scale);
      const height = Math.round((img.naturalHeight || 1) * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/webp', 0.9);
      return dataUrl.startsWith('data:image/webp') ? dataUrl : null;
    } catch (error) {
      console.warn('Failed to generate WebP for', src, error);
      return null;
    }
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  _reveal() {
    if (this._prefersReducedMotion) {
      this.shadowRoot.querySelectorAll('.frame').forEach((frame) => frame.classList.add('revealed'));
      return;
    }

    requestAnimationFrame(() => {
      this.shadowRoot.querySelectorAll('.frame').forEach((frame, index) => {
        setTimeout(() => frame.classList.add('revealed'), index * 120);
      });
    });
  }
}

if (!customElements.get('hero-media')) {
  customElements.define('hero-media', HeroMedia);
}
