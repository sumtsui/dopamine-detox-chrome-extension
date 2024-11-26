const badUrlInput = document.querySelector('#bad-sites .urlInput');
const badUrlDisplay = document.querySelector('#bad-sites .urlDisplay');
const goodUrlInput = document.querySelector('#good-sites .urlInput');
const goodUrlDisplay = document.querySelector('#good-sites .urlDisplay');
// const msgTextArea = document.getElementById('userMsg');
// const msgSaveBtn = document.getElementById('msgSaveBtn');
const timeAllDay = document.getElementById('allDay');
const selectedTimeRange = document.getElementById('selectedTimeRange');
const whenToShow = document.getElementById('whenToShow');
const timeRangeSetting = document.querySelector('.time-range-setting');
const timeRangeStart = document.getElementById('startTime');
const timeRangeEnd = document.getElementById('endTime');

const toggleActivationRadioGroup = document.getElementById('toggleActivationRadioGroup');
const activated = toggleActivationRadioGroup.querySelector('#activated');
const inactivated = toggleActivationRadioGroup.querySelector('#inactivated');

class TimeOption {
  constructor() {
    this.isAllDay = false;
    this.startTime = null;
    this.endTime = null;
  }
  onWhenToShowChange(evt) {
    if (evt.target.type !== 'radio') return;
    const { value } = evt.target;
    if (value === 'allDay') {
      this.isAllDay = true;
      updateFieldInStorage((timeOption) => ({ ...timeOption, isAllDay: true }), 'timeOption');
      timeRangeSetting.style.display = 'none';
    } else {
      this.isAllDay = false;
      updateFieldInStorage((timeOption) => ({ ...timeOption, isAllDay: false }), 'timeOption');
      timeRangeSetting.style.display = 'block';
    }
  }
  onStartTimeSet(evt) {
    const val = evt.target.valueAsNumber;
    this.startTime = val;
    this.isAllDay = false;
    updateFieldInStorage(
      (timeOption) => ({ ...timeOption, startTime: val, isAllDay: false }),
      'timeOption'
    );
  }
  onEndTimeSet(evt) {
    const val = evt.target.valueAsNumber;
    this.endTime = val;
    this.isAllDay = false;
    updateFieldInStorage((timeOption) => ({ ...timeOption, endTime: val, isAllDay: false }), 'timeOption');
  }
  fillOptionsFromStorage() {
    chrome.storage.sync.get('timeOption', (data) => {
      const { timeOption } = data;
      const { isAllDay, startTime, endTime } = timeOption;
      timeAllDay.checked = isAllDay;
      selectedTimeRange.checked = !isAllDay;
      if (isAllDay) {
        timeRangeSetting.style.display = 'none';
      }
      if (startTime) timeRangeStart.value = msToTime(startTime);
      if (endTime) timeRangeEnd.value = msToTime(endTime);
    });
  }
}

const timeOption = new TimeOption();

renderUrlList('good');
renderUrlList('bad');
timeOption.fillOptionsFromStorage();
initExtensionToggle();
// initMessageValue();

toggleActivationRadioGroup.addEventListener('click', (evt) => {
  const el = evt.target.previousElementSibling;

  if (el && el.type === 'radio') {
    if (el.value === 'yes') {
      activated.checked = true;
      inactivated.checked = false;
    } else {
      if (!window.confirm('Do you really want to do this?')) return;

      if (!guessingGame()) return;

      activated.checked = false;
      inactivated.checked = true;
    }

    chrome.storage.sync.set({ disabledTime: el.value === 'yes' ? null : new Date().getTime() }, () => {
      console.log('the storage has been updated.', el.value === 'yes' ? null : new Date().getTime());
    });
  }
});

badUrlInput.addEventListener('keypress', (evt) => {
  if (evt.key === 'Enter') {
    // TODO: input validation
    let url;
    const value = evt.target.value;
    const valueArr = value.split('.');

    if (valueArr.length <= 2) {
      // No base level domain, ["baidu", "com"]
      url = `*.${value}`;
    } else if (valueArr.length > 2) {
      // has base level domain, ["www", "baidu", "com"]
      valueArr[0] = '*';
      url = valueArr.join('.');
    }

    evt.target.value = '';
    // use url to ask for permission, e.g. *.baidu.com
    // but save value to storage, and later for current url matching e.g. new RegEx("baidu.com").test("www.baidu.com")
    chrome.permissions.request({ origins: [`https://${url}/`] }, (granted) => {
      if (granted) {
        updateFieldInStorage((urls) => [...urls, value], 'urls');
        addUrlDisplayItem(value, 'bad');
      } else {
        alert('You declined the permission request.');
        console.log('fail to get permission for %s', url);
      }
    });
  }
});

goodUrlInput.addEventListener('keypress', (evt) => {
  if (evt.key === 'Enter') {
    const value = evt.target.value;

    evt.target.value = '';

    updateFieldInStorage((urls) => [...urls, value], 'goodUrls');
    addUrlDisplayItem(value, 'good');
  }
});

whenToShow.addEventListener('change', timeOption.onWhenToShowChange);
timeRangeStart.addEventListener('input', timeOption.onStartTimeSet);
timeRangeEnd.addEventListener('input', timeOption.onEndTimeSet);

function renderUrlList(option) {
  if (!option) throw new Error('renderUrlList: no option provided');
  const urlsKey = option === 'bad' ? 'urls' : 'goodUrls';
  chrome.storage.sync.get(urlsKey, function (data) {
    const urls = option === 'bad' ? data.urls : data.goodUrls;

    if (Array.isArray(urls)) urls.forEach((url) => addUrlDisplayItem(url, option));
  });
}

function initExtensionToggle() {
  chrome.storage.sync.get('disabledTime', (data) => {
    const { disabledTime } = data;

    const twelveHourInMilli = 1000 * 60 * 60 * 12;
    const now = new Date().getTime();
    const withinDisabledPeriod = disabledTime + twelveHourInMilli > now;

    if (withinDisabledPeriod) inactivated.checked = true;
    else activated.checked = true;
  });
}

// function initMessageValue() {
//   chrome.storage.sync.get('userMsg', (data) => {
//     const { userMsg } = data;
//     if (userMsg) msgTextArea.value = userMsg;
//   });
// }

function addUrlDisplayItem(url, option) {
  if (!option) throw new Error('addUrlDisplayItem: no option provided');
  const wrap = document.createElement('div');
  const item = document.createElement('p');
  const removeButton = document.createElement('img');

  wrap.classList.add('url-item');
  item.innerText = url;
  removeButton.src = '../assets/cross.png';
  removeButton.alt = 'url-delete-button';
  removeButton.addEventListener('click', (evt) => {
    onRemoveUrl(url, evt.target.parentElement, option);
  });

  wrap.appendChild(item);
  wrap.appendChild(removeButton);
  if (option === 'bad') badUrlDisplay.appendChild(wrap);
  else if (option === 'good') goodUrlDisplay.appendChild(wrap);
}

function onRemoveUrl(url, urlItemEl, option) {
  if (!option) throw new Error('onRemoveUrl: no option provided');
  if (window.confirm('Are you sure?')) {
    if (option === 'bad' && guessingGame(true)) {
      updateFieldInStorage((urls) => urls.filter((u) => u !== url), 'urls');
      badUrlDisplay.removeChild(urlItemEl);
    } else {
      updateFieldInStorage((urls) => urls.filter((u) => u !== url), 'goodUrls');
      goodUrlDisplay.removeChild(urlItemEl);
    }
  }
}

function updateFieldInStorage(fn, field) {
  chrome.storage.sync.get(field, (data) => {
    const { [field]: original } = data;
    const updated = fn(original);

    chrome.storage.sync.set({ [field]: updated }, () => {
      console.log('the storage has been updated.', updated);
    });
  });
}

// msgSaveBtn.addEventListener('click', onMsgSave);

// function onMsgSave() {
//   const msg = msgTextArea.value;
//   chrome.runtime.sendMessage({ isUserMsgSet: true });
//   chrome.storage.sync.set({ userMsg: msg }, () => {
//     alert('The message has been saved.');
//     console.log('the message has been updated.', msg);
//   });
// }

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function guessingGame(isRemoveAUrl) {
  const num = getRandomIntInclusive(1, 50);
  console.log('num', num);

  let result = window.prompt(
    'I have in mind a number between 1 and 50. Can you guess it? (yes, this is happening)'
  );

  while (Number(result) !== num) {
    // user click "cancel" in prompt
    if (result === null) return false;

    // user didn't type number
    if (isNaN(Number(result))) result = window.prompt('Your guess is wrong. Try again.');
    else if (result > num) result = window.prompt(`Your guess ${result} is too large. Try again.`);
    else if (result < num) result = window.prompt(`Your guess ${result} is too small. Try again.`);
    else result = window.prompt('Try again.');
  }

  if (isRemoveAUrl) window.alert('Url removed.');
  else window.alert('Fine, you got it. The extension is now disabled for 12 hours. After that it will resume.');
  return true;
}
