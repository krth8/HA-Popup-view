
![bannervideo](https://github.com/user-attachments/assets/ebe77dd2-13c4-4859-8faa-dcefb703c14d)



</td>
</tr>
</table>

# Popup View 🎉
> Any view, from any dashboard as a popup

Hey everyone! 👋

I've been working on a custom component that lets you open any Home Assistant view as a popup overlay. Super useful for quick access to different dashboards without leaving your current view. This is something I have been wanting in Home Assistant for a while.

It works as a service call and this means you don't need declutter cards, or populate your dashboard with a bunch of hidden popup cards that muddies your view when in edit mode.

<img width="638" height="714" alt="services" src="https://github.com/user-attachments/assets/12821e88-245b-41e8-8547-3fae8d3f5d8e" />


## What it does
Opens any view from any dashboard in a sliding popup that comes up from the bottom. The popup automatically adjusts its width based on content and height to fit what's inside. Works great on both mobile and desktop!

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.



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
Call the service/Action `popup_view.open` with these options:

### Basic usage
```yaml
service: popup_view.open
data:
  view: weather  # or use path: /lovelace/weather
  title: "Weather Info"
```

## Features

### 📱 Display Devices
Choose which screens should show the popup  
**Tip:** Leave empty to show on current device only

**Supports:**
- Media players (📺 Cast, Browser Mod, Fully Kiosk)
- Notify services (📲 Companion Apps)
- Person entities (👤 Person-based displays)

### 🎯 Target View (picker)
The dashboard or view to display in the popup  
**Examples:** `weather`, `lights`, `security`, `climate`

### 📝 Popup Title
Header text for your popup  
Leave empty for a clean, title-free look  
**Example:** "🌤️ Weather Dashboard"

### ⚡ Animation Speed
How fast the popup appears/disappears
- **Smooth:** 300ms
- **Snappy:** 100ms
- **Instant:** 0ms
- **Range:** 0-2000ms in 50ms steps

### ⏱️ Auto-Close Timer - With Idle Detection
Popup closes automatically after this time  
Set to 0 to keep open until manually closed  
**Range:** 0-300 seconds in 5 second steps

### 🌫️ Background Blur
Creates a frosted glass effect behind the popup  
Adds depth and focus to your popup content

### 📏 Maximum Height
Limits how tall the popup can grow  
Content smaller than this will auto-fit perfectly  
**Range:** 10-100% in 5% steps

### 📍 Screen Position
Where the popup appears on your screen
- **Bottom:** Easy thumb reach
- **Center:** Focused view
- **Top:** Notification-style

### 👻 Transparent Background
Removes the popup container background  
Perfect for floating cards or minimal designs

## Service options
Since this runs as a service, this opens a lot of possibilities triggering and automations.

## Use Cases

### My Use Case
I now have a dedicated single view lovelace per kind of device. A mobile overview, and a wall tablet overview. Then I have all my "utility" popups that I might want to show on many devices, placed in a dedicated dashboard.

Security dashboard is nice to be able to open as a popup on all of these devices for instance.

### More use cases

#### 🏠 Room controls
Create dedicated room views with all lights, media players, and climate controls - then pop them up from anywhere. No need to duplicate cards across dashboards!

#### 🔐 Security panel
Have a security overview that pops up automatically when you arrive home (using automations). Check cameras, locks, and alarm status in one quick view.

#### 🎵 Media controls
Full media dashboard that's accessible from any room view. Great for whole-home audio control without cluttering your main dashboards.

#### 🛒 Shopping list
Pop up your shopping list from the kitchen dashboard when cooking. Add items without navigating away.

#### 📅 Calendar/agenda
Quick calendar view from any dashboard - great for checking schedules before leaving the house.

#### 🎨 Scene selector
A popup with all your scenes for different times of day. One tap from anywhere to set the mood.

#### 🚗 Garage/car status
Quick popup to check if garage is closed, car is locked, or charging status - right from your bedroom at night.

#### ☀️ Morning briefing
Automation that pops up weather, calendar, and commute info when motion detected in kitchen between 6-9am.

---

The beauty is you can keep your main dashboards clean and minimal, while having detailed views just a tap away!

Also works great with conditional cards - show different popups based on who's home, time of day, or device type.

## Contributing

**There will be bugs… Guaranteed. Let me know about them!**  
**More features? Let me know about that as well!**



