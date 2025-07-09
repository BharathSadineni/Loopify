"""
Loopify Flask Backend API

Endpoints:
POST   /playpause         - Toggle play/pause
POST   /next             - Next track
POST   /prev             - Previous track
POST   /volumeup         - Volume up
POST   /volumedown       - Volume down
POST   /mute             - Mute
GET    /loop             - Get loop state and count
POST   /loop             - Set loop state and count (JSON: {state_index, loop_count})
GET    /songinfo         - Get current song info
GET    /status           - Get loop status
"""

from flask import Flask, request, jsonify, redirect, url_for, make_response
from flask_cors import CORS
import threading
import time
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import win32api
import win32con
import os
from dotenv import load_dotenv

load_dotenv()
SPOTIPY_CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
SPOTIPY_CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")
SPOTIPY_REDIRECT_URI = os.getenv("SPOTIPY_REDIRECT_URI")
SPOTIPY_SCOPE = (
    "user-read-playback-state user-modify-playback-state user-read-currently-playing"
)

VK_MEDIA_NEXT_TRACK = 0xB0
VK_MEDIA_PREV_TRACK = 0xB1
VK_MEDIA_PLAY_PAUSE = 0xB3
VK_VOLUME_UP = 0xAF
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_MUTE = 0xAD

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_spotify():
    return spotipy.Spotify(
        auth_manager=SpotifyOAuth(
            client_id=SPOTIPY_CLIENT_ID,
            client_secret=SPOTIPY_CLIENT_SECRET,
            redirect_uri=SPOTIPY_REDIRECT_URI,
            scope=SPOTIPY_SCOPE,
            open_browser=True,
            show_dialog=True,  # Always show consent screen
            cache_handler=None,  # Let Spotipy handle caching automatically
        )
    )

def check_and_ensure_spotify_auth():
    """Check if Spotify auth is valid, if not trigger OAuth flow"""
    try:
        sp = get_spotify()
        # Try to get current user to test if token is valid
        sp.current_user()
        print("Spotify authentication is valid")
        return True
    except Exception as e:
        print(f"Spotify authentication required: {e}")
        # Trigger OAuth flow
        auth_manager = SpotifyOAuth(
            client_id=SPOTIPY_CLIENT_ID,
            client_secret=SPOTIPY_CLIENT_SECRET,
            redirect_uri=SPOTIPY_REDIRECT_URI,
            scope=SPOTIPY_SCOPE,
            open_browser=True,
            show_dialog=True,  # Always show consent screen
            cache_handler=None,  # Let Spotipy handle caching automatically
        )
        auth_url = auth_manager.get_authorize_url()
        print(f"Please visit this URL to authenticate: {auth_url}")
        print("After authentication, the app will be ready to use.")
        return False

class LoopifyBackend:
    def __init__(self):
        self.loop_states = ["Off", "Playlist", "Song"]
        self.loop_state_index = 0
        self.loop_count = 1
        self.loops_done = 0
        self.is_running = True
        self.last_track_id = None
        threading.Thread(target=self.loop_watcher, daemon=True).start()

    def get_current_song_info(self):
        try:
            sp = get_spotify()
            current = sp.current_playback()
            if not current or not current.get("item"):
                return None
            item = current["item"]
            title = item["name"]
            artist = ", ".join([a["name"] for a in item["artists"]])
            duration_ms = item["duration_ms"]
            progress_ms = current["progress_ms"]
            is_playing = current["is_playing"]
            return {
                "title": title,
                "artist": artist,
                "duration_ms": duration_ms,
                "progress_ms": progress_ms,
                "is_playing": is_playing,
            }
        except Exception as e:
            print(f"Spotify API error: {e}")
            return None

    def send_media_key(self, vk_code):
        try:
            win32api.keybd_event(vk_code, 0, 0, 0)
            time.sleep(0.05)
            win32api.keybd_event(vk_code, 0, win32con.KEYEVENTF_KEYUP, 0)
            return True
        except Exception as e:
            print(f"Failed to send media key: {e}")
            return False

    def play_pause(self):
        self.send_media_key(VK_MEDIA_PLAY_PAUSE)

    def next_track(self):
        self.send_media_key(VK_MEDIA_NEXT_TRACK)
        if self.loop_states[self.loop_state_index] == "Song":
            self.loop_count = 1

    def previous_track(self):
        self.send_media_key(VK_MEDIA_PREV_TRACK)
        if self.loop_states[self.loop_state_index] == "Song":
            self.loop_count = 1

    def volume_up(self):
        self.send_media_key(VK_VOLUME_UP)

    def volume_down(self):
        self.send_media_key(VK_VOLUME_DOWN)

    def volume_mute(self):
        self.send_media_key(VK_VOLUME_MUTE)

    def set_loop(self, state_index=None, loop_count=None):
        if state_index is not None:
            self.loop_state_index = state_index
        if loop_count is not None:
            self.loop_count = loop_count

    def get_loop(self):
        return {
            "state_index": self.loop_state_index,
            "state": self.loop_states[self.loop_state_index],
            "loop_count": self.loop_count,
        }

    def get_status(self):
        return {
            "loops_done": self.loops_done,
            "loop_count": self.loop_count,
            "loop_state_index": self.loop_state_index,
            "loop_state": self.loop_states[self.loop_state_index],
        }

    def loop_watcher(self):
        while self.is_running:
            if self.loop_states[self.loop_state_index] != "Song":
                time.sleep(2)
                continue
            info = self.get_current_song_info()
            if not info or not info["is_playing"]:
                time.sleep(2)
                continue
            track_id = info["title"] + " - " + info["artist"]
            duration = info["duration_ms"] / 1000.0
            progress = info["progress_ms"] / 1000.0
            if self.last_track_id != track_id:
                self.last_track_id = track_id
                self.loops_done = 0
            if duration - progress > 2:
                time.sleep(1)
                continue
            if self.loop_count == 0:
                # Infinite loop: always restart current song
                self.send_media_key(VK_MEDIA_PREV_TRACK)
                time.sleep(2)
            elif self.loops_done < self.loop_count - 1:
                self.loops_done += 1
                self.send_media_key(VK_MEDIA_PREV_TRACK)
                time.sleep(2)
            else:
                # Wait for track to change
                while self.is_running:
                    info2 = self.get_current_song_info()
                    if not info2 or not info2["is_playing"]:
                        time.sleep(1)
                        continue
                    new_track_id = info2["title"] + " - " + info2["artist"]
                    if new_track_id != track_id:
                        break
                    time.sleep(1)
                self.loops_done = 0
                self.loop_count = 1
            time.sleep(2)

backend = LoopifyBackend()

@app.route("/playpause", methods=["POST"])
def playpause():
    backend.play_pause()
    return jsonify({"status": "ok"})

@app.route("/next", methods=["POST"])
def next_track():
    backend.next_track()
    return jsonify({"status": "ok"})

@app.route("/prev", methods=["POST"])
def prev_track():
    backend.previous_track()
    return jsonify({"status": "ok"})

@app.route("/volumeup", methods=["POST"])
def volume_up():
    backend.volume_up()
    return jsonify({"status": "ok"})

@app.route("/volumedown", methods=["POST"])
def volume_down():
    backend.volume_down()
    return jsonify({"status": "ok"})

@app.route("/mute", methods=["POST"])
def mute():
    backend.volume_mute()
    return jsonify({"status": "ok"})

@app.route("/loop", methods=["GET", "POST"])
def loop():
    if request.method == "POST":
        data = request.json
        backend.set_loop(
            state_index=data.get("state_index"), loop_count=data.get("loop_count")
        )
        return jsonify({"status": "ok"})
    else:
        return jsonify(backend.get_loop())

@app.route("/songinfo", methods=["GET"])
def songinfo():
    info = backend.get_current_song_info()
    return jsonify(info if info else {})

@app.route("/status", methods=["GET"])
def status():
    return jsonify(backend.get_status())

@app.route("/spotify-auth")
def spotify_auth():
    auth_manager = SpotifyOAuth(
        client_id=SPOTIPY_CLIENT_ID,
        client_secret=SPOTIPY_CLIENT_SECRET,
        redirect_uri=SPOTIPY_REDIRECT_URI,
        scope=SPOTIPY_SCOPE,
        open_browser=True,
    )
    auth_url = auth_manager.get_authorize_url()
    return redirect(auth_url)

@app.route("/callback")
def callback():
    # Get the authorization code from the URL
    code = request.args.get('code')
    
    if code:
        try:
            # Exchange the authorization code for a token
            auth_manager = SpotifyOAuth(
                client_id=SPOTIPY_CLIENT_ID,
                client_secret=SPOTIPY_CLIENT_SECRET,
                redirect_uri=SPOTIPY_REDIRECT_URI,
                scope=SPOTIPY_SCOPE,
                show_dialog=True,
            )
            
            # This will handle the token exchange automatically
            sp = spotipy.Spotify(auth_manager=auth_manager)
            
            # Test the token by getting user info
            user = sp.current_user()
            print(f"Successfully authenticated user: {user['display_name']}")
            
        except Exception as e:
            print(f"Error during token exchange: {e}")
    
    # Return minimal HTML that closes immediately
    html = '''
    <html>
    <head>
        <title>Closing...</title>
        <style>
            body { 
                background: transparent; 
                margin: 0; 
                padding: 0; 
                overflow: hidden;
            }
        </style>
    </head>
    <body>
        <script>
            // Close immediately
            window.close();
        </script>
    </body>
    </html>
    '''
    return html

if __name__ == "__main__":
    # Check Spotify authentication on startup
    print("Starting Loopify backend...")
    print("Checking Spotify authentication...")
    
    if not check_and_ensure_spotify_auth():
        print("Waiting for Spotify authentication...")
        print("Please complete the authentication in your browser.")
        print("The app will be ready once authentication is complete.")
    
    print("Starting Flask server...")
    # Disable Flask logging to reduce terminal output
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(port=5000)
