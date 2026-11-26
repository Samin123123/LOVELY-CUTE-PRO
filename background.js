// LOVELY BOY • CUTE PRO (V11) - Ultra-Fast Background Sync Engine

const DEFAULT_SETTINGS = {
  // Audio & Voice Studio
  studioClarity: true,
  noiseGate: 65,
  vocalBoost: 40,
  echoActive: false,
  echoDelay: 25,
  echoFeedback: 30,
  voiceMode: "normal", // normal, baby, anime, deep, robot, chipmunk
  pitchShift: 0,

  // Privacy & UI Controls
  blurMessages: false,
  blurNames: false,
  blurPhotos: false,
  hideTyping: false,
  soundEffects: true
};

// এক্সটেনশন ইনস্টল হলে ডিফল্ট সেটিংস সেট করা
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["lb_settings"], (res) => {
    if (!res.lb_settings) {
      chrome.storage.local.set({ lb_settings: DEFAULT_SETTINGS });
    }
  });
});

// পপআপ এবং WhatsApp Web-এর মধ্যে রিয়েল-টাইম মেসেজ আদান-প্রদান
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SETTINGS") {
    chrome.storage.local.get(["lb_settings"], (res) => {
      sendResponse({ settings: res.lb_settings || DEFAULT_SETTINGS });
    });
    return true;
  }

  if (request.type === "UPDATE_SETTING") {
    chrome.storage.local.get(["lb_settings"], (res) => {
      const updated = { ...(res.lb_settings || DEFAULT_SETTINGS), ...request.payload };
      chrome.storage.local.set({ lb_settings: updated }, () => {
        // খোলা থাকা সব WhatsApp Web ট্যাবে সাথে সাথে আপডেট পাঠানো
        chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: "SETTINGS_SYNC",
              settings: updated
            }).catch(() => {});
          });
        });
        sendResponse({ success: true, settings: updated });
      });
    });
    return true;
  }

  if (request.type === "PLAY_MELODY_PAD") {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "TRIGGER_MELODY",
          padId: request.padId
        }).catch(() => {});
      });
    });
    sendResponse({ success: true });
    return true;
  }
});
