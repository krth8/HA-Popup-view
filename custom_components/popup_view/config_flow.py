"""Config flow for Popup View integration."""
import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class PopupViewConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Popup View."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors = {}

        # Check if already configured
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            # Create the integration entry
            return self.async_create_entry(
                title="Popup View",
                data={},
            )

        # Show form to confirm setup
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({}),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Get the options flow for this handler."""
        return PopupViewOptionsFlow(config_entry)


class PopupViewOptionsFlow(config_entries.OptionsFlow):
    """Handle options for Popup View."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        options = {
            vol.Optional(
                "debug_mode",
                default=self.config_entry.options.get("debug_mode", False),
            ): bool,
        }

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(options),
        )