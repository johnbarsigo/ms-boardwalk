
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from auth.jwt import generate_token
from models import db, timedelta

from routes.users import UsersList, CreateUser, UserLogin, UserDetails
from routes.rooms import RoomsList, RoomDetails
from routes.tenants import CreateTenantOccupancy, TenantsList, TenantDetails, TenantLedger, TenantOccupancies
from routes.billings import GenerateMonthlyBillings, BillingsList, BillingDetails
from routes.payments import PaymentsList, RecordPayment, PaymentDetails
from routes.reports import GenerateArrearsReport, GenerateIncomeReport
from routes.occupancies import Occupancies, OccupancyDetails, EndOccupancy


def create_app ( ) :

    load_dotenv () # Load environment variables from .env file if it exists

    app = Flask ( __name__ )

    # Load configuration from environment variables

    app.config [ "SQLALCHEMY_DATABASE_URI" ] = os.getenv ( "DATABASE_URL" )
    app.config [ "SQLALCHEMY_TRACK_MODIFICATIONS" ] = False
    
    app.config [ "JWT_SECRET_KEY" ] = os.getenv ( "JWT_SECRET_KEY", "e7ba32d2feaa467398beb846112494c5" )
    # Set JWT token expiration time
    app.config [ "JWT_ACCESS_TOKEN_EXPIRES" ] = timedelta ( hours = 1 ) 

    # Initialize extensions

    CORS (
        app,
        supports_credentials = True,
        origins = [ "http://localhost:3000" ],
        allow_headers = [ "Content-Type", "Authorization" ]
    )
    db.init_app ( app )
    # Initiate JWT extension with Flask app
    jwt = JWTManager ( app )
    jwt.init_app( app )
    Migrate ( app, db )

    api = Api ( app )

    # Register API resources
    # USERS
    api.add_resource ( UsersList, "/api/users" )
    api.add_resource ( CreateUser, "/api/users/create" )
    api.add_resource ( UserLogin, "/api/users/login" )
    api.add_resource ( UserDetails, "/api/users/<int:user_id>" )

    # ROOMS
    api.add_resource ( RoomsList, "/api/rooms" )
    api.add_resource ( RoomDetails, "/api/rooms/<int:room_id>" )

    # TENANTS
    api.add_resource ( TenantsList, "/api/tenants" )
    api.add_resource ( TenantDetails, "/api/tenants/<int:tenant_id>")
    api.add_resource ( CreateTenantOccupancy, "/api/tenants/check-in" ) # Handles both new tenant-occupancy instances (NEW TENANT) and new occupancies for existing tenants (ROOM SWITCH).
    api.add_resource ( TenantOccupancies, "/api/tenants/<int:tenant_id>/occupancies" )
    api.add_resource ( TenantLedger, "/api/tenants/<int:tenant_id>/ledger" )

    # OCCUPANCIES
    api.add_resource ( Occupancies, "/api/occupancies" )
    api.add_resource ( OccupancyDetails, "/api/occupancies/<int:occupancy_id>" )
    api.add_resource ( EndOccupancy, "/api/occupancies/<int:occupancy_id>/end")

    # BILLINGS
    api.add_resource ( GenerateMonthlyBillings, "/api/billings/generate" )
    api.add_resource ( BillingsList, "/api/billings" )
    api.add_resource ( BillingDetails, "/api/billings/<int:billing_id>" )

    # PAYMENTS
    api.add_resource ( PaymentsList, "/api/payments" )
    api.add_resource ( RecordPayment, "/api/payments/record" )
    api.add_resource ( PaymentDetails, "/api/payments/<int:payment_id>" )

    # REPORTS
    api.add_resource ( GenerateArrearsReport, "/api/reports/arrears" )
    api.add_resource ( GenerateIncomeReport, "/api/reports/income" )

    return app


app = create_app ()

if __name__ == "__main__" :
    app.run ( debug = True, port = 5555 )


# ===============TO-DO/THINKPAD===============
# Separate all tenants with active tenants, where room_id is NOT NULL
# Delete Occupancy does not delete the associated tenant, good
# Delete Tenant should end occupancy; set end_date, set Room as available
# Keep DEL tenant ( commented out ) but find a way to keep occupancy records when deleting the tenant, which can only be done after deleting occupancy ( conundrum )
# month in MonthlyCharge -Validate entering month number between 1 and 12 Can convert to month name in frontend if needed.
# FIX DOUBLE BILLING IF USER SWITCHED ROOMS WITHIN THE SAME MONTH, which creates 2 occupancies in the same month, and thus 2 billings. Can add a check in the GenerateMonthlyBillings endpoint to check if there are existing billings for the same month and year before creating a new one. We can also add a unique constraint on the MonthlyCharge model to prevent duplicate billings for the same occupancy and month. =================billings.py line 44