(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const { scenes, animateSwap } = window.MaritimeUI;

  if (document.body.dataset.page === 'products') {
    const views = {
      overview: {
        title: '远程健康支持工作台',
        summary: [['船端资料', '有序汇集'], ['协同流程', '清晰衔接'], ['服务记录', '持续维护']],
        rows: [
          ['船端健康信息', '汇集采集资料与必要的沟通信息', '信息概览'],
          ['远程协同事项', '查看待沟通事项与相应支持流程', '流程示意'],
          ['专业支持记录', '结合实际业务维护服务相关资料', '记录管理'],
        ],
      },
      records: {
        title: '让健康信息，有迹可循',
        summary: [['采集资料', '分类整理'], ['历史信息', '连贯查看'], ['查看权限', '按需配置']],
        rows: [
          ['日常采集资料', '按实际设备配置汇集相关健康信息', '采集记录'],
          ['资料时间线', '结合时间与服务事项查看信息脉络', '信息追溯'],
          ['专业沟通参考', '为后续评估与沟通提供必要参考', '资料关联'],
        ],
      },
      collaboration: {
        title: '让每一次支持，清晰衔接',
        summary: [['支持事项', '统一查看'], ['沟通流程', '有序跟进'], ['服务资料', '关联维护']],
        rows: [
          ['咨询与支持事项', '记录海上健康需求与相应协同事项', '事项记录'],
          ['沟通与处理流程', '按照既定服务方式衔接专业支持', '流程跟进'],
          ['后续服务资料', '结合实际业务维护沟通及服务信息', '服务关联'],
        ],
      },
    };
    const tabs = $$('[data-platform-tab]');
    const panel = $('#dashboard-panel');
    function selectView(key) {
      const view = views[key];
      if (!view) return;
      tabs.forEach(tab => {
        const selected = tab.dataset.platformTab === key;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', `platform-${key}`);
      $('#dashboard-title').textContent = view.title;
      $$('[data-summary-label]').forEach((label, i) => { label.textContent = view.summary[i][0]; });
      $$('[data-summary-value]').forEach((value, i) => { value.textContent = view.summary[i][1]; });
      $$('.dashboard-rows article').forEach((row, i) => {
        $('h4', row).textContent = view.rows[i][0];
        $('p', row).textContent = view.rows[i][1];
        $('small', row).textContent = view.rows[i][2];
      });
      animateSwap(panel);
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectView(tab.dataset.platformTab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = (i + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        selectView(tabs[next].dataset.platformTab);
        tabs[next].focus();
      });
    });
    const layout = matchMedia('(max-width: 760px)');
    const updateOrientation = () => $('.dashboard aside').setAttribute('aria-orientation', layout.matches ? 'horizontal' : 'vertical');
    layout.addEventListener('change', updateOrientation);
    updateOrientation();
  }

  if (document.body.dataset.page === 'solutions') {
    const links = $$('[data-scene-link]');
    let currentScene;
    function showScene(key, animate = true) {
      key = Object.hasOwn(scenes, key) ? key : 'merchant';
      if (key === currentScene) return;
      currentScene = key;
      const data = scenes[key];
      document.body.dataset.scene = key;
      document.title = `${data.name}解决方案 · 诺亚方舟海上远程医疗`;
      $('#scene-kicker').textContent = data.english;
      $('#scene-title-line1').textContent = data.hero[0];
      $('#scene-title-line2').textContent = data.hero[1];
      $('#scene-description').textContent = data.description;
      const image = $('#scene-image');
      image.src = `assets/generated/${data.image}.webp`;
      image.alt = `${data.name}概念场景`;
      links.forEach(link => {
        if (link.dataset.sceneLink === key) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      $$('[data-challenge]').forEach((card, i) => {
        $('h3', card).textContent = data.challenges[i][0];
        $('p', card).textContent = data.challenges[i][1];
      });
      $('#scene-story-title').textContent = data.story;
      $$('[data-scene-contact]').forEach(button => { button.dataset.contact = key; });
      if (animate) {
        animateSwap($('#scene-hero-copy'));
        image.decode().then(() => { if (currentScene === key) animateSwap(image); }).catch(() => {});
      }
    }
    links.forEach(link => link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (currentScene === link.dataset.sceneLink) return;
      history.pushState(null, '', link.href);
      showScene(link.dataset.sceneLink);
    }));
    const syncLocation = () => showScene(new URL(location.href).searchParams.get('scene'), false);
    addEventListener('popstate', syncLocation);
    syncLocation();
  }
})();
