(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const nodeData = [
    { kicker: '01 / ONBOARD', icon: 'ship', title: '每一次连接，<br>都从海上需求开始。', description: '面向船舶与海上作业场景，让健康信息与专业支持之间，建立更清晰的连接。', tags: ['船舶场景', '健康需求'], tour: '从海上需求开始' },
    { kicker: '02 / COLLECTION', icon: 'device', title: '在船端，<br>看见健康信息。', description: '由船端采集工作站汇集健康信息，为后续专业评估提供参考。具体采集项目以实际设备配置为准。', tags: ['多维健康信息', '船端设备'], tour: '让健康信息被看见' },
    { kicker: '03 / CONNECTION', icon: 'network', title: '跨越海洋，<br>连接专业资源。', description: '通过适配的通信方式连接远程医疗系统，使信息与支持流程有序衔接。实际服务受网络与部署条件影响。', tags: ['信息传输', '系统协同'], tour: '让信息连接专业资源' },
    { kicker: '04 / EXPERT SUPPORT', icon: 'doctor', title: '让专业支持，<br>抵达需求所在。', description: '陆地专业医疗资源结合沟通内容与采集信息，提供相应支持。服务范围与响应方式以正式接入方案为准。', tags: ['专业医疗支持', '持续健康服务'], tour: '让专业支持抵达远海' },
  ];
  let currentNode = 0;
  function selectNode(index) {
    currentNode = index;
    const data = nodeData[index];
    $$('[data-node]').forEach((button, i) => {
      button.classList.toggle('active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    $('#node-kicker').textContent = data.kicker;
    $('#node-title').innerHTML = data.title;
    $('#node-description').textContent = data.description;
    $('#detail-icon use').setAttribute('href', `#i-${data.icon}`);
    $('#node-tags').replaceChildren(...data.tags.map(text => {
      const span = document.createElement('span'); span.textContent = text; return span;
    }));
    $('#node-page').textContent = String(index + 1).padStart(2, '0');
    $('.detail-track i').style.width = `${(index + 1) * 25}%`;
    window.MaritimeUI?.animateSwap($('.network-detail'));
  }
  $$('[data-node]').forEach(button => button.addEventListener('click', () => selectNode(Number(button.dataset.node))));
  $('#next-node').addEventListener('click', () => selectNode((currentNode + 1) % 4));

  const products = {
    device: { number: '01 / HARDWARE', title: '从船端，<br>看见每一份健康信息。', description: '面向海上环境的健康采集工作站，将多维健康信息汇集起来，为后续专业支持提供参考。', features: [ ['多维信息采集', '血压、心电等指标支持以实际设备为准'], ['面向船端场景', '结合空间、网络及部署条件配置'], ['连接医疗支持', '与远程系统形成完整协同链路'] ] },
    platform: { number: '02 / SOFTWARE', title: '以系统，<br>串起每一环专业协同。', description: '将采集信息、沟通记录与服务流程有序组织，让船端需求与陆地医疗支持之间的协同更加清晰。', features: [ ['健康信息汇集', '在统一工作台查看相关健康信息'], ['远程服务协同', '连接船端沟通与专业支持流程'], ['服务信息管理', '结合实际业务维护相应服务记录'] ] },
  };
  function selectProduct(key) {
    const data = products[key];
    $$('[data-product]').forEach(button => {
      const selected = button.dataset.product === key;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      $(`#${button.dataset.product}-panel`).hidden = !selected;
    });
    $('#product-number').textContent = data.number;
    $('#product-title').innerHTML = data.title;
    $('#product-description').textContent = data.description;
    $('#product-features').replaceChildren(...data.features.map(([title, description], i) => {
      const row = document.createElement('div');
      const number = document.createElement('span'); number.textContent = `0${i + 1}`;
      const heading = document.createElement('b'); heading.textContent = title;
      const detail = document.createElement('small'); detail.textContent = description;
      row.append(number, heading, detail); return row;
    }));
    window.MaritimeUI?.animateSwap($('.product-info'));
    window.MaritimeUI?.animateSwap($(`#${key}-panel`));
  }
  const productTabs = $$('[data-product]');
  productTabs.forEach((button, i) => {
    button.addEventListener('click', () => selectProduct(button.dataset.product));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = (i + 1) % productTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 1;
      selectProduct(productTabs[next].dataset.product); productTabs[next].focus();
    });
  });

  $$('[data-device-view]').forEach(button => button.addEventListener('click', () => {
    const image = $('#workstation-image');
    image.src = `assets/generated/${button.dataset.deviceView}.webp`;
    image.alt = button.dataset.deviceView.endsWith('detail')
      ? '船端医疗工作站采集附件与工作台细节概念图'
      : '船端医疗工作站整体外观概念图';
    image.decode().then(() => window.MaritimeUI?.animateSwap(image)).catch(() => {});
    $$('[data-device-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));

})();
