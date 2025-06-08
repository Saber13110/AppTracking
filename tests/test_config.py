import importlib
import os
import pytest

# Ensure other required env vars are present
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')

import backend.app.config as config_module


def test_secret_key_required(monkeypatch):
    monkeypatch.delenv('SECRET_KEY', raising=False)
    with pytest.raises(ValueError) as excinfo:
        importlib.reload(config_module)
    assert (
        "SECRET_KEY must be set (see README: Environment Variables)"
        in str(excinfo.value)
    )


def test_history_retention_default(monkeypatch):
    monkeypatch.delenv("HISTORY_RETENTION_DAYS", raising=False)
    importlib.reload(config_module)
    assert config_module.settings.HISTORY_RETENTION_DAYS == 30


def test_history_retention_from_env(monkeypatch):
    monkeypatch.setenv("HISTORY_RETENTION_DAYS", "7")
    importlib.reload(config_module)
    assert config_module.settings.HISTORY_RETENTION_DAYS == 7
