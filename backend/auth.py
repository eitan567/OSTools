from fastapi import APIRouter, Request, HTTPException, Depends, Response
from fastapi.responses import RedirectResponse
from starlette.responses import JSONResponse
from dependencies import oauth, db, create_access_token, get_current_user
import logging
import jwt
import secrets

logger = logging.getLogger(__name__)
router = APIRouter()

CLIENT_URL = "http://localhost:3000/"

@router.get("/auth/login/success")
async def login_success(request: Request, response: Response):
    user = request.session.get('user')
    if user:
        access_token = create_access_token(data={"sub": user['email']})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "successful",
                "user": user,
                "access_token": access_token
            }
        )
    else:
        raise HTTPException(status_code=401, detail="User not authenticated")

@router.get("/auth/login/failed")
async def login_failed():
    return JSONResponse(status_code=401, content={"success": False, "message": "failure"})

@router.get("/auth/logout")
async def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url=CLIENT_URL, status_code=303)

@router.get('/auth/google')
async def login_via_google(request: Request):
    redirect_uri = request.url_for('auth_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/auth/google/callback')
async def auth_google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = await oauth.google.parse_id_token(request, token)
    user_data = {
        "email": user.get("email"),
        "name": user.get("name"),
        "picture": user.get("picture")
    }
    await db.users.update_one({"email": user_data["email"]}, {"$set": user_data}, upsert=True)
    request.session['user'] = user_data
    return RedirectResponse(url=CLIENT_URL)

@router.get('/auth/facebook')
async def login_via_facebook(request: Request):
    redirect_uri = request.url_for('auth_facebook_callback')
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get('/auth/facebook/callback')
async def auth_facebook_callback(request: Request):
    token = await oauth.facebook.authorize_access_token(request)
    resp = await oauth.facebook.get('me?fields=id,name,email,picture', token=token)
    profile = resp.json()
    user_data = {
        "email": profile.get("email"),
        "name": profile.get("name"),
        "picture": profile.get("picture", {}).get("data", {}).get("url")
    }
    await db.users.update_one({"email": user_data["email"]}, {"$set": user_data}, upsert=True)
    request.session['user'] = user_data
    return RedirectResponse(url=CLIENT_URL)

@router.get("/user")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
