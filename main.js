import './components/brand-lockup.js';
import './components/hero-media.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const goldGlow = document.querySelector('.hero-bg.gold-glow');
  let frameId;

  const reset = () => {
    if (goldGlow) {
      goldGlow.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  const handlePointerMove = (event) => {
    if (!goldGlow) return;
    const { innerWidth, innerHeight } = window;
    const xRatio = (event.clientX / innerWidth) - 0.5;
    const yRatio = (event.clientY / innerHeight) - 0.5;
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      const translateX = Math.max(Math.min(xRatio * 18, 16), -16);
      const translateY = Math.max(Math.min(yRatio * 14, 12), -12);
      goldGlow.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
  };

  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerleave', reset);
}
