# In app/routers/auth.py
from fastapi import APIRouter, Request, HTTPException, Depends,Response
from fastapi.responses import RedirectResponse
from starlette.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from dependencies import oauth
import logging
import jwt
import secrets
import os
import firebase_admin
from firebase_admin import auth, initialize_app, credentials

logger = logging.getLogger(__name__)    # Get the logger for this module
router = APIRouter()
# Initialize Firebase Admin SDK (do this once in your app startup)

CLIENT_URL = "http://localhost:3000/"

serviceAccountKey = os.path.join(os.path.dirname(__file__), 'onlinesellertools-firebase-adminsdk-1ftew-d70e2eac48.json')
# Initialize Firebase Admin SDK
cred = credentials.Certificate(serviceAccountKey)
firebase_admin.initialize_app(cred, {
    'projectId': 'onlinesellertools',
})

@router.post("/auth/firebase-login")
async def firebase_login(request: Request):
    try:
        data = await request.json()
        if 'idToken' not in data:
            raise HTTPException(status_code=400, detail="ID token is missing")

        # Verify the Firebase ID token
        try:
            decoded_token = auth.verify_id_token(data['idToken'])
        except auth.InvalidIdTokenError:
            logger.error(f"Invalid ID token: {data['idToken']}")
            raise HTTPException(status_code=401, detail="Invalid ID token")
        except ValueError as e:
            logger.error(f"Value error in token verification: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid token format")
        
        uid = decoded_token['uid']
        
        # Fetch additional user info from Firebase
        try:
            user = auth.get_user(uid)          
            logger.info(f"Firebase user data: {user.__dict__}")  # Log user data for debugging
        except auth.UserNotFoundError:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create user session data
        user_data = {
            'uid': uid,
            'email': user.email or decoded_token.get('email'),
            'name': user.display_name or decoded_token.get('name'),
            'picture': user.photo_url or decoded_token.get('picture')
        }
        
        # If email is still not available, try to get it from provider data
        if not user_data['email'] and user.provider_data:
            user_data['email'] = next((provider.email for provider in user.provider_data if provider.email), None)
        
        # Special handling for Facebook provider
        if user.provider_data:
            for provider in user.provider_data:
                if provider.provider_id == 'facebook.com':                   
                    logger.info(f"Facebook provider data: {provider.__dict__}")  # Log Facebook data for debugging
                    if provider.photo_url:
                        user_data['picture'] = provider.photo_url
                    break
        
        # Set session
        request.session['user'] = user_data
        
        logger.info(f"Final user data: {user_data}")  # Log final user data for debugging
        return {"message": "Logged in successfully", "user": user_data}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in firebase_login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


# # Login Success
# @router.get("/auth/login/success")
# async def login_success(request: Request,response: Response):    
#     user = request.session.get('user')
#     if user:
#         return JSONResponse(
#             status_code=200,
#             headers={
#                 "Permissions-Policy": "ch-ua-form-factor"
#             },
#             content={
#                 "success": True,
#                 "message": "successful",
#                 "user": user,
#                 # "cookies": request.cookies  # Uncomment if you need to send cookie info
#             }
#         )
#     else:
#         raise HTTPException(status_code=401, detail="User not authenticated")

# @router.get("/auth/login/success")
# async def login_success(request: Request):
#     if "user" not in request.session:
#         return JSONResponse(status_code=401, content={"success": False, "message": "User not authenticated"})
    
#     user = request.session["user"]
#     return JSONResponse(
#         status_code=200,
#         content={
#             "success": True,
#             "message": "successful",
#             "user": user
#         }
#     )

# # Login Failed
# @router.get("/auth/login/failed")
# async def login_failed():
#     return JSONResponse(
#         status_code=401,
#         headers={
#                 "Permissions-Policy": "ch-ua-form-factor"
#         },
#         content={
#             "success": False,
#             "message": "failure",
#         }
#     )

# # Logout
# @router.get("/auth/logout")
# async def logout(request: Request):
#     request.session.pop('user', None)
#     return RedirectResponse(url=CLIENT_URL, status_code=303)

# @router.get('/auth/google')
# async def login_via_google(request: Request):
#     redirect_uri = request.url_for('auth_google_callback')
#     state = secrets.token_urlsafe(16)
#     request.session['oauth_state'] = state
#     return await oauth.google.authorize_redirect(request, redirect_uri, state=state)

# @router.get('/auth/facebook')
# async def login_via_facebook(request: Request):
#     redirect_uri = request.url_for('auth_facebook_callback')
#     state = secrets.token_urlsafe(16)
#     request.session['oauth_state'] = state
#     return await oauth.facebook.authorize_redirect(request, redirect_uri, state=state)

# @router.get('/auth/github')
# async def login_via_github(request: Request):
#     redirect_uri = request.url_for('auth_github_callback')
#     state = secrets.token_urlsafe(16)
#     request.session['oauth_state'] = state
#     return await oauth.github.authorize_redirect(request, redirect_uri, state=state)

# @router.get('/auth/google/callback')
# async def auth_google_callback(request: Request):
#     token = await oauth.google.authorize_access_token(request)
#     if 'id_token' not in token:
#         raise HTTPException(status_code=500, detail="ID Token missing in the OAuth response.")
#     id_token = token.get('id_token')
#     user = jwt.decode(id_token, options={"verify_signature": False})  # Verify JWT properly in production
#     request.session['user'] = dict(user)
#     return RedirectResponse(url=CLIENT_URL)

# # GitHub Callback
# @router.get('/auth/github/callback')
# async def auth_github_callback(request: Request):
#     try:
#         token = await oauth.github.authorize_access_token(request)
#         if not token:
#             raise HTTPException(status_code=401, detail="Authentication failed.")

#         # Access the GitHub API directly to fetch user information
#         resp = await oauth.github.get('https://api.github.com/user', token=token)
#         user_info = resp.json()
#         if not user_info:
#             raise HTTPException(status_code=500, detail="Failed to fetch user details from GitHub.")

#         # Example: store user info in session or perform other actions
#         request.session['user'] = user_info
#         request.session['user']['picture'] = user_info['avatar_url']

#         return RedirectResponse(url=CLIENT_URL)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get('/auth/facebook/callback')
# async def auth_facebook_callback(request: Request):
#     try:
#         token = await oauth.facebook.authorize_access_token(request)
        
#         # Correct usage of the token with authlib
#         # No need to manually add the access_token to the request parameters
#         response = await oauth.facebook.get('https://graph.facebook.com/me', token=token, params={'fields': 'id,name,email,picture'})
        
#         user_info = response.json()  # Get the user info from the response
#         if not user_info:
#             raise HTTPException(status_code=500, detail="Failed to fetch user details.")
        
#         request.session['user'] = user_info
#         request.session['user']['picture'] = user_info['picture']['data']['url']
        
#         return RedirectResponse(url=CLIENT_URL)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/auth/microsoft")
# async def login_via_microsoft(request: Request):
#     redirect_uri = request.url_for('auth_microsoft_callback')
#     state = secrets.token_urlsafe(16)
#     request.session['oauth_state'] = state
#     return await oauth.microsoft.authorize_redirect(request, redirect_uri, state=state)

# @router.get("/auth/microsoft/callback")
# async def auth_microsoft_callback(request: Request):
#     try:
#         token = await oauth.microsoft.authorize_access_token(request)
#         user = token.get('userinfo')
#         if not user:
#             raise HTTPException(status_code=500, detail="Failed to fetch user details.")
        
#         # Handle user details (e.g., create user session or database entry)
#         request.session['user'] = user                
#         return RedirectResponse(url=CLIENT_URL)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")