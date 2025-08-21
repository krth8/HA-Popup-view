![bannervideo](https://github.com/user-attachments/assets/ebe77dd2-13c4-4859-8faa-dcefb703c14d)

# Popup View 🎉
> Any view, from any dashboard as a popup

Hey everyone! 👋

I've been working on a custom component that lets you open any Home Assistant view as a popup overlay. Super useful for quick access to different dashboards without leaving your current view. This is something I have been wanting in Home Assistant for a while.

It works as a service call which is a very clean way of having hidden content.

![services](https://github.com/user-attachments/assets/12821e88-245b-41e8-8547-3fae8d3f5d8e)

## What it does
Opens any view from any dashboard in a sliding popup that comes up from the bottom. The popup automatically adjusts its width based on content and height to fit what's inside. Works great on both mobile and desktop!

## Installation

### Via HACS (Recommended)
1. Open HACS in your Home Assistant instance
2. Click on "Integrations"
3. Click the three dots in the top right corner and select "Custom repositories"
4. Add this repository URL: `https://github.com/YOUR_USERNAME/popup-view`
5. Select "Integration" as the category
6. Click "Add"
7. Find "Popup View" in the integrations list and click "Download"
8. Restart Home Assistant

### Manual Installation
1. Copy the `popup_view` folder to your `custom_components` directory
2. Restart Home Assistant
3. Done! No configuration needed

## How to use it

Call the service `popup_view.open` with these options:

```yaml
service: popup_view.open
data:
  view: weather  # or use path: /lovelace/weather
  title: "Weather Info"
```

💡 **Tip:** You can test the service directly from Developer Tools → Services to see it in action!

## Features

✨ **Highlight:** Transparent background is perfect for single card views

![ezgif-7acf07a460c663](https://github.com/user-attachments/assets/8c233d27-a8d4-4384-ac4c-594d62f712ec)

✨ **Highlight:** Height auto-adjusts to content

![demo](https://github.com/user-attachments/assets/71047483-51f2-433e-b6b7-7a5664da8bf3)

### 📱 Display Devices
Choose which screens should show the popup  
**Tip:** Leave empty to show on current device only

**Supports:**
- Notify services (📲 Companion Apps)
- Person entities (👤 Person-based displays)
- Device Tracker (👥 Show on specific user devices)

### 🎯 Target View
The dashboard or view to display in the popup  
**Examples:** `weather`, `lights`, `security`, `climate`

### 📝 Popup Title
Header text for your popup. Leave empty for a clean, title-free look.  
**Example:** "🌤️ Weather Dashboard"

### ⚡ Animation Speed
How fast the popup appears/disappears
- **Smooth:** 300ms
- **Snappy:** 100ms
- **Instant:** 0ms
- **Range:** 0-2000ms in 50ms steps

### ⏱️ Auto-Close Timer
Popup closes automatically after this time. Includes idle detection!  
Set to 0 to keep open until manually closed.  
**Range:** 0-300 seconds in 5 second steps

### 🌫️ Background Blur
Creates a frosted glass effect behind the popup. Adds depth and focus to your popup content.

### 📏 Maximum Height
Limits how tall the popup can grow. Content smaller than this will auto-fit perfectly.  
**Range:** 10-100% in 5% steps

### 📍 Screen Position
Where the popup appears on your screen:
- **Bottom:** Easy thumb reach
- **Center:** Focused view
- **Top:** Notification-style

### 👻 Transparent Background
Removes the popup container background. Perfect for floating cards or minimal designs.

## Example Use Cases

### 🏌️ My Use Case
I now have a dedicated single view lovelace per kind of device. A mobile overview, and a wall tablet overview. Then I have all my "utility" popups that I might want to show on many devices, placed in a dedicated dashboard.

Security dashboard is nice to be able to open as a popup on all of these devices for instance.

### More use cases

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

⚠️ **There will be bugs… Guaranteed!**  
Let me know about them!

💡 **More features?**  
Let me know about that as well!
