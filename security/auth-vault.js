// LOVELY BOY • CUTE PRO (V11) - Firebase One-Time Vault & Studio Controller

(function () {
  const DB_URL = "https://lovely-boy-pro-default-rtdb.firebaseio.com";
  const MASTER_CODE = "SAMIN@2026";

  // Get or create unique device fingerprint ID
  function getDeviceId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["lb_device_id"], (res) => {
        if (res.lb_device_id) {
          resolve(res.lb_device_id);
        } else {
          const newId = "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
          chrome.storage.local.set({ lb_device_id: newId }, () => resolve(newId));
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const loginView = document.getElementById("loginView");
    const adminView = document.getElementById("adminView");
    const studioDashboard = document.getElementById("studioDashboard");
    const accessKeyInput = document.getElementById("accessKeyInput");
    const unlockBtn = document.getElementById("unlockBtn");
    const loginStatusMsg = document.getElementById("loginStatusMsg");

    const secretAdminTrigger = document.getElementById("secretAdminTrigger");
    const closeAdminBtn = document.getElementById("closeAdminBtn");
    const adminMasterPass = document.getElementById("adminMasterPass");
    const customKeyInput = document.getElementById("customKeyInput");
    const generateKeyBtn = document.getElementById("generateKeyBtn");
    const generatedKeyBox = document.getElementById("generatedKeyBox");
    const newKeyText = document.getElementById("newKeyText");
    const copyNewKeyBtn = document.getElementById("copyNewKeyBtn");
    const adminStatusMsg = document.getElementById("adminStatusMsg");

    const deviceId = await getDeviceId();

    function showDashboard() {
      loginView.classList.add("hidden");
      adminView.classList.add("hidden");
      studioDashboard.classList.remove("hidden");
      if (window.LovelyTouchSFX) window.LovelyTouchSFX.sparkle();
      initStudioControls();
    }

    // Check if already unlocked on this device
    chrome.storage.local.get(["lb_unlocked_key"], async (res) => {
      if (res.lb_unlocked_key) {
        try {
          const check = await fetch(`${DB_URL}/keys/${encodeURIComponent(res.lb_unlocked_key)}.json`);
          const data = await check.json();
          if (data && data.active === true && data.usedBy === deviceId) {
            showDashboard();
            return;
          }
        } catch (e) {
          // Offline fallback if already verified once
          showDashboard();
          return;
        }
      }
    });

    // Unlock button logic (One-Time Password verification)
    unlockBtn.addEventListener("click", async () => {
      const rawKey = accessKeyInput.value.trim().toUpperCase();
      if (!rawKey) {
        loginStatusMsg.textContent = "Please enter your passkey first!";
        return;
      }

      loginStatusMsg.textContent = "Verifying with Cute Cloud Vault...";
      unlockBtn.disabled = true;

      try {
        const res = await fetch(`${DB_URL}/keys/${encodeURIComponent(rawKey)}.json`);
        const keyData = await res.json();

        if (!keyData || keyData.active !== true) {
          loginStatusMsg.textContent = "Invalid or expired passkey!";
          unlockBtn.disabled = false;
          return;
        }

        if (keyData.usedBy && keyData.usedBy !== deviceId) {
          loginStatusMsg.textContent = "This 1-time key is already used on another device!";
          unlockBtn.disabled = false;
          return;
        }

        // Bind key permanently to this device
        await fetch(`${DB_URL}/keys/${encodeURIComponent(rawKey)}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usedBy: deviceId,
            usedAt: new Date().toISOString()
          })
        });

        chrome.storage.local.set({ lb_unlocked_key: rawKey }, () => {
          loginStatusMsg.textContent = "";
          showDashboard();
        });
      } catch (err) {
        loginStatusMsg.textContent = "Network error! Check internet connection.";
        unlockBtn.disabled = false;
      }
    });

    // Secret 5-tap trigger for Owner Key Generator
    let tapCount = 0;
    let tapTimer = null;
    secretAdminTrigger.addEventListener("click", () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
      if (tapCount >= 5) {
        tapCount = 0;
        adminView.classList.remove("hidden");
        if (window.LovelyTouchSFX) window.LovelyTouchSFX.sparkle();
      }
    });

    closeAdminBtn.addEventListener("click", () => {
      adminView.classList.add("hidden");
    });

    // Generate 1-Time Key in Firebase
    generateKeyBtn.addEventListener("click", async () => {
      if (adminMasterPass.value.trim() !== MASTER_CODE) {
        adminStatusMsg.textContent = "Wrong Master Secret Code!";
        return;
      }

      const custom = customKeyInput.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
      const finalKey = custom || ("LB-" + Math.floor(1000 + Math.random() * 9000) + "-PRO");

      adminStatusMsg.textContent = "Creating key in Firebase...";
      try {
        await fetch(`${DB_URL}/keys/${encodeURIComponent(finalKey)}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active: true,
            usedBy: null,
            createdAt: new Date().toISOString()
          })
        });

        newKeyText.textContent = finalKey;
        generatedKeyBox.classList.remove("hidden");
        adminStatusMsg.textContent = "1-Time Passkey Ready!";
        customKeyInput.value = "";
      } catch (e) {
        adminStatusMsg.textContent = "Failed to save key! Check Firebase rules.";
      }
    });

    copyNewKeyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(newKeyText.textContent);
      copyNewKeyBtn.textContent = "COPIED!";
      setTimeout(() => { copyNewKeyBtn.textContent = "COPY"; }, 1500);
    });
        // Studio Dashboard Controls & Real-Time Sync
    function initStudioControls() {
      const tabBtns = document.querySelectorAll(".tab-btn");
      const tabPanes = document.querySelectorAll(".tab-pane");

      tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          tabBtns.forEach((b) => b.classList.remove("active"));
          tabPanes.forEach((p) => {
            p.classList.remove("active");
            p.classList.add("hidden");
          });
          btn.classList.add("active");
          const targetPane = document.getElementById(btn.dataset.tab);
          if (targetPane) {
            targetPane.classList.remove("hidden");
            targetPane.classList.add("active");
          }
        });
      });

      function pushSetting(patch) {
        chrome.runtime.sendMessage({
          type: "UPDATE_SETTING",
          payload: patch
        });
      }

      // Load saved settings into UI
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
        if (!res || !res.settings) return;
        const s = res.settings;

        const setCheck = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.checked = !!val;
        };
        const setRange = (sliderId, labelId, val) => {
          const sl = document.getElementById(sliderId);
          const lb = document.getElementById(labelId);
          if (sl) sl.value = val;
          if (lb) lb.textContent = val + "%";
        };

        setCheck("studioClarityToggle", s.studioClarity);
        setRange("noiseGateSlider", "noiseGateVal", s.noiseGate);
        setRange("vocalBoostSlider", "vocalBoostVal", s.vocalBoost);

        setCheck("echoActiveToggle", s.echoActive);
        setRange("echoDelaySlider", "echoDelayVal", s.echoDelay);
        setRange("echoFeedbackSlider", "echoFeedbackVal", s.echoFeedback);

        setCheck("blurMessagesToggle", s.blurMessages);
        setCheck("blurNamesToggle", s.blurNames);
        setCheck("blurPhotosToggle", s.blurPhotos);
        setCheck("hideTypingToggle", s.hideTyping);

        document.querySelectorAll(".voice-chip").forEach((chip) => {
          chip.classList.toggle("active", chip.dataset.voice === s.voiceMode);
        });
      });

      // Bind Toggles
      const toggleMap = {
        studioClarityToggle: "studioClarity",
        echoActiveToggle: "echoActive",
        blurMessagesToggle: "blurMessages",
        blurNamesToggle: "blurNames",
        blurPhotosToggle: "blurPhotos",
        hideTypingToggle: "hideTyping"
      };

      Object.entries(toggleMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener("change", () => {
            pushSetting({ [key]: el.checked });
          });
        }
      });

      // Bind Sliders
      const sliderMap = [
        { slider: "noiseGateSlider", label: "noiseGateVal", key: "noiseGate" },
        { slider: "vocalBoostSlider", label: "vocalBoostVal", key: "vocalBoost" },
        { slider: "echoDelaySlider", label: "echoDelayVal", key: "echoDelay" },
        { slider: "echoFeedbackSlider", label: "echoFeedbackVal", key: "echoFeedback" }
      ];

      sliderMap.forEach(({ slider, label, key }) => {
        const sl = document.getElementById(slider);
        const lb = document.getElementById(label);
        if (sl) {
          sl.addEventListener("input", () => {
            const val = parseInt(sl.value, 10);
            if (lb) lb.textContent = val + "%";
            pushSetting({ [key]: val });
          });
        }
      });

      // Bind Voice Changer Chips
      document.querySelectorAll(".voice-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          document.querySelectorAll(".voice-chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          pushSetting({ voiceMode: chip.dataset.voice });
        });
      });

      // Bind Melody Soundboard Pads
      document.querySelectorAll(".pad-btn").forEach((pad) => {
        pad.addEventListener("click", () => {
          chrome.runtime.sendMessage({
            type: "PLAY_MELODY_PAD",
            padId: pad.dataset.pad
          });
        });
      });
    }
  });
})();
