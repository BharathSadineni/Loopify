# 🎵 **Loopify** - The First Mini Player with Custom Loop Control

<div align="center">

![Loopify Logo](capy-in-currents.ico)

**The revolutionary mini player that lets you control exactly how many times you want a song to loop!**

[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/en-us/windows)
[![Spotify](https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white)](https://spotify.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)

</div>

---

## 🚀 **What is Loopify?**

**Loopify** is the **first mini player** that solves the age-old problem of Spotify's limited loop options. Instead of struggling between "Loop Off", "Playlist Loop", and "Loop One Song Forever", Loopify gives you **precise control** over how many times you want a song to repeat.

<div align="center">

### **Widget States**

![Loopify Hover Mode](Loopify%20Hover.png)
*Expanded widget with full controls*

![Loopify Minimized Mode](Loopify%20minimized.png)
*Minimized widget showing song info*

![Loopify Inactive Mode](Loopify%20Inactive.png)
*Inactive state - just a status dot*

</div>

### ✨ **Key Features**

- 🎯 **Custom Loop Count**: Set exactly how many times you want a song to loop (1, 2, 3, 5, 10, or infinite!)
- 🎵 **Spotify Integration**: Seamlessly controls your Spotify playback
- 🖥️ **Floating Widget**: Always-on-top mini player that doesn't interfere with your work
- 🎛️ **Media Controls**: Play/pause, next/previous, volume control, mute
- 🎨 **Beautiful UI**: Modern, glassmorphic design with smooth animations
- 🔄 **Smart Loop Detection**: Automatically detects when a song ends and restarts it
- 📱 **Desktop Shortcut**: One-click launch from your desktop
- 🎪 **Drag & Drop**: Move the widget anywhere on your screen
- 👁️ **Smart Auto-Hide**: Widget disappears into a tiny dot when inactive to save screen space
- 🟢 **Status Indicator**: Green dot when playing, grey when paused - always visible for quick status check
- 🖱️ **Hover to Reveal**: Simply hover over the dot area to bring the full widget back

---

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Windows 10/11
- Python 3.8 or higher
- Node.js 16 or higher
- Spotify account
- Spotify running (web or desktop app)

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/yourusername/loopify.git
cd loopify
```

### **Step 2: Create Spotify App**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create App"**
3. Fill in the following details:

| Field | Value |
|-------|-------|
| **App name** | `Loopify` |
| **App description** | `A mini player with custom loop control for Spotify` |
| **Redirect URIs** | `http://127.0.0.1:8888/callback` |

4. Select **"Web API"** under "Which API/SDKs are you planning to use?"
5. Accept the terms and click **"Create App"**
6. Copy your **Client ID** and **Client Secret**

### **Step 3: Environment Setup**
1. Create a `.env` file in the project root:
```bash
touch .env
```

2. Add your Spotify credentials to the `.env` file:
```env
SPOTIPY_CLIENT_ID=your_client_id_here
SPOTIPY_CLIENT_SECRET=your_client_secret_here
SPOTIPY_REDIRECT_URI=http://127.0.0.1:8888/callback
```

### **Step 4: Install Dependencies**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

### **Step 5: Build the Application**
```bash
# Run the build script
./build.ps1
```

This will:
- Create `loopify.exe` in the project directory
- Create a desktop shortcut called "Loopify"

---

## 🎮 **How to Use**

### **First Launch**
1. **Double-click** the "Loopify" shortcut on your desktop
2. A terminal window will open - **minimize it** (don't close it!)
3. The Loopify widget will appear on your screen
4. **First time users**: Login to your Spoitify account from the redirected browser
5. **Authorize Loopify** in your browser when prompted
6. **Grant permissions** to control your Spotify playback

### **Daily Usage**
1. **Make sure Spotify is running** (web or desktop app)
2. **Double-click** the "Loopify" desktop shortcut
3. **Minimize the terminal** that opens
4. **Use the widget** to control your music!

### **Widget Controls**
- 🎵 **Click the widget** to expand/collapse
- 🎮 **Media buttons**: Play/pause, next, previous, volume
- 🔄 **Loop button**: Cycle through loop modes (Off → Playlist → Song)
- ➕ **Plus/Minus**: Adjust song loop count when in "Song" mode
- 🖱️ **Drag**: Move the widget anywhere on screen

<div align="center">

**Widget Interaction Flow:**

![Inactive → Hover → Minimized](Loopify%20Inactive.png) → ![Hover State](Loopify%20Hover.png) → ![Minimized State](Loopify%20minimized.png)

*Inactive dot → Hover to expand → Minimized with info*

</div>

---

## 🎯 **Loop Modes Explained**

| Mode | Description |
|------|-------------|
| **Off** | No looping - normal playback |
| **Playlist** | Loop the entire playlist/album |
| **Song** | Loop the current song with custom count |

### **Song Loop Count**
- **1**: Play once (no loop)
- **2**: Play twice
- **3**: Play three times
- **5**: Play five times
- **10**: Play ten times
- **∞**: Infinite loop

---

## 🏗️ **Project Structure**

```
Loopify/
├── backend.py              # Flask API server
├── loopify-launcher.js     # Main launcher script
├── build.ps1              # Build script
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── src/
│   ├── LoopifyApp.jsx     # Main React component
│   ├── main.js           # Electron main process
│   ├── renderer.js       # Electron renderer
│   ├── index.html        # HTML template
│   └── index.css         # Global styles
└── webpack.config.js     # Webpack configuration
```

---

## 🔧 **Technical Details**

- **Backend**: Flask API with Spotify Web API integration
- **Frontend**: React + Electron for cross-platform desktop app
- **Authentication**: Spotify OAuth 2.0 flow
- **Media Control**: Windows media keys via pywin32
- **UI**: Styled-components with glassmorphic design
- **Build**: Webpack + Electron Builder

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Widget doesn't appear:**
- Make sure the terminal window is running (minimized is OK)
- Check that Spotify is running and playing music

**Spotify authentication fails:**
- Verify your `.env` file has correct credentials
- Ensure redirect URI matches exactly: `http://127.0.0.1:8888/callback`

**Media controls don't work:**
- Make sure Spotify is the active media player
- Try restarting Spotify desktop app

**Widget is stuck:**
- Close the terminal and restart the app
- Check Windows Task Manager for any hanging processes

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


## 🙏 **Acknowledgments**

- **Spotify** for their excellent Web API
- **Electron** for the desktop app framework
- **React** for the beautiful UI components
- **Flask** for the robust backend API

---

<div align="center">

**Made with ❤️ for music lovers who want precise control over their loops**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/loopify)
[![Issues](https://img.shields.io/badge/Issues-FF6B6B?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/loopify/issues)

</div> 
