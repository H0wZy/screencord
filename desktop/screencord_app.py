#!/usr/bin/env python3
"""
Screencord Native Desktop Application
Built with PySide6 (Qt6) - 100% Native OS Window, Zero-Electron, Zero Browser Chrome.
Supports Windows, Linux, and macOS.
"""

import sys
import os
import time
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

from PySide6.QtCore import QUrl, Qt
from PySide6.QtWidgets import QApplication, QMainWindow, QMessageBox
from PySide6.QtGui import QIcon, QColor, QPalette
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile, QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView

PORT = 3001
SERVER_URL = f"http://localhost:{PORT}"
ROOT_DIR = Path(__file__).resolve().parent.parent


def is_server_healthy(url=f"{SERVER_URL}/health", timeout=0.8):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def start_local_server():
    """Starts the background signaling server if not already active."""
    if is_server_healthy():
        print(f"[Desktop Native] Server already running at {SERVER_URL}")
        return None

    server_entry = ROOT_DIR / "server" / "dist" / "index.js"
    if not server_entry.exists():
        print("[Desktop Native] Building server dist...")
        subprocess.run(["npm", "--prefix", "server", "run", "build"], cwd=ROOT_DIR, check=True)

    print(f"[Desktop Native] Starting Screencord server on port {PORT}...")
    server_proc = subprocess.Popen(
        ["node", str(server_entry)],
        cwd=ROOT_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Wait up to 5 seconds for health check
    for _ in range(25):
        time.sleep(0.2)
        if is_server_healthy():
            print(f"[Desktop Native] Server is ready at {SERVER_URL}")
            return server_proc

    print("[Desktop Native] Warning: server health check timed out, attempting to load anyway.")
    return server_proc


class ScreencordWebEnginePage(QWebEnginePage):
    """
    Custom WebEnginePage that automatically approves microphone, webcam,
    and desktop screen/audio capture requests without browser banners.
    """
    def __init__(self, profile, parent=None):
        super().__init__(profile, parent)
        self.featurePermissionRequested.connect(self.on_feature_permission_requested)

    def on_feature_permission_requested(self, security_origin, feature):
        allowed_features = {
            QWebEnginePage.Feature.MediaAudioCapture,
            QWebEnginePage.Feature.MediaVideoCapture,
            QWebEnginePage.Feature.MediaAudioVideoCapture,
            QWebEnginePage.Feature.DesktopVideoCapture,
            QWebEnginePage.Feature.DesktopAudioVideoCapture,
            QWebEnginePage.Feature.Notifications,
        }
        if feature in allowed_features:
            self.setFeaturePermission(
                security_origin,
                feature,
                QWebEnginePage.PermissionPolicy.PermissionGrantedByUser,
            )


class ScreencordMainWindow(QMainWindow):
    def __init__(self, target_url=SERVER_URL, server_proc=None):
        super().__init__()
        self.server_proc = server_proc
        self.target_url = target_url

        self.setWindowTitle("Screencord")
        self.resize(1340, 840)
        self.setMinimumSize(960, 600)

        # Native Dark Palette
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor("#1e1f22"))
        palette.setColor(QPalette.ColorRole.WindowText, QColor("#ffffff"))
        self.setPalette(palette)

        # WebEngine Profile setup
        profile = QWebEngineProfile("ScreencordProfile", self)
        settings = profile.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptCanAccessClipboard, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.AllowRunningInsecureContent, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
        settings.setAttribute(QWebEngineSettings.WebAttribute.ScreenCaptureEnabled, True)

        # View setup
        self.view = QWebEngineView(self)
        self.page = ScreencordWebEnginePage(profile, self.view)
        self.view.setPage(self.page)
        self.view.setUrl(QUrl(self.target_url))

        self.setCentralWidget(self.view)

        # Set custom Screencord window icon
        icon_path = ROOT_DIR / "desktop" / "assets" / ("icon.ico" if sys.platform == "win32" else "icon.png")
        if icon_path.exists():
            self.setWindowIcon(QIcon(str(icon_path)))

    def closeEvent(self, event):
        if self.server_proc:
            print("[Desktop Native] Terminating background server process...")
            try:
                self.server_proc.terminate()
                self.server_proc.wait(timeout=2)
            except Exception:
                self.server_proc.kill()
        event.accept()


def main():
    # Fix Windows taskbar grouping and Python icon replacement
    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("screencord.app.v1")
        except Exception:
            pass

    # Pass custom server URL if provided as CLI argument (e.g. connecting to friend's Tailscale IP)
    target_url = sys.argv[1] if len(sys.argv) > 1 else SERVER_URL

    # Hardware acceleration & WebRTC flags
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = (
        "--enable-usermedia-screen-capturing "
        "--enable-gpu-rasterization "
        "--ignore-gpu-blocklist "
        "--enable-features=WebRTCPipeWireCapturer"
    )

    app = QApplication(sys.argv)
    app.setApplicationName("Screencord")
    app.setOrganizationName("Screencord")

    icon_path = ROOT_DIR / "desktop" / "assets" / ("icon.ico" if sys.platform == "win32" else "icon.png")
    if icon_path.exists():
        app.setWindowIcon(QIcon(str(icon_path)))

    server_proc = None
    if "localhost" in target_url or "127.0.0.1" in target_url:
        server_proc = start_local_server()

    window = ScreencordMainWindow(target_url, server_proc)
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
