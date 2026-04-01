import sqlite3
import hashlib
import secrets
import random
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from core.auth_utils import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])
db_path = Path(__file__).parent.parent / "users.db"


def init_db():
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            salt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS otps (
            email TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            purpose TEXT DEFAULT 'login'
        )
    ''')
    # Migrate existing tables safely
    for col in [("password_hash", "TEXT"), ("salt", "TEXT"), ("purpose", "TEXT DEFAULT 'login'")]:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col[0]} {col[1]}")
        except Exception:
            pass
        try:
            cur.execute(f"ALTER TABLE otps ADD COLUMN {col[0]} {col[1]}")
        except Exception:
            pass
    conn.commit()
    conn.close()


init_db()


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def _make_token(email: str) -> dict:
    token = create_access_token(
        data={"sub": email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "user": {"email": email}}


# ── Models ──────────────────────────────────────────────
class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    code: str

class SignInRequest(BaseModel):
    email: str
    password: str

class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


# ══════════════════════════════════════════════════════
# SIGN UP  — creates user or sets password if account
#            exists but was created via OTP (no password)
# ══════════════════════════════════════════════════════
@router.post("/signup")
def sign_up(data: SignUpRequest):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    salt = secrets.token_hex(16)
    pw_hash = hash_password(data.password, salt)

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        # Check if email already exists
        cur.execute("SELECT id, password_hash FROM users WHERE email = ?", (data.email,))
        row = cur.fetchone()

        if row:
            user_id, existing_hash = row
            if existing_hash:
                # Has a real password → cannot re-register
                raise HTTPException(
                    status_code=409,
                    detail="An account with this email already exists. Please sign in instead."
                )
            else:
                # OTP-only account (no password) → set password now
                cur.execute(
                    "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
                    (pw_hash, salt, user_id)
                )
                conn.commit()
                return _make_token(data.email)
        else:
            # Brand-new account
            cur.execute(
                "INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)",
                (data.email, pw_hash, salt)
            )
            conn.commit()
            return _make_token(data.email)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# SIGN IN
# ══════════════════════════════════════════════════════
@router.post("/signin")
def sign_in(data: SignInRequest):
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        cur.execute("SELECT password_hash, salt FROM users WHERE email = ?", (data.email,))
        row = cur.fetchone()
        if not row or not row[0]:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        pw_hash, salt = row
        if hash_password(data.password, salt) != pw_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return _make_token(data.email)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# FORGOT PASSWORD — sends OTP to email
# ══════════════════════════════════════════════════════
@router.post("/forgot-password")
def forgot_password(data: OTPRequest):
    code = f"{random.randint(100000, 999999)}"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        # Works even if user doesn't exist (don't leak emails)
        expires = datetime.utcnow() + timedelta(minutes=10)
        cur.execute(
            "INSERT OR REPLACE INTO otps (email, code, expires_at, purpose) VALUES (?, ?, ?, ?)",
            (data.email, code, expires.isoformat(), "reset")
        )
        conn.commit()
    finally:
        conn.close()

    # Show in terminal for demo (replace with real email service)
    print(f"\n{'='*60}\n 🔑 PASSWORD RESET OTP for [{data.email}]: {code}\n{'='*60}\n")
    otp_file = Path(__file__).parent.parent / "latest_otp.txt"
    with open(otp_file, "w") as f:
        f.write(f"Password Reset OTP for {data.email}: {code}\n")

    return {"msg": "If an account exists, a reset code has been sent. Check terminal logs."}


# ══════════════════════════════════════════════════════
# RESET PASSWORD — verify OTP + set new password
# ══════════════════════════════════════════════════════
@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT code, expires_at FROM otps WHERE email = ? AND purpose = ?",
            (data.email, "reset")
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="No reset code found. Request a new one.")
        db_code, expires_at = row
        if datetime.fromisoformat(expires_at) < datetime.utcnow():
            cur.execute("DELETE FROM otps WHERE email = ?", (data.email,))
            conn.commit()
            raise HTTPException(status_code=400, detail="Reset code has expired. Request a new one.")
        if data.code != db_code:
            raise HTTPException(status_code=400, detail="Invalid reset code.")

        # Update password
        salt = secrets.token_hex(16)
        pw_hash = hash_password(data.new_password, salt)
        cur.execute(
            "UPDATE users SET password_hash = ?, salt = ? WHERE email = ?",
            (pw_hash, salt, data.email)
        )
        cur.execute("DELETE FROM otps WHERE email = ?", (data.email,))
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Account not found.")

        return _make_token(data.email)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# OTP LOGIN (legacy)
# ══════════════════════════════════════════════════════
@router.post("/request-otp")
def request_otp(data: OTPRequest):
    code = f"{random.randint(100000, 999999)}"
    print(f"\n{'='*60}\n 🔐 DEMO OTP for [{data.email}]: {code}\n{'='*60}\n")
    otp_file = Path(__file__).parent.parent / "latest_otp.txt"
    with open(otp_file, "w") as f:
        f.write(f"OTP for {data.email}: {code}\n")
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        expires = datetime.utcnow() + timedelta(minutes=5)
        cur.execute(
            "INSERT OR REPLACE INTO otps (email, code, expires_at, purpose) VALUES (?, ?, ?, ?)",
            (data.email, code, expires.isoformat(), "login")
        )
        conn.commit()
        return {"msg": "OTP sent. Check terminal logs."}
    finally:
        conn.close()


@router.post("/verify-otp")
def verify_otp(data: OTPVerify):
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    try:
        cur.execute("SELECT code, expires_at FROM otps WHERE email = ?", (data.email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="OTP not requested or has expired.")
        db_code, expires_at = row
        if datetime.fromisoformat(expires_at) < datetime.utcnow():
            cur.execute("DELETE FROM otps WHERE email = ?", (data.email,))
            conn.commit()
            raise HTTPException(status_code=400, detail="OTP has expired.")
        if data.code != db_code:
            raise HTTPException(status_code=400, detail="Invalid OTP code.")
        cur.execute("DELETE FROM otps WHERE email = ?", (data.email,))
        cur.execute("SELECT id FROM users WHERE email = ?", (data.email,))
        if not cur.fetchone():
            cur.execute("INSERT INTO users (email) VALUES (?)", (data.email,))
        conn.commit()
        return _make_token(data.email)
    finally:
        conn.close()
