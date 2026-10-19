import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from desktop.screencord_app import is_server_healthy, ScreencordWebEnginePage
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile

@pytest.fixture(scope="session")
def qapp():
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)
    yield app

def test_is_server_healthy_false_on_invalid_port():
    assert is_server_healthy("http://localhost:59999/health") is False

def test_webengine_page_permission_handler(qapp):
    profile = QWebEngineProfile.defaultProfile()
    page = ScreencordWebEnginePage(profile)
    assert page is not None

    # Test allowed permission features
    features = [
        QWebEnginePage.Feature.MediaAudioCapture,
        QWebEnginePage.Feature.MediaVideoCapture,
        QWebEnginePage.Feature.DesktopVideoCapture,
        QWebEnginePage.Feature.DesktopAudioVideoCapture,
    ]
    for feat in features:
        # Should not raise exception
        page.on_feature_permission_requested("http://localhost:3001", feat)
