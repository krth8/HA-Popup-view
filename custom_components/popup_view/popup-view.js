(() => {
  
  const DEBUG_MODE = true; // SETT TIL TRUE FOR DEBUGGING
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

    // Legg dette øverst i PopupView class, rett etter constructor
    
    getOrCreateDeviceId() {
      console.log("🔍 Getting device ID...");
      
      // Prøv å hente eksisterende device ID
      let deviceId = localStorage.getItem('popup_view_device_id');
      
      if (!deviceId) {
        // Generer ny unik device ID
        deviceId = `popup_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('popup_view_device_id', deviceId);
        console.log("✨ Created new device ID:", deviceId);
      } else {
        console.log("✅ Found existing device ID:", deviceId);
      }
      
      return deviceId;
    }
    
    getDeviceFingerprint() {
      // Lag et fingerprint basert på browser/device karakteristikker
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
      // Session ID for denne tab/vindu sesjonen
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
      
      // Sjekk for Companion App
      if (window.webkit?.messageHandlers?.externalBus) {
        identification.companion = "iOS Companion App";
        console.log("📱 Detected iOS Companion App");
      } else if (window.externalApp) {
        identification.companion = "Android Companion App";
        console.log("📱 Detected Android Companion App");
      }
      
      // Sjekk for Browser Mod (hvis installert)
      const hass = document.querySelector('home-assistant')?.hass;
      if (hass?.states) {
        const browserModDevices = Object.keys(hass.states)
          .filter(entityId => entityId.startsWith('browser_mod.'));
        
        if (browserModDevices.length > 0) {
          console.log("🖥️ Browser Mod entities found:", browserModDevices);
          // Prøv å finne denne enhetens browser_mod ID
          // Dette krever mer logikk som vi kan legge til senere
          identification.browserMod = browserModDevices;
        }
      }
      
      console.log("=== DEVICE IDENTIFICATION COMPLETE ===");
      console.log("Full identification:", identification);
      
      return identification;
    }
    
    // Legg til disse funksjonene i PopupView class
    
    normalizeEntityId(entityId) {
      // Normaliser entity ID for sammenligning
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
      
      // Normaliser alle target displays
      const normalizedTargets = targetDisplays.map(d => this.normalizeEntityId(d));
      console.log("Normalized targets:", normalizedTargets);
      
      // Strategier for matching:
      const matchStrategies = [];
      
      // 1. Sjekk device ID direkte
      if (deviceInfo.deviceId) {
        const deviceIdMatch = normalizedTargets.some(target => 
          target.includes(deviceInfo.deviceId.toLowerCase())
        );
        matchStrategies.push({
          strategy: "Device ID",
          matched: deviceIdMatch
        });
      }
      
      // 2. Sjekk Companion App device tracker
      if (deviceInfo.companion) {
        const hass = document.querySelector('home-assistant')?.hass;
        if (hass?.states) {
          // Finn device_tracker entities som kan matche
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
      
      // 3. Sjekk Browser Mod entities
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
      
      // 4. Sjekk media_player entities (for cast devices, etc)
      const hass = document.querySelector('home-assistant')?.hass;
      if (hass?.states) {
        const mediaPlayers = Object.keys(hass.states)
          .filter(id => id.startsWith('media_player.'))
          .map(id => this.normalizeEntityId(id));
        
        // Sjekk om noen media players matcher vårt device fingerprint
        // Dette er vanskelig uten mer info, men vi logger det
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
      
      // Sjekk om noen strategi matchet
      console.log("Match strategies results:", matchStrategies);
      
      const anyMatch = matchStrategies.some(s => s.matched === true);
      
      console.log("=== DISPLAY MATCHING RESULT ===", anyMatch ? "✅ MATCH" : "❌ NO MATCH");
      
      return anyMatch;
    }

    closePopup(popup, animationSpeed = 300) {
      // Cleanup auto-close if it exists
      if (popup._cleanupAutoClose) {
        popup._cleanupAutoClose();
      }
      
      // Re-enable body scroll when popup closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      
      if (animationSpeed > 0) {
        const container = popup.querySelector('.popup-container');
        
        // Sett transition for overlay hvis den ikke allerede har det
        if (!popup.style.transition || !popup.style.transition.includes('opacity')) {
          popup.style.transition = `opacity ${animationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }
        
        // Animate både overlay og container
        popup.style.opacity = '0';
        
        if (container) {
          const alignment = popup.dataset.alignment || 'bottom';
          
          if (alignment === 'center') {
            // For center, scale ned og slide ned samtidig
            container.style.transform = 'translateY(100vh) scale(0.95)';
            container.style.webkitTransform = 'translateY(100vh) scale(0.95)';
          } else {
            // For top og bottom, bare slide ned
            container.style.transform = 'translateY(100vh)';
            container.style.webkitTransform = 'translateY(100vh)';
          }
        }
        
        // Vent på at animasjonen er ferdig før du fjerner elementet
        setTimeout(() => popup.remove(), animationSpeed);
      } else {
        popup.remove();
      }
    }

    setupEventListener() {
      log("=== SETTING UP EVENT LISTENER ===");
      
      // Wait for HA connection with longer timeout and better detection
      const checkHass = setInterval(() => {
        log("Checking for HASS connection...");
        const hass = document.querySelector('home-assistant')?.hass;
        if (hass?.connection && hass.states) {
          log("=== HASS CONNECTION FOUND ===");
          clearInterval(checkHass);
          
          // Get current user info - IMPROVED VERSION
          let currentUser = null;
          let normalizedUser = null;
    
          // Try multiple methods to get current user
          if (hass) {
            // Method 1: Direct user property
            if (hass.user?.name) {
              currentUser = hass.user.name;
            }
            // Method 2: From connection user
            else if (hass.connection?.user?.name) {
              currentUser = hass.connection.user.name;
            }
            // Method 3: From auth/user info
            else if (hass.auth?.data?.user?.name) {
              currentUser = hass.auth.data.user.name;
            }
            // Method 4: Check localStorage for user info
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
            
            // Method 5: Try to get from panel URL or other sources
            if (!currentUser) {
              // Check if we can get user from any other hass properties
              console.debug("Available hass properties:", Object.keys(hass));
              console.debug("User-related data:", {
                user: hass.user,
                auth: hass.auth?.data,
                connection: hass.connection?.user
              });
            }
          }
    
          // Normalize the username if we found one
          if (currentUser) {
            normalizedUser = currentUser.toLowerCase().replace(/\s+/g, '_');
            log("Current HA user:", currentUser, "Normalized:", normalizedUser);
          } else {
            console.warn("Could not determine current user - popup targeting may not work");
            console.debug("Available hass object:", hass);
          }
          
          // Erstatt hele subscribeEvents delen i setupEventListener funksjonen med dette:
          
          // Subscribe to popup events
          hass.connection.subscribeEvents((event) => {
            console.log("=== POPUP EVENT RECEIVED ===");
            console.log("Event data:", event.data);
            
            // Identifiser denne enheten
            const deviceInfo = this.identifyThisDevice();
            
            const { displays, is_tap_action } = event.data;
            
            // Bestem om vi skal vise popup
            let shouldShowPopup = false;
            let reason = "";
            
            // Scenario 1: Tap action uten displays = vis kun på triggerende enhet
            if (is_tap_action && (!displays || displays.length === 0)) {
              console.log("📱 TAP ACTION detected without displays");
              
              // For tap actions, sjekk session ID
              // Vi må finne en måte å matche session på
              // Foreløpig: vis alltid for tap actions på samme enhet
              shouldShowPopup = true;
              reason = "Tap action on this device";
              
              console.log("✅ Showing popup for tap action");
            }
            // Scenario 2: Displays er spesifisert = sjekk om vi matcher
            else if (displays && displays.length > 0) {
              console.log("🎯 TARGETED DISPLAY mode");
              console.log("Checking if this device matches targets...");
              
              shouldShowPopup = this.matchesTargetDisplay(displays, deviceInfo);
              reason = shouldShowPopup ? "Device matches target displays" : "Device does not match targets";
            }
            // Scenario 3: Ingen displays og ikke tap action = broadcast til alle
            else {
              console.log("📢 BROADCAST mode - no displays specified");
              shouldShowPopup = true;
              reason = "Broadcast to all devices";
            }
            
            // Vis eller ikke vis popup basert på logikken
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
      
      // Fallback timeout after 10 seconds
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
      
      // Remove any existing popup
      document.querySelector('.subview-popup-overlay')?.remove();
      
      // LEGG TIL: Disable body scroll when popup opens
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    
      // Create popup overlay
      const popup = document.createElement('div');
      popup.className = 'subview-popup-overlay';
      popup.dataset.alignment = alignment;
      popup.dataset.animationSpeed

      
      // Calculate alignment styles
      let overlayAlignment = 'flex-end'; // default for bottom
      
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
      
      // Create main container
      const container = document.createElement('div');
      container.className = 'popup-container';
      
      // Adjust border radius based on alignment
      let borderRadius = '12px 12px 0 0'; // default for bottom
      if (alignment === 'center') {
        borderRadius = '12px';
      } else if (alignment === 'top') {
        borderRadius = '0 0 12px 12px';
      }
      
      // Calculate effective height
      const effectivePopupHeight = popupHeight === 100 ? '100vh' : `${popupHeight}vh`;
      
      // Start with narrow width, will expand if needed after content loads
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
            
      // Create controls header - ALLTID transparent
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
      
      // Title element - ALLTID med bakgrunn-pill
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
      
      // Close button - ALLTID med bakgrunn-sirkel
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
      
      // Add hover effect
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'var(--secondary-background-color)';
        closeBtn.style.transform = 'scale(1.1)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.transform = 'scale(1)';
      });
      
      controls.appendChild(closeBtn);
      
      // Create content area - VIKTIG: Sett overflow-x
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
      
      // Pass transparentBackground to view creation
      content.dataset.transparentBackground = transparentBackground;
      
      // Assemble container with controls at top and content below
      container.appendChild(controls);
      container.appendChild(content);
      popup.appendChild(container);
      document.body.appendChild(popup);
      
      // Trigger animation
      if (animationSpeed > 0) {
        // Force browser to calculate initial state
        popup.offsetHeight;
        container.offsetHeight;
        
        // Use double requestAnimationFrame for better mobile support
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
      
      // Auto close timer
      // Auto close timer with idle detection
      if (autoClose > 0) {
        let closeTimer = null;
        let lastActivity = Date.now();
        
        const resetTimer = () => {
          lastActivity = Date.now();
          if (closeTimer) {
            clearTimeout(closeTimer);
          }
          
          closeTimer = setTimeout(() => {
            // Check if there was recent activity
            const timeSinceActivity = Date.now() - lastActivity;
            if (timeSinceActivity < 1000) {
              // Recent activity detected, reset timer
              log("Recent activity detected, resetting auto-close timer");
              resetTimer();
            } else {
              // No recent activity, close popup
              log("Auto-closing popup after idle timeout");
              this.closePopup(popup, animationSpeed);
            }
          }, autoClose * 1000);
          
          log(`Auto-close timer reset: ${autoClose} seconds`);
        };
        
        // Activity events to track
        const activityEvents = [
          'mousedown', 'mousemove', 'mouseenter',
          'touchstart', 'touchmove',
          'scroll', 'wheel',
          'keydown', 'click'
        ];
        
        // Handler for activity
        const handleActivity = (e) => {
          // Only reset if activity is within the popup
          if (popup.contains(e.target)) {
            resetTimer();
          }
        };
        
        // Add activity listeners to popup
        activityEvents.forEach(eventType => {
          popup.addEventListener(eventType, handleActivity, { passive: true });
        });
        
        // Also track scroll in content area specifically
        content.addEventListener('scroll', handleActivity, { passive: true });
        
        // Start the initial timer
        resetTimer();
        
        // Store cleanup function for when popup closes
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
      
      // Close on escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          this.closePopup(popup, animationSpeed);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      // Close on outside click
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          this.closePopup(popup, animationSpeed);
        }
      });
      
      // Load view content with improved error handling and navigation
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
      // Better method to find Lovelace instance
      const hass = document.querySelector('home-assistant');
      if (!hass) {
        throw new Error('Home Assistant element not found');
      }

      // Wait for Lovelace to be available
      await this.waitForLovelace();
      
      // Navigate to the view first to ensure it's loaded
      if (subviewPath.startsWith('/')) {
        // Don't use pushState as it causes issues with cross-dashboard navigation
        // Just ensure we have the right config loaded
        log("Loading view from path:", subviewPath);
      }
      
      // Parse path to determine dashboard and view
      let pathParts = subviewPath.split('/').filter(p => p);
      log("Original path parts:", pathParts);
      
      let dashboardUrl = 'lovelace'; // default dashboard
      let viewPath = '';
      
      // Handle different path formats
      if (pathParts.length === 1) {
        // Just view name, use default dashboard
        viewPath = pathParts[0];
      } else if (pathParts.length >= 2) {
        // Dashboard and view specified
        dashboardUrl = pathParts[0];
        viewPath = pathParts[1];
      }
      
      log("Dashboard:", dashboardUrl);
      log("View path:", viewPath);
      log("Full path received:", subviewPath);
      
      // Get the correct Lovelace config based on dashboard
      log(`Attempting to get config for dashboard: ${dashboardUrl}`);
      const lovelaceConfig = await this.getLovelaceConfig(dashboardUrl);
      log("Config received:", lovelaceConfig);
      if (!lovelaceConfig) {
        throw new Error(`Could not get configuration for dashboard: ${dashboardUrl}`);
      }
      
      // Find view configuration
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
        // Try by index
        const index = parseInt(viewPath);
        if (!isNaN(index) && views[index]) {
          viewConfig = views[index];
          viewIndex = index;
          log(`Found view by index: ${index}`);
        }
      }
      
      if (!viewConfig) {
        // Try without path (for first view)
        if (viewPath === '' && views[0]) {
          viewConfig = views[0];
          viewIndex = 0;
        } else {
          // Check if view exists but with different path format
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
      
      // Clear loading
      contentElement.innerHTML = '';
      
      // Create view element using a more reliable method
      await this.createViewElement(viewConfig, viewIndex, contentElement);
      
      log("View element created successfully");
    }

    async waitForLovelace(timeout = 5000) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const hass = document.querySelector('home-assistant');
        // Check if ANY dashboard is loaded, not specifically lovelace
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
        // Always use websocket to get the correct dashboard config
        let response;
        
        if (dashboardUrl && dashboardUrl !== 'lovelace') {
          log(`Fetching config for custom dashboard: ${dashboardUrl}`);
          response = await hass.connection.sendMessagePromise({
            type: 'lovelace/config',
            url_path: dashboardUrl
          });
        } else {
          // For default lovelace dashboard
          log("Fetching default lovelace config");
          response = await hass.connection.sendMessagePromise({
            type: 'lovelace/config'
            // No url_path means default lovelace
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
      
      // Create a simplified view renderer with full width
      const viewElement = document.createElement('div');
      viewElement.style.cssText = `
        width: 100%; 
        max-width: 100%;  /* VIKTIG: Forhindre at innhold går utenfor */
        height: 100%; 
        box-sizing: border-box;
        overflow-x: hidden;  /* Skjul evt overflow */
      `;
      
      // Handle sections view type
      if (viewConfig.type === 'sections' && viewConfig.sections) {
        log(`Creating sections view with ${viewConfig.sections.length} sections`);
        
        const transparentBg = container.dataset.transparentBackground === 'true';
        const singleSection = viewConfig.sections.length === 1;
        
        // Create sections container with horizontal layout
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
        
        // Create each section
        for (const section of viewConfig.sections) {
          const sectionElement = document.createElement('div');
          sectionElement.style.cssText = `
            width: 100%;
            box-sizing: border-box;
          `;
          
          // Add section title if exists
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
          
          // Create cards container for this section
          const cardsContainer = document.createElement('div');
          cardsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          `;
          
          // Create cards in this section
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
      // Handle traditional card-based views
      else if (viewConfig.cards && viewConfig.cards.length > 0) {
        log(`Creating ${viewConfig.cards.length} cards`);
        
        const transparentBg = container.dataset.transparentBackground === 'true';
        const singleCard = viewConfig.cards.length === 1;
        
        // Create cards container
        const cardsContainer = document.createElement('div');
        
        // Apply view-level styling if any
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
        
        // Create each card
        for (const cardConfig of viewConfig.cards) {
          try {
            log("Creating card:", cardConfig.type);
            const cardElement = await this.createCard(cardConfig, hass);
            if (cardElement) {
              cardsContainer.appendChild(cardElement);
            }
          } catch (error) {
            console.error('Error creating card:', error);
            // Create error card
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
      
      // Auto-adjust popup width based on content
      this.adjustPopupWidth(viewConfig, container);
      
      // Auto-adjust height based on content with observer
      this.observeContentHeight(container);
    }

    observeContentHeight(container) {
      const popupContainer = container.closest('.popup-container');
      if (!popupContainer) return;
      
      // Get the configured max height from the container's style
      const maxHeightStr = popupContainer.style.maxHeight || '90vh';
      const maxHeightVh = parseInt(maxHeightStr) || 90;
      
      // Get animation speed to know when to start observing
      const overlay = popupContainer.closest('.subview-popup-overlay');
      const animationSpeed = parseInt(overlay?.dataset.animationSpeed) || 300;
      
      // INITIAL ESTIMATION - Do a quick one-time height calculation
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
      
      // Do initial estimation immediately
      doInitialEstimation();
      
      // DELAYED OBSERVER - Wait for animation to complete before starting observer
      setTimeout(() => {
        log('Starting ResizeObserver after animation completed');
        
        // Track if we're in the initial load phase after animation
        let isInitialLoad = true;
        let loadTimeout = setTimeout(() => {
          isInitialLoad = false;
        }, 1500);
        
        // Debounce resize updates
        let resizeTimeout = null;
        let lastHeight = 0;
        
        // Create ResizeObserver to watch content changes
        const resizeObserver = new ResizeObserver((entries) => {
          // Clear any pending resize
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }
          
          // Debounce rapid changes
          resizeTimeout = setTimeout(() => {
            for (let entry of entries) {
              const contentHeight = entry.contentRect.height;
              
              // Ignore tiny changes (less than 5px)
              if (Math.abs(contentHeight - lastHeight) < 5 && !isInitialLoad) {
                return;
              }
              
              lastHeight = contentHeight;
              log(`ResizeObserver: Content height: ${contentHeight}px`);
              
              // Calculate the total needed height
              const controls = popupContainer.querySelector('.popup-controls');
              const controlsHeight = controls ? controls.offsetHeight : 0;
              const totalNeededHeight = contentHeight + controlsHeight + 20;
              
              // Calculate max allowed height based on viewport
              const maxAllowedHeight = (window.innerHeight * maxHeightVh) / 100;
              
              // Only set explicit height if content exceeds max
              if (totalNeededHeight > maxAllowedHeight) {
                // Content too tall - set fixed height with scroll
                popupContainer.style.height = `${maxAllowedHeight}px`;
                container.style.overflowY = 'auto';
                log('ResizeObserver: Content exceeds max height, setting fixed height with scroll');
              } else {
                // Content fits - use auto height
                popupContainer.style.height = 'auto';
                container.style.overflowY = 'hidden';
                log('ResizeObserver: Content fits, using auto height');
              }
              
              // Behold eksisterende transitions og legg til height
              const existingTransition = popupContainer.style.transition || '';
              if (!existingTransition.includes('height')) {
                popupContainer.style.transition = existingTransition + 
                  (existingTransition ? ', ' : '') + 'height 0.2s ease';
              }
            }
          }, isInitialLoad ? 200 : 400);
        });
        
        // Start observing
        resizeObserver.observe(container);
        
        // Cleanup observers when popup closes
        if (overlay) {
          const originalRemove = overlay.remove;
          overlay.remove = function() {
            clearTimeout(loadTimeout);
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
            originalRemove.call(this);
          };
        }
      }, animationSpeed + 100); // Wait for animation plus a small buffer
    }

    // Og oppdater adjustPopupWidth funksjonen for å ikke lenger justere controls:
    adjustPopupWidth(viewConfig, contentContainer) {
      const popupContainer = contentContainer.closest('.popup-container');
      if (!popupContainer) return;
      
      // Start from narrow and expand as needed
      let optimalWidth = '600px'; // Default narrow width
      let maxWidth = '90vw'; // Always constrain to viewport
      
      // Check if view has sections
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
      // Check traditional card views
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
      
      // Check for max_columns in view config
      if (viewConfig.max_columns) {
        const columnWidth = 450;
        optimalWidth = `${viewConfig.max_columns * columnWidth}px`;
      }
      
      // Apply responsive adjustments
      if (window.innerWidth < 768) {
        optimalWidth = '100vw';
        maxWidth = '100vw';
      } else if (window.innerWidth < 1024) {
        if (parseInt(optimalWidth) > 768) {
          maxWidth = '95vw';
        }
      }
      
      // Apply the calculated width with a slight delay for smooth animation
      setTimeout(() => {
        popupContainer.style.width = optimalWidth;
        popupContainer.style.maxWidth = maxWidth;
      }, 50);
      
      log(`Popup width animated from 600px to: ${optimalWidth} (max: ${maxWidth})`);
    }

    async createCard(cardConfig, hass) {
      return new Promise((resolve) => {
        // Use Home Assistant's card creation system
        const createCardElement = customElements.get('hui-card');
        if (createCardElement) {
          const cardElement = document.createElement('hui-card');
          cardElement.hass = hass;
          cardElement.config = cardConfig;
          
          // Add full width styling
          cardElement.style.cssText = `
            display: block;
            width: 100%;
            box-sizing: border-box;
          `;
          
          resolve(cardElement);
        } else {
          // Fallback: create a basic card representation
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

  // Initialize when DOM is ready
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
