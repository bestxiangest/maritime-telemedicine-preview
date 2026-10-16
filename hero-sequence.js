(() => {
  'use strict';
  const section = document.querySelector('[data-hero-film]');
  const canvas = section?.querySelector('canvas');
  const context = canvas?.getContext('2d', { alpha: false });
  if (!section || !context || !window.fetch) return;

  const stage = section.querySelector('.hero');
  const intro = section.querySelector('.hero-content');
  const outro = section.querySelector('.hero-film-message');
  const outroLink = outro.querySelector('a');
  const desktop = matchMedia('(min-width: 961px) and (min-height: 650px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const clamp = value => Math.min(1, Math.max(0, value));
  let session = null;

  function release(bitmap) {
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
  }

  async function decode(blob) {
    if (window.createImageBitmap) return createImageBitmap(blob);
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function reset() {
    if (!session) return;
    const run = session;
    session = null;
    run.controller.abort();
    cancelAnimationFrame(run.raf);
    window.removeEventListener('scroll', run.schedule);
    window.removeEventListener('resize', run.resize);
    run.cache.forEach(release);
    run.cache.clear();
    run.blobs.clear();
    section.classList.remove('is-scroll-active', 'is-ready');
    section.removeAttribute('style');
    section.dataset.state = 'static';
    delete section.dataset.frame;
    delete section.dataset.target;
    intro.inert = false;
    outro.setAttribute('aria-hidden', 'true');
    outroLink.tabIndex = -1;
    canvas.width = canvas.height = 0;
  }

  async function start() {
    if (session || !desktop.matches || reduced.matches || connection?.saveData) return;
    const run = {
      controller: new AbortController(), cache: new Map(), blobs: new Map(),
      requests: new Map(), failed: new Set(), pending: new Set(),
      target: 0, painted: -1, workers: 0, rendering: false,
      visible: true, forceDraw: true, raf: 0,
    };
    session = run;
    const alive = () => session === run;

    try {
      const response = await fetch('assets/hero-sequence/manifest.json', { signal: run.controller.signal });
      if (!response.ok) throw new Error('Sequence unavailable');
      const manifest = await response.json();
      if (!alive()) return;
      if (!Number.isInteger(manifest.count) || manifest.count < 2 || !manifest.prefix) throw new Error('Invalid sequence');
      for (let i = 0; i < manifest.count; i++) run.pending.add(i);

      function fetchBlob(index) {
        if (run.blobs.has(index)) return Promise.resolve(run.blobs.get(index));
        if (run.requests.has(index)) return run.requests.get(index);
        run.pending.delete(index);
        const url = `${manifest.prefix}${String(index).padStart(manifest.digits, '0')}${manifest.extension}`;
        const request = fetch(url, { signal: run.controller.signal }).then(response => {
          if (!response.ok) throw new Error('Frame unavailable');
          return response.blob();
        }).then(blob => {
          if (alive()) run.blobs.set(index, blob);
          return blob;
        }).catch(error => {
          run.failed.add(index);
          throw error;
        }).finally(() => run.requests.delete(index));
        run.requests.set(index, request);
        return request;
      }

      function prefetch() {
        if (!alive() || !run.visible) return;
        while (run.workers < 4 && run.pending.size) {
          let closest = -1;
          let distance = Infinity;
          for (const index of run.pending) {
            if (Math.abs(index - run.target) < distance) {
              closest = index;
              distance = Math.abs(index - run.target);
            }
          }
          run.workers++;
          fetchBlob(closest).catch(() => {}).finally(() => {
            run.workers--;
            if (alive()) prefetch();
          });
        }
      }

      async function loadFrame(index) {
        if (run.cache.has(index)) {
          const bitmap = run.cache.get(index);
          run.cache.delete(index);
          run.cache.set(index, bitmap);
          return bitmap;
        }
        const blob = await fetchBlob(index);
        if (!alive()) return null;
        const bitmap = await decode(blob);
        if (!alive()) { release(bitmap); return null; }
        run.cache.set(index, bitmap);
        // Keep compressed blobs for seeking, but bound decoded image memory.
        while (run.cache.size > 18) {
          const key = run.cache.keys().next().value;
          release(run.cache.get(key));
          run.cache.delete(key);
        }
        return bitmap;
      }

      function paint(bitmap, index) {
        const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
        const width = bitmap.width * scale;
        const height = bitmap.height * scale;
        context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        run.painted = index;
        run.forceDraw = false;
        section.dataset.frame = String(index);
        section.classList.add('is-ready');
      }

      async function render() {
        if (run.rendering || !run.visible || run.failed.has(run.target)) return;
        if (run.target === run.painted && !run.forceDraw) return;
        const index = run.target;
        run.rendering = true;
        try {
          const bitmap = await loadFrame(index);
          if (alive() && run.visible && bitmap && index === run.target) paint(bitmap, index);
        } catch (_) {
          // Keep the last valid frame. The poster is present underneath the canvas.
        } finally {
          run.rendering = false;
          if (alive() && run.visible && index !== run.target) run.schedule();
        }
      }

      function update() {
        run.raf = 0;
        if (!alive()) return;
        const rect = section.getBoundingClientRect();
        const header = document.querySelector('.site-header').offsetHeight;
        const travel = section.offsetHeight - stage.offsetHeight;
        const progress = clamp((header - rect.top) / Math.max(1, travel));
        run.visible = rect.bottom > header && rect.top < innerHeight;
        run.target = Math.round(progress * (manifest.count - 1));
        section.dataset.target = String(run.target);
        section.style.setProperty('--film-progress', progress.toFixed(4));
        section.style.setProperty('--intro-opacity', (1 - clamp((progress - .16) / .3)).toFixed(4));
        section.style.setProperty('--intro-shift', `${-clamp(progress / .48) * 34}px`);
        section.style.setProperty('--outro-opacity', clamp((progress - .49) / .25).toFixed(4));
        section.style.setProperty('--outro-shift', `${(1 - clamp((progress - .49) / .25)) * 24}px`);
        intro.inert = progress > .46;
        const showOutro = progress > .6;
        outro.setAttribute('aria-hidden', String(!showOutro));
        outroLink.tabIndex = showOutro ? 0 : -1;
        if (!run.visible) {
          run.cache.forEach(release);
          run.cache.clear();
          return;
        }
        render();
        prefetch();
      }

      run.schedule = () => {
        if (alive() && !run.raf) run.raf = requestAnimationFrame(update);
      };
      run.resize = () => {
        if (!alive()) return;
        section.style.setProperty('--film-travel', `${Math.round(innerHeight * 2.25)}px`);
        const rect = stage.getBoundingClientRect();
        const ratio = Math.min(devicePixelRatio || 1, 1.25, 1600 / rect.width);
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
        run.forceDraw = true;
        section.classList.remove('is-ready');
        run.schedule();
      };

      await loadFrame(0);
      if (!alive()) return;
      section.classList.add('is-scroll-active');
      section.dataset.state = 'ready';
      run.resize();
      window.addEventListener('scroll', run.schedule, { passive: true });
      window.addEventListener('resize', run.resize, { passive: true });
    } catch (_) {
      if (alive()) reset();
    }
  }

  function sync() {
    if (desktop.matches && !reduced.matches && !connection?.saveData) start();
    else reset();
  }
  desktop.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  connection?.addEventListener('change', sync);
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', sync);
  section.dataset.state = 'static';
  sync();
})();
