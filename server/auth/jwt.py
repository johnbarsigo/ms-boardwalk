
# from flask_jwt_extended import get_jwt, decode_token, create_access_token, jwt_required as jwt_required_decorator
# from datetime import datetime, timedelta
# from flask import current_app, g, jsonify
# from functools import wraps
# from models import User



# # Generate JWT access token
# def generate_token ( user_id, user_role ) :

#     # Convert user_id to string for JWT encoding
#     user_id_string = str ( user_id ) if not isinstance ( user_id, str ) else user_id

#     # Create JWT token with user role in claims.
#     additional_claims = { "role" : user_role }
#     token = create_access_token (
#         identity = user_id_string,
#         additional_claims = additional_claims
#     )

#     return token



# def jwt_required ( f ) :

#     # This is a decorator to only decode and verify the JWT token. It does not load the user from the database. Use this for cases where you want to verify the token but don't necessarily need to load a user from the database (e.g. for M-Pesa callbacks where we might only want to verify the token and not load a user).

#     @wraps ( f )
#     @jwt_required_decorator () # Verify JWT token.
#     def decorated ( *args, **kwargs ) :

#         try :
#             token_data = get_jwt ()
#             user_id_string = token_data.get ( "sub" )

#             if not user_id_string :
#                 return { "error" : "Invalid token structure." }, 401
            
#             # Convert user_id_string back to int
#             user_id = int( user_id_string )
            
#             # Store user ID in g for downstream use if needed
#             g.current_user_id = user_id
        
#         except ValueError :
#             return { "error" : "Invalid user ID token." }, 401
#         except Exception as e :
#             return { "error" : f"Authentication failed: { str(e) }"}, 401
        
#         return f ( *args, **kwargs )
#     return decorated


# # def token_required ( f ) :

# #     # Combined decorator that verifies JWT token (@jwt_required) and loads the user from the database (@token_required). This allows us to access the current user in downstream decorators like @admin_required without needing to decode the token multiple times.

# #     @wraps ( f )
# #     @jwt_required_decorator () # Verify JWT token.
# #     def decorated ( *args, **kwargs ) :

# #         try :
# #             token_data = get_jwt ()
# #             user_id_string = token_data.get ( "sub" )

# #             if not user_id_string :
# #                 return { "error" : "Invalid token structure." }, 401
            
# #             # Convert user_id_string back to int
# #             user_id = int( user_id_string )
            
# #             # Lookup user in database.
# #             user = User.query.get ( user_id )
# #             if not user :
# #                 return { "error" : "User not found." }, 404
            
# #             # Store both ID and user object for downstream decorators
# #             g.current_user_id = user_id
# #             g.current_user = user
        
# #         except ValueError :
# #             return { "error" : "Invalid user ID token." }, 401
# #         except JWTExtendedException as e :
# #             return { "error" : f"JWT verification failed: { str(e) }" }, 401
# #         except Exception as e :
# #             return { "error" : f"Authentication failed: { str(e) }"}, 401
        
# #         return f ( *args, **kwargs )
    
# #     return decorated

# def token_required ( f ) :

#     # This is a token_required only decorator. @jwt_required has to be applied separately. Use this for cases where you want to verify the token but don't necessarily need to load the user from the database (e.g. for M-Pesa callbacks where we might only want to verify the token and not load a user).

#     @wraps ( f )
#     @jwt_required_decorator () # Verify JWT token.
#     def decorated ( *args, **kwargs ) :

#         try :
#             token_data = get_jwt ()
#             user_id_string = token_data.get ( "sub" )

#             if not user_id_string :
#                 return { "error" : "Invalid token structure." }, 401
            
#             # Convert user_id_string back to int
#             user_id = int( user_id_string )
            
#             # Store user ID in g for downstream use if needed
#             g.current_user_id = user_id
        
#         except ValueError :
#             return { "error" : "Invalid user ID token." }, 401
#         except JWTExtendedException as e :
#             return { "error" : f"JWT verification failed: { str(e) }" }, 401
#         except Exception as e :
#             return { "error" : f"Authentication failed: { str(e) }"}, 401
        
#         return f ( *args, **kwargs )
#     return decorated





# # def verify_token_manually(token):
# #     """
# #     Manually verify and decode a token
    
# #     Use this for:
# #     - M-Pesa callbacks (external requests)
# #     - Background jobs
# #     - Any context where flask-jwt-extended decorators don't work
    
# #     Args:
# #         token (str): The JWT token to verify
        
# #     Returns:
# #         tuple: (user_id, error_message) or (None, error_message) if invalid
        
# #     Example:
# #         user_id, error = verify_token_manually(token)
# #         if error:
# #             return {"error": error}, 401
# #     """
# #     try:
# #         payload = decode_token(token)
# #         user_id_string = payload.get("sub")
        
# #         if not user_id_string :
# #             return None, "Invalid token structure"
        
# #         user_id = int( user_id_string )
        
# #         return user_id, None
# #     except ValueError :
# #         return { "error" : "Invalid user ID token." }
# #     except Exception as e:
# #         return None, f"Token verification failed: {str(e)}"



import jwt
from datetime import datetime, timedelta
from flask import current_app
from models import User, TokenBlacklist

DEFAULT_SECRET_KEY = "e7ba32d2feaa467398beb846112494c5"

def generate_token(user_id, role):

    user_id_string = str(user_id) if not isinstance(user_id, str) else user_id
    

    payload = {
        "id": user_id_string,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    token = jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256"
    )

    return token


def decode_token (token) :
    try:

        payload = jwt.decode ( 
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms = [ "HS256" ]
        )
    
    except jwt.ExpiredSignatureError :
        return None
    
    except jwt.InvalidTokenError :
        return None
    
    # Logout functionality: Check if token is blacklisted (i.e. user logged out before token expiration)
    blacklisted = TokenBlacklist.query.filter_by(token=token).first()
    
    if blacklisted:
        return None
    

    if payload ["role"] == "admin" :
        return User.query.get ( payload ["id"] )

    elif payload ["role"] == "manager" :
        return User.query.get ( payload ["id"] )
    
    return None