![bannervideo](https://github.com/user-attachments/assets/ebe77dd2-13c4-4859-8faa-dcefb703c14d)

# Popup View 🎉
> Any view, from any dashboard as a popup

Reference views from anywhere with service calls through tap actions or automations! A nice way to tidy up your dashboards and keeping clear of duplicate cards/views.

![services](https://github.com/user-attachments/assets/12821e88-245b-41e8-8547-3fae8d3f5d8e)

## What it does
Opens any view from any dashboard in a sliding popup. The popup automatically adjusts its width based on content and height to fit what's inside. Works great on both mobile and desktop!

## Installation

<details>
<summary>📦 <b>Via HACS (Recommended)</b></summary>

1. Open HACS in your Home Assistant instance
2. Click on "Integrations"
3. Click the three dots in the top right corner and select "Custom repositories"
4. Add this repository URL: `https://github.com/YOUR_USERNAME/popup-view`
5. Select "Integration" as the category
6. Click "Add"
7. Find "Popup View" in the integrations list and click "Download"
8. Restart Home Assistant
9. Add the integration in Settings->Devices & services.

</details>

<details>
<summary>🔧 <b>Manual Installation</b></summary>

1. Copy the `popup_view` folder to your `custom_components` directory
2. Restart Home Assistant
3. Done! No configuration needed

</details>


## How to use it

Call the service `popup_view.open` with these options:

```yaml
action: popup_view.open
data:
  animation_speed: 300
  auto_close: 0
  background_blur: true
  popup_height: 90
  alignment: center
  transparent_background: false
  view: popup-utility-views/calendar
  displays:
    device_id: person.batman
  title: Calendar

```

> [!TIP]
> **You can test the service directly from Developer Tools → Services to see it in action!** 


### Features
✨ **Highlight:** Transparent background is perfect for single card views | ✨ **Highlight:** Height auto-adjusts to content
:---: | :---:
![ezgif-7acf07a460c663](https://github.com/user-attachments/assets/8c233d27-a8d4-4384-ac4c-594d62f712ec) | ![demo](https://github.com/user-attachments/assets/71047483-51f2-433e-b6b7-7a5664da8bf3)

### 📱 Display Devices
Popup View uses **user-based targeting**. When you select a device (like `specificperson_pixelphone`), the popup will appear on:
- ALL devices where user "specificperson" is logged in
- This includes phones, tablets, and browsers logged in as that user

This approach ensures consistent behavior across all your devices without complex device identification. (trying to figure out how to do device specific targeting)

### Examples:
- `notify.mobile_app_batman` → Shows on all Batmans's devices
- `person.batman` → Same as above
**Tip:** Leave empty to show on current device only

### 🎯 Target View
The dashboard or view to display in the popup  
**Examples:** `lovelace/calendar`

### 📝 Popup Title
Header text for your popup. Leave empty for a clean, title-free look.  
**Example:** "🌤️ Weather Dashboard"

### ⚡ Animation Duration
The time it takes for the popup to fully appear
- **Smooth:** 300ms
- **Snappy:** 100ms
- **Instant:** 0ms

### ⏱️ Auto-Close Timer
Popup closes automatically after this time. Includes idle detection that resets on user interaction.

### 🌫️ Background Blur
Creates a frosted glass effect behind the popup. Adds depth and focus to your popup content.

### 📏 Maximum Height
Limits how tall the popup can grow. Content smaller than this will auto-fit perfectly.  

### 📍 Screen Position
Where the popup appears on your screen:
- **Bottom:** Easy thumb reach
- **Center:** Focused view
- **Top:** Notification-style

### 👻 Transparent Background
Removes the popup container background. Perfect for floating cards or minimal designs.

## Example Use Cases

### 🏌️ My Use Case
I keep all my views that i would like as a popup in a separate dashboard. This way i can keep things nice and organized. 

### 🏠 Room controls
Create dedicated room views with all lights, media players, and climate controls - then pop them up from anywhere. No need to duplicate cards across dashboards!

### 🔐 Security panel
Have a security overview that pops up automatically when you arrive home (using automations). Check cameras, locks, and alarm status in one quick view.

### 🎵 Media controls
Full media dashboard that's accessible from any room view. Great for whole-home audio control without cluttering your main dashboards.

### 🛒 Shopping list
Pop up your shopping list from the kitchen dashboard when cooking. Add items without navigating away.

### 📅 Calendar/agenda
Quick calendar view from any dashboard - great for checking schedules before leaving the house.

### 🎨 Scene selector
A popup with all your scenes for different times of day. One tap from anywhere to set the mood.

### 🚗 Garage/car status
Quick popup to check if garage is closed, car is locked, or charging status - right from your bedroom at night.

### ☀️ Morning briefing
Automation that pops up weather, calendar, and commute info when motion detected in kitchen between 6-9am.

## Why use this?
The beauty is you can keep your main dashboards clean and minimal, while having detailed views just a tap away! Also works great with conditional cards - show different popups based on who's home, time of day, or device type.

## Contributing

> [!WARNING]
> **There will be bugs… Guaranteed.** 
> **Let me know about them!**


> [!IMPORTANT]
> **More features?**
**Let me know about that as well!**

