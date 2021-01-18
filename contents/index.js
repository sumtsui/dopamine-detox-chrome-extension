(async function () {
  const DEFAULT_MSG = 'If you can be your best version today, why wait for tomorrow.';
  function checkUserTempDisable() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('isTempDisable', (data) => {
        const { isTempDisable } = data;
        resolve(isTempDisable);
      });
    });
  }
  function createInspirationWrap() {
    const inspirationWrap = document.createElement('div');
    inspirationWrap.style.cssText = `
      position: fixed;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 400px;
      height: 300px;
      font-family: BlinkMacSystemFont,Helvetica Neue,Helvetica,Arial,PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif;
      background: yellowgreen;
      top: 10px;
      right: 30px;
      border-radius: 5px;
      z-index: 100000;
      box-shadow: 2px 2px 10px 5px rgba(0, 0, 0, 0.2);
      border: 1px solid white;
      padding: 1em;
    `;
    inspirationWrap.classList.add('delayed-gratification-wrap');

    const textEl = document.createElement('h1');
    textEl.classList.add('delayed-gratification-msg-text');
    textEl.style.cssText = `
      color: #fff;
      font-size: 24px;
      text-align: center;
    `;
    chrome.storage.sync.get('userMsg', (data) => {
      const { userMsg } = data;
      if (!userMsg) textEl.innerText = DEFAULT_MSG;
      else textEl.innerText = userMsg;
    });
    inspirationWrap.appendChild(textEl);
    bodyEl.appendChild(inspirationWrap);
  }

  const bodyEl = document.querySelector('body');
  const inspirationWrap = document.querySelector('.delayed-gratification-wrap');

  if (!inspirationWrap && !(await checkUserTempDisable())) {
    createInspirationWrap();
    return;
  }
})();
