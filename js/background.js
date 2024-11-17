//based on https://developer.chrome.com/extensions/event_pages
//and https://chromium.googlesource.com/chromium/src/+/master/chrome/common/extensions/docs/examples/extensions/gmail/background.js

import dataApi from './dataApi';

const ALARM_MINUTES = 60;

function startRequest() {
  dataApi.init((data) => {
    if (data.calendars) {
      requestAllCalendars(data.calendars);
    } else {
      dataApi.getCalendars((data) => {
        requestAllCalendars(data);
      });
    }
  });
}

function requestAllCalendars(calendars) {
  for (let c of calendars) {
    dataApi.getCalendarTextRecursive([c], 0, {}, onGetCalendarText);
  }
}

function onGetCalendarText(text, responseURL, initScrollPos, fromCache) {
  const siteUrl = responseURL.map(tempURL=>dataApi.api2siteUrl(tempURL));
  for (let i = 0; i < fromCache.length; i++) {
    const tempFromCache = fromCache[i];
    if (!tempFromCache) {
      console.log("caching", siteUrl[i]);
      dataApi.saveToLocal({[siteUrl[i]]: { text: text[i], responseURL: responseURL[i], }});
    }
  }
}

function scheduleRequest() {
  chrome.alarms.create('refresh', { periodInMinutes: ALARM_MINUTES });
}

function onAlarm(alarm) {
  if (alarm.name === 'refresh') {
    startRequest();
  } else if (alarm.name === 'watchdog') {
    onWatchdog();
  }
}

function onWatchdog() {
  chrome.alarms.get('refresh', (alarm) => {
    if (!alarm) {
      startRequest();
    }
  });
}

chrome.runtime.onInstalled.addListener(scheduleRequest);
chrome.alarms.onAlarm.addListener(onAlarm);

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(startRequest);
} else {
  chrome.windows.onCreated.addListener(startRequest);
}
