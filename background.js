// const urls = ['netflix.com', 'youtube.com'];
// const goodUrls = ['brilliant.org', 'frontendmasters.com', 'hackerrank.com'];
const urls = [];
const goodUrls = [];

const INITIAL_STATE = {
  urls,
  userMsg: '',
  timeOption: { isAllDay: true, startTime: 32400000, endTime: 79200000 },
  goodUrls,
  disabledTime: null,
};

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set(INITIAL_STATE, function () {
    console.log('the urls has been initialized as', urls);
  });
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  console.log('-----');
  console.log('tabs.onUpdated changeInfo', changeInfo);
  // console.log('tabs.onUpdated tabId', tabId);
  // console.log('tabs.onUpdated tab', tab);
  console.log('tabs.onUpdated tab.url', tab.url);

  const curUrl = tab.url;
  if (!curUrl || curUrl === 'chrome://newtab/' || changeInfo.status !== 'loading') return;

  if (await checkIsExtensionDisabled()) return;

  if (!(await checkTimeInRange())) return;

  chrome.storage.sync.get('urls', (data) => {
    const { urls } = data;

    console.log('urls to check match', urls);

    console.log('curUrl', curUrl);

    if (urls && urls.find((u) => new RegExp(u).test(curUrl))) {
      console.log('matched', curUrl);

      chrome.permissions.contains(
        {
          permissions: ['tabs'],
          origins: [curUrl],
        },
        function (result) {
          if (result) {
            chrome.tabs.create({ url: chrome.runtime.getURL('./assets/alternative-page.html') });
            chrome.tabs.remove(tabId);
            // chrome.tabs.executeScript({
            //   file: 'contents/index.js',
            // });
          } else {
            // The extension doesn't have the permissions.
            alert(`Permission not granded for ${new URL(curUrl).host}. Please add it in Options page.`);
          }
        }
      );
    }
  });
});

function checkTimeInRange() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('timeOption', (data) => {
      const { timeOption } = data;
      const { isAllDay, startTime, endTime } = timeOption;
      if (isAllDay) resolve(true);

      const rightNow = getCurrentTimeInMs();
      console.log({ rightNow, startTime, endTime });
      resolve(rightNow >= startTime && rightNow <= endTime);
    });
  });
}

function checkIsExtensionDisabled() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('disabledTime', (data) => {
      const { disabledTime } = data;

      const twelveHourInMilli = 1000 * 60 * 60 * 12;
      const now = new Date().getTime();
      const withinDisabledPeriod = disabledTime + twelveHourInMilli > now;

      console.log('withinDisabledPeriod', withinDisabledPeriod);
      resolve(withinDisabledPeriod);
    });
  });
}

function getCurrentTimeInMs() {
  const hourInMs = new Date().getHours() * 60 * 60 * 1000;
  const minuteInMs = new Date().getMinutes() * 60 * 1000;

  return hourInMs + minuteInMs;
}
