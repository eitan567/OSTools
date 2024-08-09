from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import os

config = Config(os.path.join(os.path.dirname(__file__), '.env'))  # Ensures that your secrets are loaded from the .env file

oauth = OAuth(config)

# Using Google's discovery document to fetch jwks_uri along with other URLs
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

# Google OAuth Configuration
oauth.register(
    name='google',
    server_metadata_url=GOOGLE_DISCOVERY_URL,
    client_id=config('GOOGLE_CLIENT_ID'),
    client_secret=config('GOOGLE_CLIENT_SECRET'),
    authorize_state='123456789',### this string should be similar to the one we put while add sessions middleware
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# GitHub OAuth Configuration
oauth.register(
    name='github',
    client_id=config('GITHUB_CLIENT_ID'),
    client_secret=config('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_state='123456789',### this string should be similar to the one we put while add sessions middleware
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
) 

# Facebook OAuth Configuration
oauth.register(
    name='facebook',
    client_id=config('FACEBOOK_CLIENT_ID'),
    client_secret=config('FACEBOOK_CLIENT_SECRET'),
    authorize_url='https://www.facebook.com/dialog/oauth',
    access_token_url='https://graph.facebook.com/oauth/access_token',
    api_base_url='https://graph.facebook.com/',
    userinfo_endpoint='https://graph.facebook.com/me',  # Manually specify the userinfo endpoint
    authorize_state='123456789',### this string should be similar to the one we put while add sessions middleware
    client_kwargs={'scope': 'email public_profile'}  # Ensure scopes are appropriate
)

# oauth.register(
#     name='apple',
#     client_id=config('APPLE_CLIENT_ID'),
#     client_secret=config('APPLE_CLIENT_SECRET'),
#     authorize_url='https://appleid.apple.com/auth/authorize',
#     access_token_url='https://appleid.apple.com/auth/token',
#     client_kwargs={
#         'scope': 'email name',  # Adjust scopes as needed
#         'response_type': 'code id_token',
#         'response_mode': 'form_post'
#     }
# )
 
oauth.register(
    name='microsoft',
    client_id=config('MICROSOFT_CLIENT_ID'),
    client_secret=config('MICROSOFT_CLIENT_SECRET'),
    authorize_url='https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
    access_token_url='https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    authorize_state='123456789',### this string should be similar to the one we put while add sessions middleware
    client_kwargs={
        'scope': 'openid email profile User.Read',  # Adjust scopes as necessary
        'response_type': 'code'
    },
    jwks_uri='https://login.microsoftonline.com/common/discovery/v2.0/keys'
)