
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()



class User ( db.Model ) :

    __tablename__ = "users"

    id = db.Column ( db.Integer, primary_key = True )
    username = db.Column ( db.String ( 255 ), unique = True, nullable = False )
    email = db.Column ( db.String ( 255 ), unique = True, nullable = False )
    password_hash = db.Column ( db.String ( 255 ), nullable = False )

    # Roles created so far : Admin, Manager
    role = db.Column (
        db.Enum ( "admin", "manager", name = "user_roles" ),
        nullable = False,
        default = "manager" )
        
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )
    updated_at = db.Column ( db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow )


    def __repr__ ( self ) :
        return f"<User { self.username }>"
    


class Room ( db.Model ) :

    __tablename__ = "rooms"

    id = db.Column ( db.Integer, primary_key = True )
    room_number = db.Column ( db.String ( 3 ), unique = True, nullable = False )
    capacity = db.Column ( db.Integer, nullable = False, default = 1 )
    default_rent = db.Column ( db.Numeric (10, 2), nullable = False )
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )
    status = db.Column ( db.Enum ( "available", "occupied", name = "room_status" ), nullable = False, default = "available" )

    def __repr__ ( self ) :
        return f"<Room { self.room_number }>"
    

class Tenant ( db.Model ) :

    __tablename__ = "tenants"

    id = db.Column ( db.Integer, primary_key = True )
    name = db.Column ( db.String ( 255 ), nullable = False )
    email = db.Column ( db.String ( 255 ), unique = True, nullable = False )
    phone = db.Column ( db.String ( 20 ), nullable = True )
    national_id = db.Column ( db.String ( 10), unique = True, nullable = False )
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )
    updated_at = db.Column ( db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow )

    def __repr__ ( self ) :
        return f"<Tenant { self.id } - { self.name }>"
    

class Occupancy ( db.Model ) :

    __tablename__ = "occupancies"

    id = db.Column ( db.Integer, primary_key = True )
    tenant_id = db.Column ( db.Integer, db.ForeignKey ( "tenants.id" ), nullable = False )
    room_id = db.Column ( db.Integer, db.ForeignKey ( "rooms.id" ), nullable = False )
    agreed_rent = db.Column ( db.Numeric (10, 2), nullable = False )
    damages_or_dues = db.Column(db.Numeric (10, 2), nullable=True, default=0.0)
    damages_reason = db.Column(db.String (255), nullable=True)
    start_date = db.Column ( db.Date, nullable = False )
    end_date = db.Column ( db.Date, nullable = True )
    check_in_notes = db.Column ( db.String (255), nullable = True )
    check_out_notes = db.Column ( db.String (255), nullable = True )
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )
    # Add updated_at to track when occupancy details are modified (e.g., rent changes, early termination).
    updated_at = db.Column ( db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow )

    # Relationships
    tenant = db.relationship ( "Tenant", backref = "occupancies" )
    room = db.relationship ( "Room", backref = "occupancies" )

    def __repr__ ( self ) :
        return f"<Occupancy { self.id } - Tenant { self.tenant_id } in Room { self.room_id } started on { self.start_date }>"


class MonthlyCharge ( db.Model ) :

    __tablename__ = "monthly_charges"

    id = db.Column ( db.Integer, primary_key = True )
    occupancy_id = db.Column ( db.Integer, db.ForeignKey ( "occupancies.id" ), nullable = False )
    rent_amount = db.Column ( db.Numeric (10, 2), nullable = False )
    water_bill = db.Column ( db.Numeric (10, 2), nullable = False )
    month = db.Column ( db.Integer, nullable = False, default = datetime.utcnow().month ) # Store month as integer (1-12) for easier filtering and to avoid issues with different languages/ spellings.
    year = db.Column ( db.Integer, nullable = False )
    charge_date = db.Column ( db.Date, nullable = False )
    total_amount = db.Column ( db.Numeric(10, 2), nullable = True, default = rent_amount + water_bill )
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )
    updated_at = db.Column ( db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow )

    # Constraint to counter duplicate billing for the same month and year
    __table_args__ = (
        db.UniqueConstraint ( "occupancy_id", "month", "year" , name = "unique_monthly_charge" ),
    )

    # Relationships
    occupancy = db.relationship ( "Occupancy", backref = "monthly_charges" )

    def __repr__ ( self ) :
        return f"<MonthlyCharge { self.id } - Occupancy { self.occupancy_id } charged rent { self.rent_amount }, water bill { self.water_bill }, other charges { self.other_charges } on { self.charge_date }>"
    


class Payment ( db.Model ) :

    __tablename__ = "payments"

    id = db.Column ( db.Integer , primary_key = True )

    tenant_id = db.Column ( db.Integer, db.ForeignKey ( "tenants.id" ), nullable = False )
    monthly_charge_id = db.Column ( db.Integer, db.ForeignKey( "monthly_charges.id" ), nullable = False )
    status = db.Column ( db.Enum ( "pending", "completed", "failed", name = "payment_status" ), nullable = False, default = "pending" )
    amount = db.Column ( db.Numeric (10, 2), nullable = False )
    method = db.Column ( db.Enum( "mpesa", "cash", "bank", name="payment_methods" ) )
    mpesa_receipt = db.Column ( db.String (100), nullable=True )

    payment_date = db.Column ( db.Date, nullable=False )
    created_at = db.Column ( db.DateTime, default = db.func.current_timestamp() )

    # Relationships
    monthly_charge = db.relationship ( "MonthlyCharge", backref = "payments" )

    def __repr__ ( self ) :
        return f"Payment {self.id} for monthly charge ID :{self.monthly_charge_id}, through {self.method} on {self.payment_date}"


class Notification ( db.Model ) :

    __tablename__ = "notifications"

    id = db.Column ( db.Integer, primary_key = True )
    occupancy_id = db.Column ( db.Integer, db.ForeignKey ( "occupancies.id" ) )
    message = db.Column ( db.String ( 255 ) )
    sent_at = db.Column ( db.DateTime )
    status = db.Column ( db.Enum ( "pending", "sent", "failed", name = "notification_status" ) )


# Model to handle user logout by blacklisting JWT tokens. This will allow us to invalidate tokens upon logout, preventing their further use until they expire.

class TokenBlacklist ( db.Model ) :

    __tablename__ = "token_blacklist"

    id = db.Column ( db.Integer, primary_key = True )
    # jti = db.Column ( db.String ( 255 ), unique = True, nullable = False ) # JWT ID, a unique identifier for each token
    token = db.Column(db.Text, nullable=False)
    created_at = db.Column ( db.DateTime, default = datetime.utcnow )