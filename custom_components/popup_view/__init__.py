"""Popup View Component for Home Assistant."""
import logging
from pathlib import Path
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.frontend import add_extra_js_url
from .const import DOMAIN
_LOGGER = logging.getLogger(__name__)
SERVICE_OPEN = "open"
ATTR_PATH = "path"
ATTR_TITLE = "title"
ATTR_VIEW = "view"
ATTR_DISPLAYS = "displays"
ATTR_ANIMATION_SPEED = "animation_speed"
ATTR_AUTO_CLOSE = "auto_close"
ATTR_BACKGROUND_BLUR = "background_blur"
ATTR_POPUP_HEIGHT = "popup_height"
ATTR_ALIGNMENT = "alignment"
ATTR_TRANSPARENT_BACKGROUND = "transparent_background"
SERVICE_OPEN_SCHEMA = vol.Schema({
    vol.Optional(ATTR_DISPLAYS): vol.Any(
        cv.entity_ids,
        cv.entity_id,
        cv.string
    ),
    vol.Optional(ATTR_PATH): cv.string,
    vol.Optional(ATTR_VIEW): cv.string,
    vol.Optional(ATTR_TITLE, default=""): cv.string,
    vol.Optional(ATTR_ANIMATION_SPEED, default=300): vol.Coerce(int),
    vol.Optional(ATTR_AUTO_CLOSE, default=0): vol.Coerce(int),
    vol.Optional(ATTR_BACKGROUND_BLUR, default=False): cv.boolean,
    vol.Optional(ATTR_POPUP_HEIGHT, default=90): vol.All(vol.Coerce(int), vol.Range(min=10, max=100)),
    vol.Optional(ATTR_ALIGNMENT, default="bottom"): vol.In(["bottom", "center", "top"]),
    vol.Optional(ATTR_TRANSPARENT_BACKGROUND, default=False): cv.boolean,
})
async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Popup View component from YAML."""
    return True
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Popup View from a config entry."""
    _LOGGER.info("Setting up Popup View component from config entry")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {}
    await _setup_popup_view(hass)
    entry.async_on_unload(entry.add_update_listener(update_listener))
    return True
async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id)
    if not hass.data[DOMAIN]:
        hass.services.async_remove(DOMAIN, SERVICE_OPEN)
    return True
async def update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)
async def _setup_popup_view(hass: HomeAssistant) -> None:
    """Set up the popup view functionality."""
    if hass.services.has_service(DOMAIN, SERVICE_OPEN):
        _LOGGER.debug("Services already registered, skipping")
        return
    async def handle_open_popup(call: ServiceCall) -> None:
        """Handle the open popup service call."""
        path = call.data.get(ATTR_PATH)
        view = call.data.get(ATTR_VIEW)
        title = call.data.get(ATTR_TITLE, "")
        animation_speed = call.data.get(ATTR_ANIMATION_SPEED, 300)
        auto_close = call.data.get(ATTR_AUTO_CLOSE, 0)
        background_blur = call.data.get(ATTR_BACKGROUND_BLUR, False)
        popup_height = call.data.get(ATTR_POPUP_HEIGHT, 90)
        alignment = call.data.get(ATTR_ALIGNMENT, "bottom")
        transparent_background = call.data.get(ATTR_TRANSPARENT_BACKGROUND, False)
        displays = call.data.get(ATTR_DISPLAYS)
        if view and not path:
            if view.startswith('/'):
                path = view
            elif "/" in view:
                path = f"/{view}"
            else:
                path = f"/lovelace/{view}"
        if path and not path.startswith('/'):
            path = f"/{path}"
        if not path:
            _LOGGER.error("Either 'path' or 'view' must be specified")
            return
        if displays and isinstance(displays, str):
            displays = [displays]
        _LOGGER.debug(f"Service called with data: {call.data}")
        _LOGGER.info(f"Opening popup: {path} with title: {title}")
        if displays:
            _LOGGER.info(f"Target displays: {displays}")
        event_data = {
            "path": path,
            "title": title,
            "animation_speed": animation_speed,
            "auto_close": auto_close,
            "background_blur": background_blur,
            "popup_height": popup_height,
            "alignment": alignment,
            "transparent_background": transparent_background
        }
        if displays:
            event_data["displays"] = displays
        if call.context and call.context.user_id and not displays:
            event_data["is_tap_action"] = True
            _LOGGER.info("Tap action detected - will only show on triggering device")
        hass.bus.async_fire("popup_view_open", event_data)
    hass.services.async_register(
        DOMAIN,
        SERVICE_OPEN,
        handle_open_popup,
        schema=SERVICE_OPEN_SCHEMA
    )
    integration_dir = Path(__file__).parent
    _LOGGER.debug(f"Integration directory: {integration_dir}")
    js_file = integration_dir / "popup-view.js"
    if not js_file.exists():
        _LOGGER.error(f"JavaScript file not found at: {js_file}")
        _LOGGER.error(f"Directory contents: {list(integration_dir.iterdir())}")
    else:
        _LOGGER.info(f"JavaScript file found: {js_file}")
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"/{DOMAIN}_static",
            path=str(integration_dir.absolute()),
            cache_headers=False
        )
    ])
    js_url = f"/{DOMAIN}_static/popup-view.js"
    import time
    js_url_versioned = f"{js_url}?cachebust={int(time.time())}"
    add_extra_js_url(hass, js_url_versioned)
    _LOGGER.info(f"Popup View initialized. JS should be available at: {js_url}")
    _LOGGER.info(f"Full URL with cache bust: {js_url_versioned}")
