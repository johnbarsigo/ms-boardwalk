
# from flask import request, g, jsonify
# from functools import wraps
# from models import User


# current_user = "current_user" # Define a constant for the g attribute name to avoid typos and ensure consistency across decorators.
# # Checks user.role == "admin". Requires @token_required (which has @jwt_required inside) to be applied first.
# def admin_required ( f ) :

#     @wraps ( f )
#     def decorated ( *args, **kwargs ) :

#         if not hasattr ( g, current_user ) :
#             return { "error" : "Authentication required. Current user not recognized" }, 401
        
#         if g.current_user.role != "admin" :
#             return { "error" : "Admin access required." }, 403
        
#         return f ( *args, **kwargs )

#     return decorated


# # Checks user.role == "manager". Requires @token_required (which has @jwt_required inside) to be applied first.

# def manager_required ( f ) :

#     @wraps ( f )
#     def decorated ( *args, **kwargs ) :
        
#         if not hasattr ( g, current_user ) :
#             return { "error" : "Authentication required. Current user not recognized" }, 401
        
#         if g.current_user.role not in [ "admin", "manager" ] :
#             return { "error" : "Manager access required." }, 403
        
#         return f ( *args, **kwargs )

#     return decorated




from flask import request
from auth.jwt import decode_token
from models import User

def get_current_user () :

    bearer = request.headers.get ( "Authorization" )

    if not bearer or not bearer.startswith ( "Bearer " ) :
        return None
    
    token = bearer.split ( " " )[ 1 ]

    return decode_token ( token )


def require_admin () :

    user = get_current_user ()

    if not isinstance ( user, User ) or user.role != "admin" :
        return None
    
    return user

def require_manager() :

    user = get_current_user ()

    if not isinstance ( user, User ) or user.role not in [ "manager", "admin" ] :
        return None
    
    return user