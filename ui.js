(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const swaps = new WeakMap();
  function animateSwap(element) {
    if (!element || motion.matches || !element.animate) return;
    swaps.get(element)?.cancel();
    swaps.set(element, element.animate([
      { opacity: .15, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 440, easing: 'cubic-bezier(.22,1,.36,1)' }));
  }
  const scenes = {
    merchant: {
      name: '远洋商船', english: 'MERCHANT VESSELS', image: 'hero-desktop-start',
      title: '让专业支持，与船队同行。', hero: ['每一次远航，', '都有专业相伴。'],
      description: '面向长期航行与远洋作业场景，结合船队规模、航线及网络条件，配置船端采集设备与远程医疗支持通道。',
      focus: ['长期航行的健康需求', '船端空间与设备配置', '远程通信与服务衔接'],
      challenges: [
        ['航程长，需求持续', '在长期海上作业中，日常咨询、健康信息采集与专业支持需要形成连贯的服务路径。'],
        ['船端空间各有不同', '结合现有医务空间与设备条件，确认适合的采集项目、工作站配置及操作流程。'],
        ['连接条件需要适配', '综合航线与网络条件，明确资料传输方式、沟通通道及服务边界。'],
      ],
      story: '从船端的一次采集，连接陆地的一份专业。',
    },
    cruise: {
      name: '邮轮客运', english: 'CRUISE VESSELS', image: 'cruise-scenario',
      title: '为每一段海上旅程，连接健康关怀。', hero: ['让海上旅程，', '多一份健康关怀。'],
      description: '面向邮轮客运场景，结合航程、人员规模和船端医疗配置，连接日常健康咨询与远程专业支持。具体服务范围以正式方案为准。',
      focus: ['多样的船上健康需求', '现有医疗资源协同', '航程与服务通道适配'],
      challenges: [
        ['健康需求更加多样', '围绕不同人员的日常健康需求，建立清晰的咨询入口与资料采集路径。'],
        ['衔接船上医疗资源', '结合邮轮现有医务配置，为船端医疗人员与陆地专业资源提供协同支持。'],
        ['服务匹配实际航程', '依据航程、人员规模及网络情况，明确支持方式与沟通流程。'],
      ],
      story: '让每一份海上健康需求，都有清晰的支持路径。',
    },
    offshore: {
      name: '海上作业平台', english: 'OFFSHORE OPERATIONS', image: 'offshore-scenario',
      title: '让健康关怀，抵达作业一线。', hero: ['远离海岸，', '依然心有所依。'],
      description: '面向海上平台等作业环境，结合人员规模、空间条件与通信方式，探索日常健康支持与远程协同方案。',
      focus: ['驻场人员健康支持', '作业空间与设备部署', '专业支持与后续衔接'],
      challenges: [
        ['驻场工作的健康关怀', '围绕海上驻场人员的日常需求，配置健康信息采集与专业咨询路径。'],
        ['适应实际作业环境', '结合平台空间、操作人员与设备条件，确定部署位置和使用流程。'],
        ['保持支持路径清晰', '连接既定专业服务通道，并明确必要时与线下医疗资源的衔接方式。'],
      ],
      story: '让作业一线的每一份需求，连接专业支持。',
    },
  };

  const menu = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    if (!menu || !mobileNav) return;
    mobileNav.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '打开导航');
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    mobileNav.hidden = open;
    menu.setAttribute('aria-expanded', String(!open));
    menu.setAttribute('aria-label', open ? '打开导航' : '关闭导航');
    if (!open) animateSwap(mobileNav);
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const dialogs = $$('dialog');
  const openers = new WeakMap();
  function openDialog(dialog, trigger = document.activeElement) {
    const source = trigger?.closest('dialog');
    openers.set(dialog, source ? openers.get(source) : trigger);
    dialogs.forEach(other => { if (other.open) other.close(); });
    dialog.getAnimations().forEach(animation => animation.cancel());
    closeMenu();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dialog-open');
    $('[data-dialog-focus]', dialog)?.focus({ preventScroll: true });
    if (!motion.matches) dialog.animate([
      { opacity: 0, transform: 'translateY(22px) scale(.985)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: 330, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function closeDialog(dialog) {
    if (!dialog.open || dialog.dataset.closing) return;
    if (motion.matches) { dialog.close(); return; }
    dialog.dataset.closing = 'true';
    const animation = dialog.animate([
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(12px) scale(.99)' },
    ], { duration: 160, easing: 'ease-in', fill: 'forwards' });
    animation.finished.then(() => { if (dialog.open) dialog.close(); }).catch(() => {});
  }
  dialogs.forEach(dialog => {
    let backdropStart = false;
    $$('[data-close]', dialog).forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('pointerdown', event => {
      const rect = dialog.getBoundingClientRect();
      backdropStart = event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    });
    dialog.addEventListener('click', event => {
      if (backdropStart && event.target === dialog) closeDialog(dialog);
      backdropStart = false;
    });
    dialog.addEventListener('close', () => {
      delete dialog.dataset.closing;
      queueMicrotask(() => {
        if (dialogs.some(item => item.open)) return;
        document.body.classList.remove('dialog-open');
        const opener = openers.get(dialog);
        if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
      });
    });
  });

  const form = $('#contact-form');
  const contact = $('#contact-dialog');
  const contactImage = $('.contact-aside > img', contact);
  let contactImageRequest = 0;
  let formStep = 0;
  function updateContactImage(key, animate = false) {
    const src = `assets/generated/${(scenes[key] || scenes.merchant).image}.webp`;
    const request = ++contactImageRequest;
    contactImage.getAnimations().forEach(animation => animation.cancel());
    if (contactImage.getAttribute('src') === src) return;
    if (!animate) { contactImage.src = src; return; }
    const image = new Image();
    image.src = src;
    image.decode().then(() => {
      if (request !== contactImageRequest || !contact.open) return;
      contactImage.src = src;
      if (!motion.matches) contactImage.animate([
        { opacity: 0 },
        { opacity: getComputedStyle(contactImage).opacity },
      ], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
    }).catch(() => {});
  }
  function selectFormStep(step, focus = false) {
    formStep = step;
    $$('[data-form-step]', form).forEach((fieldset, i) => { fieldset.hidden = i !== step; fieldset.disabled = i !== step; });
    $$('[data-form-progress]', contact).forEach((item, i) => {
      item.classList.toggle('active', i === step);
      item.setAttribute('aria-current', i === step ? 'step' : 'false');
    });
    contact.scrollTop = 0;
    animateSwap($(`[data-form-step="${step}"]`, form));
    if (focus) $('input', $(`[data-form-step="${step}"]`, form))?.focus({ preventScroll: true });
  }
  function resetForm() {
    form.reset();
    $$('input', form).forEach(input => input.setCustomValidity(''));
  }
  $$('[data-contact]').forEach(button => button.addEventListener('click', () => {
    resetForm();
    form.hidden = false;
    $('#form-success').hidden = true;
    $('.form-progress', contact).hidden = false;
    const key = button.dataset.contact || document.body.dataset.scene || 'merchant';
    $(`input[name="scene"][value="${scenes[key] ? key : 'merchant'}"]`, form).checked = true;
    updateContactImage(key);
    selectFormStep(0);
    openDialog(contact, button);
  }));
  $$('input[name="scene"]', form).forEach(input => input.addEventListener('change', () => {
    if (input.checked) updateContactImage(input.value, true);
  }));
  $('#form-next')?.addEventListener('click', () => selectFormStep(1, true));
  $('#form-back')?.addEventListener('click', () => selectFormStep(0));
  $$('input', form).forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (formStep !== 1) { selectFormStep(1, true); return; }
    $$('.contact-fields input', form).forEach(input => input.setCustomValidity(input.value.trim() ? '' : '请填写此项内容。'));
    if (!form.reportValidity()) return;
    resetForm();
    form.hidden = true;
    $('.form-progress', contact).hidden = true;
    $('#form-success').hidden = false;
    contact.scrollTop = 0;
    $('#form-success h3').focus({ preventScroll: true });
    animateSwap($('#form-success'));
  });
  contact?.addEventListener('close', () => {
    ++contactImageRequest;
    contactImage.getAnimations().forEach(animation => animation.cancel());
    resetForm();
  });

  const scenario = $('#scenario-dialog');
  $$('[data-scenario]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.scenario;
    const data = scenes[key];
    if (!data) return;
    $('#scenario-kicker').textContent = data.english;
    const clauses = data.title.split('，');
    $('#scenario-title').replaceChildren(...clauses.map((clause, i) => {
      const line = document.createElement('span');
      line.textContent = clause + (i < clauses.length - 1 ? '，' : '');
      return line;
    }));
    $('#scenario-description').textContent = data.description;
    $('#scenario-image').src = `assets/generated/${data.image}.webp`;
    $('#scenario-image').alt = `${data.name}概念场景`;
    $('#scenario-page-link').href = `solutions.html?scene=${key}`;
    $('[data-contact]', scenario).dataset.contact = key;
    $$('.scenario-detail-points span', scenario).forEach((item, i) => { item.textContent = data.focus[i]; });
    openDialog(scenario, button);
  }));

  const tour = $('#tour-dialog');
  const tourData = [
    ['01 / ONBOARD', '从海上需求开始', '面向船舶与海上作业场景，建立健康信息与专业支持之间的连接。', 'hero-desktop-start', ['海上健康需求', '适配实际场景']],
    ['02 / COLLECTION', '让健康信息被看见', '结合实际设备配置，在船端汇集健康信息，为后续专业评估提供参考。', 'onboard-care', ['船端健康采集', '有序记录信息']],
    ['03 / CONNECTION', '让信息连接专业资源', '通过适配的通信方式，组织采集资料与沟通记录，使专业协同更加清晰。', 'medical-workstation-detail', ['远程系统协同', '适配通信条件']],
    ['04 / EXPERT SUPPORT', '让专业支持抵达远海', '陆地专业资源结合采集信息与沟通内容，提供相应支持。服务范围以正式接入方案为准。', 'shore-specialist', ['专业医疗支持', '持续健康关怀']],
  ];
  let tourStep = 0;
  let tourTimer = null;
  function selectTourStep(index) {
    tourStep = index;
    const [label, title, description, image, tags] = tourData[index];
    $('#tour-step-label').textContent = label;
    $('#tour-step-title').textContent = title;
    $('#tour-step-description').textContent = description;
    $('#tour-image').src = `assets/generated/${image}.webp`;
    $('#tour-image').alt = `${title}的概念场景`;
    $('#tour-image').decode().then(() => { if (tourStep === index && tour.open) animateSwap($('#tour-image')); }).catch(() => {});
    $$('.tour-tags span').forEach((item, i) => { item.textContent = tags[i]; });
    $$('[data-tour-step]').forEach((button, i) => {
      button.classList.toggle('active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    $('#tour-prev').disabled = index === 0;
    $('#tour-next').disabled = index === 3;
    $('#tour-count').textContent = `0${index + 1} / 04`;
    animateSwap($('.tour-scene-content'));
  }
  function stopTour() {
    clearInterval(tourTimer); tourTimer = null;
    $('#tour-play').textContent = '自动播放 ▷';
    $('#tour-play').setAttribute('aria-pressed', 'false');
  }
  $$('[data-tour]').forEach(button => button.addEventListener('click', () => { stopTour(); selectTourStep(0); openDialog(tour, button); }));
  $$('[data-tour-step]').forEach(button => button.addEventListener('click', () => { stopTour(); selectTourStep(Number(button.dataset.tourStep)); }));
  $('#tour-prev')?.addEventListener('click', () => { stopTour(); selectTourStep(Math.max(0, tourStep - 1)); });
  $('#tour-next')?.addEventListener('click', () => { stopTour(); selectTourStep(Math.min(3, tourStep + 1)); });
  $('#tour-play')?.addEventListener('click', () => {
    if (tourTimer) { stopTour(); return; }
    if (tourStep === 3) selectTourStep(0);
    $('#tour-play').textContent = '暂停播放 Ⅱ';
    $('#tour-play').setAttribute('aria-pressed', 'true');
    tourTimer = setInterval(() => { selectTourStep(tourStep + 1); if (tourStep === 3) stopTour(); }, 3500);
  });
  tour?.addEventListener('close', stopTour);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTour(); });
  motion.addEventListener('change', () => { if (motion.matches) stopTour(); });

  const lightbox = $('#lightbox-dialog');
  const deviceViews = [
    ['medical-workstation', '医疗工作站 · 整体外观'],
    ['medical-workstation-detail', '医疗工作站 · 采集细节'],
  ];
  let lightboxIndex = 0;
  function selectLightbox(index) {
    lightboxIndex = (index + deviceViews.length) % deviceViews.length;
    const [image, title] = deviceViews[lightboxIndex];
    $('#lightbox-image').src = `assets/generated/${image}.webp`;
    $('#lightbox-image').alt = title;
    $('#lightbox-title').textContent = title;
    $('#lightbox-count').textContent = `0${lightboxIndex + 1} / 02`;
    animateSwap($('#lightbox-image'));
  }
  $$('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const current = $('#workstation-image')?.getAttribute('src') || '';
    selectLightbox(button.dataset.zoom === 'detail' || (!button.dataset.zoom && current.includes('detail')) ? 1 : 0);
    openDialog(lightbox, button);
  }));
  $('#lightbox-prev')?.addEventListener('click', () => selectLightbox(lightboxIndex - 1));
  $('#lightbox-next')?.addEventListener('click', () => selectLightbox(lightboxIndex + 1));
  lightbox?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); selectLightbox(lightboxIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  const header = $('.site-header');
  const quickActions = $('.quick-actions');
  const chapterNav = $('.inner-nav');
  const navigationSections = $$('main section[id]');
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    const height = document.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle('is-scrolled', scrollY > 20);
    header?.style.setProperty('--reading-progress', String(height > 0 ? scrollY / height : 0));
    quickActions?.classList.toggle('is-visible', scrollY > 600);
    if (quickActions) quickActions.inert = scrollY <= 600;
    const threshold = (header?.offsetHeight || 0) + (chapterNav?.offsetHeight || 0) + 50;
    let current = chapterNav ? navigationSections[0]?.id : null;
    navigationSections.forEach(section => { if (section.getBoundingClientRect().top <= threshold) current = section.id; });
    $$('.inner-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${current}`));
    if (document.body.dataset.page === 'home') $$('.desktop-nav a').forEach(link => link.classList.toggle('active', link.dataset.section === current));
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  if ('IntersectionObserver' in window) {
    if (!motion.matches) document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .07 });
    $$('.reveal').forEach(element => observer.observe(element));
    $$('.deployment-grid, .challenge-grid, .module-grid').forEach(grid => {
      [...grid.children].forEach((child, i) => {
        child.classList.add('reveal'); child.style.transitionDelay = `${i * 65}ms`; observer.observe(child);
      });
    });
  }
  window.MaritimeUI = Object.freeze({ scenes, animateSwap });
})();
