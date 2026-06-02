
from flask import request, jsonify, g
from models import db, User
from flask_restful import Resource
from werkzeug.security import generate_password_hash, check_password_hash # Remove password hashing from models.py and use werkzeug here for better integration with Flask
# from auth.permissions import admin_required, manager_required
from auth.permissions import require_admin, require_manager
from auth.jwt import generate_token
# from auth.jwt import token_required, generate_token, jwt_required

# NOTE : password_hash is the column name in the User model.


# List all users in the system. Admin required.
class UsersList ( Resource ) :
    # /api/users

    # Admin required.
    # @jwt_required
    # @admin_required
    # @token_required
    
    def get ( self ) :

        admin = require_admin ()

        if not admin :
            return { "error" : "Admin access required." }, 403
        
        try :
            users = User.query.all ()

            return jsonify ( [ {
                "id" : user.id,
                "username" : user.username,
                "email" : user.email,
                "role" : user.role,
                "created_at" : str( user.created_at.isoformat() ) if user.created_at else None,
                "updated_at" : str( user.updated_at.isoformat() ) if user.updated_at else None
            } for user in users ] )

        except Exception as e :
            return { "error" : str (e) }, 500



class CreateUser ( Resource ) :
    # /api/users/create

    # Create new user
    # Admin required
    # @token_required
    # @admin_required
    def post ( self ) :

        admin = require_admin ()

        if not admin :
            return { "error" : "Admin access required." }, 403

        try :

            data = request.get_json ()

            # Validate input
            if not data.get( "username" ) or not data.get ( "email" ) or not data.get ( "password" ) or not data.get ( "role" ):
                return { "error" : "Username, email, password and role are required." }, 400

            # Check if the username or email already exists
            if User.query.filter_by ( username = data [ "username" ] ).first () :
                return { "error" : "Username already exists." }, 400
            
            # Check if the email already exists
            if User.query.filter_by ( email = data [ "email" ] ).first () :
                return { "error" : "Email already exists." }, 400
            
            # Collecting new user data.
            user = User (
                username = data [ "username" ],
                email = data [ "email" ],
                # Hashing the password before storing
                password_hash = generate_password_hash ( data [ "password" ] ),
                role = data.get ( "role", "manager" ) # Defaults to manager
            )

            db.session.add ( user )
            db.session.commit ()
        
        except Exception as e :
            db.session.rollback ()
            return { "error" : str(e) }, 500

        return { "message" : f"User ID: {user.id}, name {user.username} registered successfully." }



class UserLogin ( Resource ) :
    # /api/users/login

    # Login user
    def post ( self ) :

        try :

            data = request.get_json ()

            if not data or not data.get ( "username" ) or not data.get ( "password" ) :
                return { "error" : "Missing credentials."}, 400

            user = User.query.filter_by ( username = data [ "username" ] ).first()

            if not user or not check_password_hash ( user.password_hash, data [ "password" ] ) :
                return { "error" : "Invalid username or password." }, 401
            
            # Generate JWT token
            token = generate_token ( str( user.id ), "admin" if user.role == "admin" else "manager" )

            return {
                "token" : token,
                "user" : {
                    "id" : user.id,
                    "username" : user.username,
                    "email" : user.email,
                    "role" : user.role
                },
                "message" : f"Logged in successfully. Welcome { user.username }!"
            }, 200
        
        except Exception as e :
            return { "error" : str (e) }, 500



class UserDetails ( Resource ) :
    # /api/users/<int:user_id>

    # Show logged in User details.
    # @token_required
    def get ( self, user_id ) :

        try :
            # # Authorization to allow user to view their own details or allow admin to view any user's details.
            # if g.current_user_id != user_id and g.current_user.role != "admin" :
            #     return { "error" : "Unauthorized access." }, 403

            # Authorization to allow admin or logged in user to view their own details.
            manager = require_manager ()

            if not manager :
                return { "error" : "Unauthorized. Manager access required." }, 403

            if manager.id != user_id and manager.role != "admin" :
                return { "error" : "Unauthorized access." }, 403
            
            user = User.query.get ( user_id )
            
            if not user :
                return { "error" : "User not found." }, 404
            
            return {
                "id" : user.id,
                "username" : user.username,
                "email" : user.email,
                "role" : user.role,
                "created_at" : str( user.created_at.isoformat() ) if user.created_at else None,
                "updated_at" : str( user.updated_at.isoformat() ) if user.updated_at else None
            }
        
        except Exception as e :
            return { "error" : f"Failed to fetch user : { str (e) }" }, 500
    

    # Update user details (username, email, password).
    # Admin required
    # @token_required
    # @admin_required
    def put ( self, user_id ) :

        admin = require_admin ()

        if not admin :
            return { "error" : "Admin access required." }, 403

        try :

            user = User.query.get ( user_id )

            if not user :
                return { "error" : "User not found." }, 404
            
            data = request.get_json ()

            if data.get ( "username" ) :
                # Check whether username is already taken
                # if User.query.filter_by ( username = data [ "username" ]).filter ( User.id != user_id ).first ():
                #     return { "error" : "Username already exists." }, 400
                if user.username == data [ "username" ] and User.query.filter_by ( username = data [ "username" ]).first () :
                    return { "error" : "Username already exists." }, 400
                else :
                    user.username = data [ "username" ]
            
            if data.get ( "email" ) :
                user.email = data [ "email" ]
            
            if data.get ( "password" ) :
                user.password_hash = generate_password_hash ( data [ "password" ] )
            
            if data.get ( "role" ) :
                valid_roles = [ "admin", "manager" ]
                # Validate roles
                if data [ "role" ] not in valid_roles :
                    return { "error" : f"Invalid role. Valid roles are: {', '.join ( valid_roles ) }." }, 400

                user.role = data [ "role" ]
            
            # Update the timestamp for when the user details were last updated.
            user.updated_at = db.func.now ()
            
            db.session.commit ()

            new_user = User.query.get ( user_id )

            return { "message" : f"User { new_user.username } details updated successfully." }
        
        except Exception as e :
            db.session.rollback ()
            return { "error" : str (e) }, 500
    

    # Delete user account.
    # Admin required.
    # @token_required
    # @admin_required
    def delete ( self, user_id ) :

        admin = require_admin ()

        if not admin :
            return { "error" : "Admin access required." }, 403

        try :

            user = User.query.get ( user_id )

            if not user :
                return { "error" : "User not found." }, 404
            
            # Prevent admin from deleting their own account to avoid accidental lockout.
            # if user.id == g.current_user_id :
            if user.id == admin.id :
                return { "error" : "Cannot delete your own account." }, 400
            
            db.session.delete ( user )
            db.session.commit ()

            return { "message" : "User account deleted successfully." }
        
        except Exception as e :
            db.session.rollback ()
            return { "error" : f"Failed to delete user : { str (e) }" }, 500


class UserLogout(Resource):

    def post(self):

        bearer = request.headers.get("Authorization")

        if not bearer or not bearer.startswith("Bearer "):
            return {"error": "Token missing"}, 401

        token = bearer.split(" ")[1]

        blacklist = TokenBlacklist(token=token)

        db.session.add(blacklist)
        db.session.commit()

        return {"message": "Logged out successfully"}, 200