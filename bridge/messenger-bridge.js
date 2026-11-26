// LOVELY BOY • CUTE PRO (V11) - WhatsApp Web Bridge & Privacy Glass Shield

(function () {
  // Inject audio engine scripts directly into page context
  function injectEngine(filePath) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(filePath);
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  injectEngine("audio/voice-studio.js");
  injectEngine("audio/melody-pad.js");

  // Apply or update Privacy Glass Shield CSS rules
  let shieldStyleEl = null;
  function applyPrivacyShield(settings) {
    if (!shieldStyleEl) {
      shieldStyleEl = document.createElement("style");
      shieldStyleEl.id = "lb-cute-privacy-shield";
      (document.head || document.documentElement).appendChild(shieldStyleEl);
    }

    let css = "";
    if (settings.blurMessages) {
      css += `
        div[data-testid="msg-container"] span.selectable-text,
        div._akbu span.selectable-text,
        span[data-testid="last-msg-status"] ~ span {
          filter: blur(6px) !important;
          transition: filter 0.2s ease !important;
        }
        div[data-testid="msg-container"]:hover span.selectable-text,
        div._akbu:hover span.selectable-text {
          filter: blur(0px) !important;
        }
      `;
    }

    if (settings.blurNames) {
      css += `
        header span[dir="auto"][title],
        div[data-testid="cell-frame-title"] span[dir="auto"] {
          filter: blur(6px) !important;
          transition: filter 0.2s ease !important;
        }
        header:hover span[dir="auto"][title],
        div[data-testid="cell-frame-title"]:hover span[dir="auto"] {
          filter: blur(0px) !important;
        }
      `;
    }

    if (settings.blurPhotos) {
      css += `
        img[src*="pps.whatsapp.net"],
        div[data-testid="default-user"] svg {
          filter: blur(8px) !important;
          transition: filter 0.2s ease !important;
        }
        img[src*="pps.whatsapp.net"]:hover {
          filter: blur(0px) !important;
        }
      `;
    }

    shieldStyleEl.textContent = css;
  }

  // Forward settings to page-level Audio Studio
  function syncToPage(settings) {
    applyPrivacyShield(settings);
    window.postMessage(
      {
        source: "LB_CUTE_PRO_BRIDGE",
        type: "SYNC_SETTINGS",
        settings: settings
      },
      "*"
    );
  }

  // Initial settings load
  chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
    if (res && res.settings) {
      syncToPage(res.settings);
    }
  });

  // Listen for live updates from background/popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SETTINGS_SYNC" && msg.settings) {
      syncToPage(msg.settings);
    }
    if (msg.type === "TRIGGER_MELODY" && msg.padId) {
      window.postMessage(
        {
          source: "LB_CUTE_PRO_BRIDGE",
          type: "PLAY_MELODY",
          padId: msg.padId
        },
        "*"
      );
    }
  });
})();
