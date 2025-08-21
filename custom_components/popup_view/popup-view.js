(() => {
  const DEBUG_MODE = true;
  const log = DEBUG_MODE ? console.log : () => {};
  const debug = DEBUG_MODE ? console.debug : () => {};
  const warn = DEBUG_MODE ? console.warn : () => {};
  log("=== POPUP VIEW SCRIPT LOADING ===");
  class PopupView {
    constructor() {
      log("=== POPUP VIEW CONSTRUCTOR CALLED ===");
      this.setupEventListener();
      log("Popup View component loaded");
    }
    toggleDebugMode(enabled = null) {
      if (enabled !== null) {
        window.__popupViewDebug = enabled;
      } else {
        window.__popupViewDebug = !window.__popupViewDebug;
      }
      console.log(`🐛 Popup View Debug Mode: ${window.__popupViewDebug ? 'ENABLED' : 'DISABLED'}`);
      console.log("You can toggle debug mode by calling: window.togglePopupDebug()");
      return window.__popupViewDebug;
    }
    getOrCreateDeviceId() {
      console.log("🔍 Getting device ID...");
      let deviceId = localStorage.getItem('popup_view_device_id');
      if (!deviceId) {
        deviceId = `popup_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('popup_view_device_id', deviceId);
        console.log("✨ Created new device ID:", deviceId);
      } else {
        console.log("✅ Found existing device ID:", deviceId);
      }
      return deviceId;
    }
    getDeviceFingerprint() {
      const fingerprint = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform
      };
      console.log("📱 Device fingerprint:", fingerprint);
      return fingerprint;
    }
    getSessionId() {
      if (!window.__popupViewSessionId) {
        window.__popupViewSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log("🔑 Created session ID:", window.__popupViewSessionId);
      }
      return window.__popupViewSessionId;
    }
    identifyThisDevice() {
      console.log("=== DEVICE IDENTIFICATION START ===");
      const identification = {
        deviceId: this.getOrCreateDeviceId(),
        sessionId: this.getSessionId(),
        fingerprint: this.getDeviceFingerprint(),
        companion: null,
        browserMod: null
      };
      if (window.webkit?.messageHandlers?.externalBus) {
        identification.companion = "iOS Companion App";
        console.log("📱 Detected iOS Companion App");
      } else if (window.externalApp) {
        identification.companion = "Android Companion App";
        console.log("📱 Detected Android Companion App");
      }
      const hass = document.querySelector('home-assistant')?.hass;
      if (hass?.states) {
        const browserModDevices = Object.keys(hass.states)
          .filter(entityId => entityId.startsWith('browser_mod.'));
        if (browserModDevices.length > 0) {
          console.log("🖥️ Browser Mod entities found:", browserModDevices);
          identification.browserMod = browserModDevices;
        }
      }
      console.log("=== DEVICE IDENTIFICATION COMPLETE ===");
      console.log("Full identification:", identification);
      return identification;
    }
    normalizeEntityId(entityId) {
      if (!entityId) return '';
      const normalized = entityId.toLowerCase().trim();
      console.log(`📝 Normalized: "${entityId}" -> "${normalized}"`);
      return normalized;
    }
    matchesTargetDisplay(targetDisplays, deviceInfo) {
      console.log("=== DISPLAY MATCHING START ===");
      console.log("Target displays:", targetDisplays);
      console.log("Device info:", deviceInfo);
      if (!targetDisplays || targetDisplays.length === 0) {
        console.log("❌ No target displays specified");
        return false;
      }
      const normalizedTargets = targetDisplays.map(d => this.normalizeEntityId(d));
      console.log("Normalized targets:", normalizedTargets);
      const matchStrategies = [];
      if (deviceInfo.deviceId) {
        const deviceIdMatch = normalizedTargets.some(target => 
          target.includes(deviceInfo.deviceId.toLowerCase())
        );
        matchStrategies.push({
          strategy: "Device ID",
          matched: deviceIdMatch
        });
      }
      if (deviceInfo.companion) {
        const hass = document.querySelector('home-assistant')?.hass;
        if (hass?.states) {
          const deviceTrackers = Object.keys(hass.states)
            .filter(id => id.startsWith('device_tracker.'))
            .map(id => this.normalizeEntityId(id));
          console.log("Found device trackers:", deviceTrackers);
          const trackerMatch = normalizedTargets.some(target =>
            deviceTrackers.some(tracker => tracker.includes(target) || target.includes(tracker))
          );
          matchStrategies.push({
            strategy: "Device Tracker",
            matched: trackerMatch
          });
        }
      }
      if (deviceInfo.browserMod) {
        const browserModMatch = normalizedTargets.some(target =>
          deviceInfo.browserMod.some(bmId => 
            this.normalizeEntityId(bmId).includes(target) || 
            target.includes(this.normalizeEntityId(bmId))
          )
        );
        matchStrategies.push({
          strategy: "Browser Mod",
          matched: browserModMatch
        });
      }
      const hass = document.querySelector('home-assistant')?.hass;
      if (hass?.states) {
        const mediaPlayers = Object.keys(hass.states)
          .filter(id => id.startsWith('media_player.'))
          .map(id => this.normalizeEntityId(id));
        console.log("Available media players:", mediaPlayers);
        const mediaPlayerMatch = normalizedTargets.some(target =>
          target.startsWith('media_player.')
        );
        if (mediaPlayerMatch) {
          console.log("⚠️ Media player targeting detected but cannot verify this device");
          matchStrategies.push({
            strategy: "Media Player",
            matched: false,
            note: "Cannot verify media player identity"
          });
        }
      }
      console.log("Match strategies results:", matchStrategies);
      const anyMatch = matchStrategies.some(s => s.matched === true);
      console.log("=== DISPLAY MATCHING RESULT ===", anyMatch ? "✅ MATCH" : "❌ NO MATCH");
      return anyMatch;
    }
    closePopup(popup, animationSpeed = 300) {
      if (popup._cleanupAutoClose) {
        popup._cleanupAutoClose();
      }
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      if (animationSpeed > 0) {
        const container = popup.querySelector('.popup-container');
        if (!popup.style.transition || !popup.style.transition.includes('opacity')) {
          popup.style.transition = `opacity ${animationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
        popup.style.opacity = '0';
        if (container) {
          const alignment = popup.dataset.alignment || 'bottom';
          if (alignment === 'center') {
            container.style.transform = 'translateY(100vh) scale(0.95)';
            container.style.webkitTransform = 'translateY(100vh) scale(0.95)';
          } else {
            container.style.transform = 'translateY(100vh)';
            container.style.webkitTransform = 'translateY(100vh)';
          }
        }
        setTimeout(() => popup.remove(), animationSpeed);
      } else {
        popup.remove();
      }
    }
    setupEventListener() {
      log("=== SETTING UP EVENT LISTENER ===");
      const checkHass = setInterval(() => {
        log("Checking for HASS connection...");
        const hass = document.querySelector('home-assistant')?.hass;
        if (hass?.connection && hass.states) {
          log("=== HASS CONNECTION FOUND ===");
          clearInterval(checkHass);
          let currentUser = null;
          let normalizedUser = null;
          if (hass) {
            if (hass.user?.name) {
              currentUser = hass.user.name;
            }
            else if (hass.connection?.user?.name) {
              currentUser = hass.connection.user.name;
            }
            else if (hass.auth?.data?.user?.name) {
              currentUser = hass.auth.data.user.name;
            }
            else {
              try {
                const hassTokens = JSON.parse(localStorage.getItem('hassTokens') || '{}');
                if (hassTokens.user?.name) {
                  currentUser = hassTokens.user.name;
                }
              } catch (e) {
                console.debug("Could not parse hassTokens from localStorage");
              }
            }
            if (!currentUser) {
              console.debug("Available hass properties:", Object.keys(hass));
              console.debug("User-related data:", {
                user: hass.user,
                auth: hass.auth?.data,
                connection: hass.connection?.user
              });
            }
          }
          if (currentUser) {
            normalizedUser = currentUser.toLowerCase().replace(/\s+/g, '_');
            log("Current HA user:", currentUser, "Normalized:", normalizedUser);
          } else {
            console.warn("Could not determine current user - popup targeting may not work");
            console.debug("Available hass object:", hass);
          }
          hass.connection.subscribeEvents((event) => {
            console.log("=== POPUP EVENT RECEIVED ===");
            console.log("Event data:", event.data);
            const deviceInfo = this.identifyThisDevice();
            const { displays, is_tap_action } = event.data;
            let shouldShowPopup = false;
            let reason = "";
            if (is_tap_action && (!displays || displays.length === 0)) {
              console.log("📱 TAP ACTION detected without displays");
              shouldShowPopup = true;
              reason = "Tap action on this device";
              console.log("✅ Showing popup for tap action");
            }
            else if (displays && displays.length > 0) {
              console.log("🎯 TARGETED DISPLAY mode");
              console.log("Checking if this device matches targets...");
              shouldShowPopup = this.matchesTargetDisplay(displays, deviceInfo);
              reason = shouldShowPopup ? "Device matches target displays" : "Device does not match targets";
            }
            else {
              console.log("📢 BROADCAST mode - no displays specified");
              shouldShowPopup = true;
              reason = "Broadcast to all devices";
            }
            console.log("=== POPUP DECISION ===");
            console.log("Should show:", shouldShowPopup);
            console.log("Reason:", reason);
            if (shouldShowPopup) {
              console.log("🎉 SHOWING POPUP!");
              const { 
                path, 
                title, 
                animation_speed, 
                auto_close, 
                background_blur, 
                popup_height, 
                alignment, 
                transparent_background 
              } = event.data;
              this.openPopup(path, title, {
                animationSpeed: animation_speed || 300,
                autoClose: auto_close || 0,
                backgroundBlur: background_blur || false,
                popupHeight: popup_height || 90,
                alignment: alignment || 'bottom',
                transparentBackground: transparent_background || false
              });
            } else {
              console.log("⏭️ Skipping popup - not for this device");
            }
            console.log("=== EVENT HANDLING COMPLETE ===\n");
          }, 'popup_view_open');
          log("=== POPUP VIEW LISTENING FOR EVENTS ===");
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkHass);
        console.warn("Popup View: Could not connect to HA after 10 seconds");
      }, 10000);
    }
    async openPopup(subviewPath, popupTitle, options = {}) {
      log("=== OPENING POPUP ===");
      log("Received path:", subviewPath);
      log("Received title:", popupTitle);
      log("Options:", options);
      const {
        animationSpeed = 300,
        autoClose = 0,
        backgroundBlur = false,
        popupHeight = 90,
        alignment = 'bottom',
        transparentBackground = false
      } = options;
      document.querySelector('.subview-popup-overlay')?.remove();
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      const popup = document.createElement('div');
      popup.className = 'subview-popup-overlay';
      popup.dataset.alignment = alignment;
      popup.dataset.animationSpeed = animationSpeed;
      let overlayAlignment = 'flex-end';
      if (alignment === 'center') {
        overlayAlignment = 'center';
      } else if (alignment === 'top') {
        overlayAlignment = 'flex-start';
      }
      popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        ${backgroundBlur ? 'backdrop-filter: blur(4px);' : ''}
        z-index: 9999;
        display: flex;
        align-items: ${overlayAlignment};
        justify-content: center;
        opacity: 0;
        transition: opacity ${animationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1);
        touch-action: none;  /* LEGG TIL: Blokkerer touch gestures */
        -webkit-touch-callout: none;  /* LEGG TIL: Disable callout */
      `;
      const container = document.createElement('div');
      container.className = 'popup-container';
      let borderRadius = '12px 12px 0 0';
      if (alignment === 'center') {
        borderRadius = '12px';
      } else if (alignment === 'top') {
        borderRadius = '0 0 12px 12px';
      }
      const effectivePopupHeight = popupHeight === 100 ? '100vh' : `${popupHeight}vh`;
      container.style.cssText = `
        width: 600px;
        max-width: 90vw;
        height: auto;  /* ENDRET: Start med auto height */
        min-height: 100px;  /* LEGG TIL: Minimum høyde */
        max-height: ${effectivePopupHeight};
        background: ${transparentBackground ? 'transparent' : 'var(--primary-background-color)'};
        border-radius: ${borderRadius};
        ${transparentBackground ? '' : 'box-shadow: 0 ' + (alignment === 'top' ? '' : '-') + '10px 50px rgba(0, 0, 0, 0.3);'}
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(100vh);
        -webkit-transform: translateY(100vh);
        transition: transform ${animationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-transition: -webkit-transform ${animationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
        margin: 0 auto;
        touch-action: auto;
      `;
      const controls = document.createElement('div');
      controls.className = 'popup-controls';
      controls.style.cssText = `
        display: flex;
        justify-content: ${popupTitle ? 'space-between' : 'flex-end'};
        align-items: center;
        padding: 4px 32px;
        background: transparent;
        flex-shrink: 0;
        min-height: 48px;
      `;
      const title = document.createElement('h2');
      if (popupTitle) {
        title.textContent = popupTitle;
        title.style.cssText = `
          margin: 0;
          font-size: 1.3em;
          font-weight: 500;
          color: var(--primary-text-color);
          background: var(--card-background-color, var(--ha-card-background));
          padding: 4px 16px;
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          max-width: calc(100% - 60px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `;
        controls.appendChild(title);
      }
      const closeBtn = document.createElement('div');
      closeBtn.style.cssText = `
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.2s ease;
        background: var(--card-background-color, var(--ha-card-background));
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        margin-left: ${popupTitle ? 'auto' : '0'};
      `;
      const closeIcon = document.createElement('ha-icon');
      closeIcon.setAttribute('icon', 'mdi:close');
      closeIcon.style.cssText = `
        --mdc-icon-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary-text-color);
      `;
      closeBtn.appendChild(closeIcon);
      closeBtn.addEventListener('click', () => this.closePopup(popup, animationSpeed));
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'var(--secondary-background-color)';
        closeBtn.style.transform = 'scale(1.1)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.transform = 'scale(1)';
      });
      controls.appendChild(closeBtn);
      const content = document.createElement('div');
      content.style.cssText = `
        flex: 1 1 auto;
        overflow-x: hidden;  /* VIKTIG: Forhindre horisontal scrolling */
        overflow-y: auto;    /* Tillat vertikal scrolling */
        padding: 0;
        width: 100%;
        max-width: 100%;     /* Begrens innholdet */
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-sizing: border-box;
      `;
      content.innerHTML = '<ha-circular-progress active></ha-circular-progress>';
      content.dataset.transparentBackground = transparentBackground;
      container.appendChild(controls);
      container.appendChild(content);
      popup.appendChild(container);
      document.body.appendChild(popup);
      if (animationSpeed > 0) {
        popup.offsetHeight;
        container.offsetHeight;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            popup.style.opacity = '1';
            container.style.transform = 'translateY(0)';
            container.style.webkitTransform = 'translateY(0)';
          });
        });
      } else {
        popup.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }
      if (autoClose > 0) {
        let closeTimer = null;
        let lastActivity = Date.now();
        const resetTimer = () => {
          lastActivity = Date.now();
          if (closeTimer) {
            clearTimeout(closeTimer);
          }
          closeTimer = setTimeout(() => {
            const timeSinceActivity = Date.now() - lastActivity;
            if (timeSinceActivity < 1000) {
              log("Recent activity detected, resetting auto-close timer");
              resetTimer();
            } else {
              log("Auto-closing popup after idle timeout");
              this.closePopup(popup, animationSpeed);
            }
          }, autoClose * 1000);
          log(`Auto-close timer reset: ${autoClose} seconds`);
        };
        const activityEvents = [
          'mousedown', 'mousemove', 'mouseenter',
          'touchstart', 'touchmove',
          'scroll', 'wheel',
          'keydown', 'click'
        ];
        const handleActivity = (e) => {
          if (popup.contains(e.target)) {
            resetTimer();
          }
        };
        activityEvents.forEach(eventType => {
          popup.addEventListener(eventType, handleActivity, { passive: true });
        });
        content.addEventListener('scroll', handleActivity, { passive: true });
        resetTimer();
        popup._cleanupAutoClose = () => {
          if (closeTimer) {
            clearTimeout(closeTimer);
          }
          activityEvents.forEach(eventType => {
            popup.removeEventListener(eventType, handleActivity);
          });
          content.removeEventListener('scroll', handleActivity);
        };
      }
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          this.closePopup(popup, animationSpeed);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          this.closePopup(popup, animationSpeed);
        }
      });
      try {
        await this.loadViewContent(subviewPath, content);
      } catch (error) {
        console.error("Error loading view:", error);
        content.innerHTML = `
          <div style="text-align: center; color: var(--error-color); padding: 20px;">
            <ha-icon icon="mdi:alert" style="--mdc-icon-size: 48px;"></ha-icon>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
    async loadViewContent(subviewPath, contentElement) {
      const hass = document.querySelector('home-assistant');
      if (!hass) {
        throw new Error('Home Assistant element not found');
      }
      await this.waitForLovelace();
      if (subviewPath.startsWith('/')) {
        log("Loading view from path:", subviewPath);
      }
      let pathParts = subviewPath.split('/').filter(p => p);
      log("Original path parts:", pathParts);
      let dashboardUrl = 'lovelace';
      let viewPath = '';
      if (pathParts.length === 1) {
        viewPath = pathParts[0];
      } else if (pathParts.length >= 2) {
        dashboardUrl = pathParts[0];
        viewPath = pathParts[1];
      }
      log("Dashboard:", dashboardUrl);
      log("View path:", viewPath);
      log("Full path received:", subviewPath);
      log(`Attempting to get config for dashboard: ${dashboardUrl}`);
      const lovelaceConfig = await this.getLovelaceConfig(dashboardUrl);
      log("Config received:", lovelaceConfig);
      if (!lovelaceConfig) {
        throw new Error(`Could not get configuration for dashboard: ${dashboardUrl}`);
      }
      const views = lovelaceConfig.views || [];
      log(`Found ${views.length} views in dashboard '${dashboardUrl}'`);
      log("Available views:", views.map(v => ({ 
        path: v.path, 
        title: v.title,
        index: views.indexOf(v)
      })));
      let viewConfig = views.find(v => v.path === viewPath);
      let viewIndex = views.findIndex(v => v.path === viewPath);
      if (viewConfig) {
        log("Found view by path match:", viewPath);
      }
      if (!viewConfig) {
        const index = parseInt(viewPath);
        if (!isNaN(index) && views[index]) {
          viewConfig = views[index];
          viewIndex = index;
          log(`Found view by index: ${index}`);
        }
      }
      if (!viewConfig) {
        if (viewPath === '' && views[0]) {
          viewConfig = views[0];
          viewIndex = 0;
        } else {
          const foundView = views.find(v => 
            v.path === viewPath || 
            v.path === `/${viewPath}` ||
            v.title?.toLowerCase() === viewPath.toLowerCase()
          );
          if (foundView) {
            viewConfig = foundView;
            viewIndex = views.indexOf(foundView);
            log("Found view with alternative matching:", foundView.path);
          } else {
            console.error("Could not find view. Looking for:", viewPath);
            console.error("Available view paths:", views.map(v => v.path));
            throw new Error(`View '${viewPath}' not found in dashboard '${dashboardUrl}'`);
          }
        }
      }
      log("Found view config:", JSON.stringify(viewConfig, null, 2));
      log("View config keys:", Object.keys(viewConfig || {}));
      log("Starting to create view element...");
      contentElement.innerHTML = '';
      await this.createViewElement(viewConfig, viewIndex, contentElement);
      log("View element created successfully");
    }
    async waitForLovelace(timeout = 5000) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const hass = document.querySelector('home-assistant');
        if (hass?.hass?.panels) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      throw new Error('No dashboard panels found');
    }
    async getLovelaceConfig(dashboardUrl = 'lovelace') {
      const hass = document.querySelector('home-assistant').hass;
      log(`getLovelaceConfig called with dashboardUrl: '${dashboardUrl}'`);
      try {
        let response;
        if (dashboardUrl && dashboardUrl !== 'lovelace') {
          log(`Fetching config for custom dashboard: ${dashboardUrl}`);
          response = await hass.connection.sendMessagePromise({
            type: 'lovelace/config',
            url_path: dashboardUrl
          });
        } else {
          log("Fetching default lovelace config");
          response = await hass.connection.sendMessagePromise({
            type: 'lovelace/config'
          });
        }
        log("Config response:", response);
        log("Number of views:", response?.views?.length);
        return response;
      } catch (error) {
        console.error('Could not get Lovelace config:', error);
        throw new Error(`Failed to load configuration for dashboard: ${dashboardUrl}`);
      }
    }
    async createViewElement(viewConfig, viewIndex, container) {
      const hass = document.querySelector('home-assistant').hass;
      log("Creating view element with config:", viewConfig);
      log("View type:", viewConfig.type);
      log("View has cards:", viewConfig.cards?.length || 0);
      log("View has sections:", viewConfig.sections?.length || 0);
      const viewElement = document.createElement('div');
      viewElement.style.cssText = `
        width: 100%; 
        max-width: 100%;  /* VIKTIG: Forhindre at innhold går utenfor */
        height: 100%; 
        box-sizing: border-box;
        overflow-x: hidden;  /* Skjul evt overflow */
      `;
      if (viewConfig.type === 'sections' && viewConfig.sections) {
        log(`Creating sections view with ${viewConfig.sections.length} sections`);
        const transparentBg = container.dataset.transparentBackground === 'true';
        const singleSection = viewConfig.sections.length === 1;
        const sectionsContainer = document.createElement('div');
        sectionsContainer.style.cssText = `
          display: grid;
          grid-template-columns: repeat(${viewConfig.sections.length}, minmax(0, 1fr));  /* ENDRET: minmax for responsive kolonner */
          gap: 16px;
          padding: 4px 16px;
          width: 100%;
          max-width: 100%;  /* Begrens bredde */
          box-sizing: border-box;
        `;
        for (const section of viewConfig.sections) {
          const sectionElement = document.createElement('div');
          sectionElement.style.cssText = `
            width: 100%;
            box-sizing: border-box;
          `;
          if (section.title) {
            const titleElement = document.createElement('h3');
            titleElement.textContent = section.title;
            titleElement.style.cssText = `
              margin: 0 0 12px 0;
              padding: 4px 16px;
              font-size: 1.2em;
              color: var(--primary-text-color);
              width: 100%;
            `;
            sectionElement.appendChild(titleElement);
          }
          const cardsContainer = document.createElement('div');
          cardsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          `;
          if (section.cards && section.cards.length > 0) {
            for (const cardConfig of section.cards) {
              try {
                log("Creating card in section:", cardConfig.type);
                const cardElement = await this.createCard(cardConfig, hass);
                if (cardElement) {
                  cardsContainer.appendChild(cardElement);
                }
              } catch (error) {
                console.error('Error creating card:', error);
                const errorCard = document.createElement('div');
                errorCard.style.cssText = `
                  background: var(--card-background-color);
                  border-radius: 8px;
                  padding: 4px 16px;
                  border: 2px solid var(--error-color);
                  width: 100%;
                  box-sizing: border-box;
                `;
                errorCard.innerHTML = `
                  <ha-icon icon="mdi:alert" style="color: var(--error-color);"></ha-icon>
                  <span style="color: var(--error-color);">Error loading card: ${error.message}</span>
                `;
                cardsContainer.appendChild(errorCard);
              }
            }
          }
          sectionElement.appendChild(cardsContainer);
          sectionsContainer.appendChild(sectionElement);
        }
        viewElement.appendChild(sectionsContainer);
      }
      else if (viewConfig.cards && viewConfig.cards.length > 0) {
        log(`Creating ${viewConfig.cards.length} cards`);
        const transparentBg = container.dataset.transparentBackground === 'true';
        const singleCard = viewConfig.cards.length === 1;
        const cardsContainer = document.createElement('div');
        if (viewConfig.type === 'masonry' || !viewConfig.type) {
          cardsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));  /* ENDRET: Responsiv med max 100% */
            gap: 8px;
            padding: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          `;
        } else if (viewConfig.type === 'vertical-stack') {
          cardsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            width: 100%;
            box-sizing: border-box;
          `;
        } else {
          cardsContainer.style.cssText = `
            display: block;
            padding: 16px;
            width: 100%;
            box-sizing: border-box;
          `;
        }
        for (const cardConfig of viewConfig.cards) {
          try {
            log("Creating card:", cardConfig.type);
            const cardElement = await this.createCard(cardConfig, hass);
            if (cardElement) {
              cardsContainer.appendChild(cardElement);
            }
          } catch (error) {
            console.error('Error creating card:', error);
            const errorCard = document.createElement('div');
            errorCard.style.cssText = `
              background: var(--card-background-color);
              border-radius: 8px;
              padding: 16px;
              border: 2px solid var(--error-color);
              width: 100%;
              box-sizing: border-box;
            `;
            errorCard.innerHTML = `
              <ha-icon icon="mdi:alert" style="color: var(--error-color);"></ha-icon>
              <span style="color: var(--error-color);">Error loading card: ${error.message}</span>
            `;
            cardsContainer.appendChild(errorCard);
          }
        }
        viewElement.appendChild(cardsContainer);
      } else {
        log("No cards found in view config");
        log("View config structure:", JSON.stringify(viewConfig, null, 2));
        viewElement.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--secondary-text-color);">
            <ha-icon icon="mdi:view-dashboard-outline" style="--mdc-icon-size: 64px;"></ha-icon>
            <p>This view has no cards configured</p>
          </div>
        `;
      }
      container.appendChild(viewElement);
      this.adjustPopupWidth(viewConfig, container);
      this.observeContentHeight(container);
    }
    observeContentHeight(container) {
      const popupContainer = container.closest('.popup-container');
      if (!popupContainer) return;
      const maxHeightStr = popupContainer.style.maxHeight || '90vh';
      const maxHeightVh = parseInt(maxHeightStr) || 90;
      const overlay = popupContainer.closest('.subview-popup-overlay');
      const animationSpeed = parseInt(overlay?.dataset.animationSpeed) || 300;
      const doInitialEstimation = () => {
        const controls = popupContainer.querySelector('.popup-controls');
        const controlsHeight = controls ? controls.offsetHeight : 0;
        const contentHeight = container.scrollHeight;
        const totalNeededHeight = contentHeight + controlsHeight + 20;
        const maxAllowedHeight = (window.innerHeight * maxHeightVh) / 100;
        if (totalNeededHeight > maxAllowedHeight) {
          popupContainer.style.height = `${maxAllowedHeight}px`;
          container.style.overflowY = 'auto';
          log('Initial estimation: Content exceeds max height');
        } else {
          popupContainer.style.height = 'auto';
          container.style.overflowY = 'hidden';
          log('Initial estimation: Content fits');
        }
      };
      doInitialEstimation();
      setTimeout(() => {
        log('Starting ResizeObserver after animation completed');
        let isInitialLoad = true;
        let loadTimeout = setTimeout(() => {
          isInitialLoad = false;
        }, 1500);
        let resizeTimeout = null;
        let lastHeight = 0;
        const resizeObserver = new ResizeObserver((entries) => {
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }
          resizeTimeout = setTimeout(() => {
            for (let entry of entries) {
              const contentHeight = entry.contentRect.height;
              if (Math.abs(contentHeight - lastHeight) < 5 && !isInitialLoad) {
                return;
              }
              lastHeight = contentHeight;
              log(`ResizeObserver: Content height: ${contentHeight}px`);
              const controls = popupContainer.querySelector('.popup-controls');
              const controlsHeight = controls ? controls.offsetHeight : 0;
              const totalNeededHeight = contentHeight + controlsHeight + 20;
              const maxAllowedHeight = (window.innerHeight * maxHeightVh) / 100;
              if (totalNeededHeight > maxAllowedHeight) {
                popupContainer.style.height = `${maxAllowedHeight}px`;
                container.style.overflowY = 'auto';
                log('ResizeObserver: Content exceeds max height, setting fixed height with scroll');
              } else {
                popupContainer.style.height = 'auto';
                container.style.overflowY = 'hidden';
                log('ResizeObserver: Content fits, using auto height');
              }
              const existingTransition = popupContainer.style.transition || '';
              if (!existingTransition.includes('height')) {
                popupContainer.style.transition = existingTransition + 
                  (existingTransition ? ', ' : '') + 'height 0.2s ease';
              }
            }
          }, isInitialLoad ? 200 : 400);
        });
        resizeObserver.observe(container);
        if (overlay) {
          const originalRemove = overlay.remove;
          overlay.remove = function() {
            clearTimeout(loadTimeout);
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
            originalRemove.call(this);
          };
        }
      }, animationSpeed + 100);
    }
    adjustPopupWidth(viewConfig, contentContainer) {
      const popupContainer = contentContainer.closest('.popup-container');
      if (!popupContainer) return;
      let optimalWidth = '600px';
      let maxWidth = '90vw';
      if (viewConfig.type === 'sections' && viewConfig.sections) {
        const sectionCount = viewConfig.sections.length;
        log(`Adjusting width for ${sectionCount} sections`);
        if (sectionCount === 1) {
          optimalWidth = '600px';
          maxWidth = '90vw';
        } else if (sectionCount === 2) {
          optimalWidth = '1000px';
          maxWidth = '90vw';
        } else if (sectionCount >= 3) {
          optimalWidth = `${sectionCount * 400}px`;
          maxWidth = '90vw';
        }
      }
      else if (viewConfig.cards) {
        const cardCount = viewConfig.cards.length;
        if (viewConfig.type === 'vertical-stack') {
          optimalWidth = '600px';
        } else if (cardCount <= 2) {
          optimalWidth = '600px';
        } else if (cardCount <= 4) {
          optimalWidth = '900px';
        } else {
          optimalWidth = '1200px';
          maxWidth = '90vw';
        }
      }
      if (viewConfig.max_columns) {
        const columnWidth = 450;
        optimalWidth = `${viewConfig.max_columns * columnWidth}px`;
      }
      if (window.innerWidth < 768) {
        optimalWidth = '100vw';
        maxWidth = '100vw';
      } else if (window.innerWidth < 1024) {
        if (parseInt(optimalWidth) > 768) {
          maxWidth = '95vw';
        }
      }
      setTimeout(() => {
        popupContainer.style.width = optimalWidth;
        popupContainer.style.maxWidth = maxWidth;
      }, 50);
      log(`Popup width animated from 600px to: ${optimalWidth} (max: ${maxWidth})`);
    }
    async createCard(cardConfig, hass) {
      return new Promise((resolve) => {
        const createCardElement = customElements.get('hui-card');
        if (createCardElement) {
          const cardElement = document.createElement('hui-card');
          cardElement.hass = hass;
          cardElement.config = cardConfig;
          cardElement.style.cssText = `
            display: block;
            width: 100%;
            box-sizing: border-box;
          `;
          resolve(cardElement);
        } else {
          const fallbackCard = document.createElement('div');
          fallbackCard.style.cssText = `
            background: var(--card-background-color);
            border-radius: 8px;
            padding: 16px;
            box-shadow: var(--ha-card-box-shadow);
            width: 100%;
            box-sizing: border-box;
          `;
          fallbackCard.innerHTML = `
            <div style="color: var(--secondary-text-color);">
              <ha-icon icon="mdi:card-outline"></ha-icon>
              Card: ${cardConfig.type || 'Unknown'}
            </div>
          `;
          resolve(fallbackCard);
        }
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PopupView());
  } else {
    new PopupView();
    window.togglePopupDebug = () => {
      const popupView = window.__popupViewInstance;
      if (popupView) {
        return popupView.toggleDebugMode();
      }
      return false;
    };
  }
})();

