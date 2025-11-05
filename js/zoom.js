(function () {
  const DEFAULT_SCALE = 2;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateTransform(wrapper, image, event, scale) {
    const rect = wrapper.getBoundingClientRect();
    const pointX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pointY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const translateX = pointX * (scale - 1) * 100;
    const translateY = pointY * (scale - 1) * 100;

    image.style.transform = `translate(-${translateX}%, -${translateY}%) scale(${scale})`;
  }

  function normalizeEvent(event) {
    if (event.touches && event.touches[0]) {
      return event.touches[0];
    }

    if (event.changedTouches && event.changedTouches[0]) {
      return event.changedTouches[0];
    }

    return event;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const zoomables = document.querySelectorAll('.zoomable');

    zoomables.forEach((wrapper) => {
      const image = wrapper.querySelector('img');
      if (!image) {
        return;
      }

      const scale = parseFloat(wrapper.getAttribute('data-zoom-scale')) || DEFAULT_SCALE;
      let zoomed = false;

      const handleMove = (event) => {
        if (!zoomed) {
          return;
        }

        const point = normalizeEvent(event);
        updateTransform(wrapper, image, point, scale);
      };

      wrapper.addEventListener('click', (event) => {
        zoomed = !zoomed;
        wrapper.classList.toggle('is-zoomed', zoomed);

        if (zoomed) {
          const point = normalizeEvent(event);
          updateTransform(wrapper, image, point, scale);
        } else {
          image.style.transform = '';
        }
      });

      wrapper.addEventListener('pointermove', handleMove);
      wrapper.addEventListener('mousemove', handleMove);
      wrapper.addEventListener('touchmove', (event) => {
        handleMove(event);
        if (zoomed) {
          event.preventDefault();
        }
      }, { passive: false });

      wrapper.addEventListener('pointerleave', () => {
        if (!zoomed) {
          image.style.transform = '';
        }
      });

      wrapper.addEventListener('touchend', (event) => {
        if (!zoomed) {
          image.style.transform = '';
        }
      });
    });
  });
})();
