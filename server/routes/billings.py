
from flask import request, jsonify
from flask_restful import Resource
# from auth.permissions import admin_required, manager_required
# from auth.jwt import token_required
from auth.permissions import require_admin, require_manager
from models import db, MonthlyCharge, Occupancy
from datetime import datetime, date


class GenerateMonthlyBillings ( Resource ) :
    # /api/billings/generate

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def post ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        data = request.get_json()

        month  = data [ "month" ] # Insert number for month (1, 2, 3...12)
        year = data [ "year" ]

        active_occupancies = Occupancy.query.filter ( Occupancy.end_date == None ).all()

        # Counter for number of billings created.
        created = 0

        db.session.begin_nested()  # Start a nested transaction

        try :

            for o in active_occupancies :
                existing = MonthlyCharge.query.filter_by (
                    occupancy_id = o.id,
                    month = month,
                    year = year
                ).first()

                if existing :
                    continue

                if data [ "water_bill" ] < 0 :
                    return { "error" : "Invalid water bill" }, 422

                # # Add check to prevent double billing if user switched rooms within the same month, which creates 2 occupancies in the same month, and thus 2 billings. Can add a check in the GenerateMonthlyBillings endpoint to check if there are existing billings for the same month and year before creating a new one. We can also add a unique constraint on the MonthlyCharge model to prevent duplicate billings for the same occupancy and month.
                # if Occupancy.query.filter (
                #     Occupancy.tenant_id == o.tenant_id,
                #     Occupancy.start_date <= date ( year, month, 1 ),
                #     ( Occupancy.end_date == None ) | ( Occupancy.end_date >= date ( year, month, 1 ) )
                # ).count() > 1 :
                #     continue

                charge = MonthlyCharge (
                    occupancy_id = o.id,
                    month = month,
                    year = year,
                    rent_amount = o.agreed_rent,
                    water_bill = data.get ( "water_bill", 0 ),
                    charge_date = date.today(),
                    total_amount = o.agreed_rent + data.get ( "water_bill", 0 ),
                    created_at = date.today()
                )

                db.session.add ( charge )
                created +=1
            
            db.session.commit ()
        
        except IntegrityError :

            db.session.rollback ()

            return { "error" : "Integrity error. Possible duplicate billing record." }, 400

        return { "message" : f" {created} monthly charges created. " }, 201



class BillingsList ( Resource ) :
    # /api/billings

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        billings = MonthlyCharge.query.all()

        return [ {
            "id" : b.id,
            "tenant_id" : b.occupancy.tenant_id,
            "tenant_name" : b.occupancy.tenant.name,
            "occupancy_id" : b.occupancy_id,
            "room_id" : b.occupancy.room_id,
            "room_number" : b.occupancy.room.room_number,
            "month" : b.month,
            "year" : b.year,
            "rent_amount" : int (b.rent_amount),
            "water_bill" : int (b.water_bill) if b.water_bill else 0,
            "total_amount" : int (b.total_amount) if b.total_amount else 0,
            "charge_date" : str (b.charge_date.isoformat()),
            "created_at" : str (b.created_at.isoformat()),
            "updated_at" : str (b.updated_at.isoformat()) if b.updated_at else None
        } for b in billings ], 200



class BillingDetails ( Resource ) :
    # /api/billings/<int:billing_id>

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self, billing_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        billing = MonthlyCharge.query.get ( billing_id )

        if not billing :
            return { "error" : "Billing record not found." }, 404
        
        return {
            "id" : billing.id,
            "occupancy_id" : billing.occupancy_id,
            "month" : billing.month,
            "year" : billing.year,
            "rent_amount" : int (billing.rent_amount),
            "water_bill" : int (billing.water_bill),
            # "other_charges" : billing.other_charges,
            "charge_date" : str (billing.charge_date.isoformat()),
            "created_at" : str (billing.created_at.isoformat()),
            "updated_at" : str (billing.updated_at.isoformat()) if billing.updated_at else None
        }, 200
    

    def put ( self, billing_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        billing = MonthlyCharge.query.get ( billing_id )

        if not billing :
            return { "error" : "Billing record not found." }, 404
        
        data = request.get_json()

        if data.get ( "rent_amount" ) :
            billing.rent_amount = data [ "rent_amount" ]
        if data.get ( "water_bill" ) :
            billing.water_bill = data [ "water_bill" ]
        # billing.rent_amount = data.get ( "rent_amount", billing.rent_amount )
        # billing.water_bill = data.get ( "water_bill", billing.water_bill )
        billing.updated_at = datetime.utcnow()

        db.session.commit ()

        return { "message" : f"Billing record updated at { str(billing.updated_at) } successfully." }, 200
    

    def delete ( self, billing_id ) :

        admin = require_admin ()

        if not admin :
            return { "error" : "Admin access required." }, 403
        
        billing = MonthlyCharge.query.get ( billing_id )

        if not billing :
            return { "error" : "Billing record not found." }, 404

        db.session.delete ( billing )
        db.session.commit ()

        return { "message" : "Billing record deleted successfully." }, 200