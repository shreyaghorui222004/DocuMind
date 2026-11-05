import os, re
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["JWT_SECRET_KEY"] = "x" * 40

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db import Base, engine, init_db
from app.routers import auth, users

app = FastAPI()
app.include_router(auth.router)
app.include_router(users.router)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    init_db()
    auth._limit.reset()
    yield


def client():
    return TestClient(app)


U = {"full_name": "Test User", "email": "Test@Example.com", "password": "Passw0rdOK"}


def test_signup_login_me_logout():
    c = client()
    r = c.post("/auth/signup", json=U)
    assert r.status_code == 201 and r.json()["email"] == "test@example.com"
    assert "hashed_password" not in r.json()
    assert "httponly" in r.headers["set-cookie"].lower()
    assert c.get("/auth/me").status_code == 200
    assert c.post("/auth/logout").status_code == 200
    assert c.get("/auth/me").status_code == 401


def test_duplicate_and_validation():
    c = client()
    assert c.post("/auth/signup", json=U).status_code == 201
    assert client().post("/auth/signup", json=U).status_code == 409
    assert client().post("/auth/signup", json={**U, "email": "b@x.com", "password": "short"}).status_code == 422
    assert client().post("/auth/signup", json={**U, "email": "nope"}).status_code == 422


def test_login_rules():
    client().post("/auth/signup", json=U)
    assert client().post("/auth/login", json={"email": U["email"], "password": "wrongpass1"}).status_code == 401
    assert client().post("/auth/login", json={"email": "ghost@x.com", "password": "Passw0rdOK"}).status_code == 401
    c = client()
    assert c.post("/auth/login", json={"email": U["email"], "password": U["password"], "remember_me": True}).status_code == 200
    assert c.get("/users/me").status_code == 200


def test_old_token_revoked_after_logout():
    c = client(); c.post("/auth/signup", json=U)
    token = c.cookies.get("documind_session")
    c.post("/auth/logout")
    assert client().get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_profile_and_password_change():
    c = client(); c.post("/auth/signup", json=U)
    assert c.put("/users/me", json={"full_name": "New Name"}).json()["full_name"] == "New Name"
    assert c.put("/users/me/password", json={"current_password": "bad", "new_password": "NewPass123"}).status_code == 400
    assert c.put("/users/me/password", json={"current_password": U["password"], "new_password": "NewPass123"}).status_code == 200
    assert c.get("/auth/me").status_code == 401  # sessions revoked
    assert client().post("/auth/login", json={"email": U["email"], "password": "NewPass123"}).status_code == 200


def test_forgot_and_reset(capfd):
    client().post("/auth/signup", json=U)
    c = client()
    assert c.post("/auth/forgot-password", json={"email": U["email"]}).status_code == 200
    assert c.post("/auth/forgot-password", json={"email": "ghost@x.com"}).status_code == 200  # no enumeration
    out = capfd.readouterr().out
    token = re.search(r"token=([\w-]+)", out).group(1)
    assert c.post("/auth/reset-password", json={"token": token, "new_password": "Reset1234"}).status_code == 200
    assert c.post("/auth/reset-password", json={"token": token, "new_password": "Reset5678"}).status_code == 400  # single use
    assert client().post("/auth/login", json={"email": U["email"], "password": "Reset1234"}).status_code == 200
    assert c.post("/auth/reset-password", json={"token": "a" * 30, "new_password": "Reset1234"}).status_code == 400
