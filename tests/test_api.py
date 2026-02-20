import copy
import pytest
from fastapi.testclient import TestClient

from src import app as app_module
from src.app import app


@pytest.fixture
def client():
    """Arrange: provide a TestClient for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_activities():
    """Arrange: snapshot and restore `app_module.activities` around each test."""
    original = copy.deepcopy(app_module.activities)
    try:
        yield
    finally:
        app_module.activities.clear()
        app_module.activities.update(original)


def test_get_activities(client):
    # Arrange: client fixture provides TestClient

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success_and_duplicate(client):
    # Arrange
    activity = "Chess Club"
    email = "tester@example.com"

    # Act: signup
    r1 = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert: signup succeeded and email present
    assert r1.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Act: duplicate signup
    r2 = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert: duplicate rejected
    assert r2.status_code == 400


def test_unregister_success_and_errors(client):
    # Arrange
    activity = "Chess Club"
    email = "remover@example.com"

    # Precondition: ensure email is signed up
    client.post(f"/activities/{activity}/signup", params={"email": email})
    assert email in client.get("/activities").json()[activity]["participants"]

    # Act: unregister
    r1 = client.post(f"/activities/{activity}/unregister", params={"email": email})

    # Assert: removed
    assert r1.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]

    # Act: unregister again (should fail)
    r2 = client.post(f"/activities/{activity}/unregister", params={"email": email})

    # Assert: proper error
    assert r2.status_code == 400


def test_nonexistent_activity_errors(client):
    # Arrange
    missing = "NoSuchActivity"
    email = "x@y.z"

    # Act & Assert: signup 404
    r1 = client.post(f"/activities/{missing}/signup", params={"email": email})
    assert r1.status_code == 404

    # Act & Assert: unregister 404
    r2 = client.post(f"/activities/{missing}/unregister", params={"email": email})
    assert r2.status_code == 404
