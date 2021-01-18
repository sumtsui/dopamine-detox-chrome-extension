const enableBtn = document.getElementById('enableBtn');
const enableSection = document.getElementById('enableSection');
const settingIcon = document.getElementById('settingIcon');
const settingSection = document.getElementById('settingSection');
const notificationSection = document.getElementById('notification');
const badUrls = document.getElementById('badUrls');
const settingBtn = document.getElementById('toSetting');
const notificationP = notificationSection.querySelector('p');

function getValueFromStore(field) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(field, (data) => {
      resolve(data[field]);
    });
  });
}

function showNotification(msg) {
  notificationSection.style.display = 'block';
  notificationP.innerText = msg;
}

async function start() {
  const urls = await getValueFromStore('urls');
  const disabledTime = await getValueFromStore('disabledTime');

  const twelveHourInMilli = 1000 * 60 * 60 * 12;
  const now = new Date().getTime();
  const withinDisabledPeriod = disabledTime + twelveHourInMilli > now;

  if (urls.length === 0) {
    settingSection.classList.remove('hide');
    return;
  } else if (urls.length > 0 && !withinDisabledPeriod) {
    badUrls.classList.remove('hide');
    const listEl = document.createElement('ol');
    badUrls.appendChild(listEl);
    urls.forEach((url) => {
      const li = document.createElement('li');
      listEl.appendChild(li).innerText = url;
    });
  } else if (withinDisabledPeriod) {
    enableSection.classList.remove('hide');
  }
}

start();

// applyBtn.addEventListener('click', () => {
//   console.log('input', tempDisableInput.value);
//   if (tempDisableInput.value !== 'temporarily disable') return;
//   chrome.storage.sync.set({ isDisabled: true }, () => {
//     chrome.browserAction.setBadgeText({ text: 'OFF' });
//     chrome.browserAction.setBadgeBackgroundColor({ color: '#4688F1' });
//     chrome.runtime.sendMessage({ isTempDisableSet: true });
//     showNotification('Disabled. Refresh page to take effect.');
//     disableSection.classList.add('hide');
//   });
// });

enableBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ disabledTime: null }, () => {
    chrome.browserAction.setBadgeText({ text: '' });
    showNotification('Enabled.');
    enableSection.classList.add('hide');
  });
});

settingBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
settingIcon.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
