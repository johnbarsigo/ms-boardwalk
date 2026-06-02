
from flask import request, jsonify
from flask_restful import Resource
# from auth.permissions import admin_required, manager_required
# from auth.jwt import token_required
from auth.permissions import require_admin, require_manager
from models import db, Tenant, Occupancy, MonthlyCharge, Payment
from sqlalchemy import func


class GenerateArrearsReport ( Resource ) :

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        results = db.session.query (
            Tenant.id,
            Tenant.name,
            func.sum (MonthlyCharge.rent_amount + MonthlyCharge.water_bill ).label ( "total_billed" ),
            func.coalesce ( func.sum ( Payment.amount ), 0 ).label ( "total_paid" )
        ).join ( Occupancy, Occupancy.tenant_id == Tenant.id ) \
        .join ( MonthlyCharge, MonthlyCharge.occupancy_id == Occupancy.id ) \
        .outerjoin ( Payment, Payment.monthly_charge_id == MonthlyCharge.id ) \
        .group_by ( Tenant.id ).all()

        report = []

        for r in results :
            balance = float ( r.total_billed) - float ( r.total_paid )

            # Negative balance means tenant has overpaid, so we can include all tenants with non-zero balance to show both those in arrears and those with credit.

            if balance != 0 :
                report.append ( {
                    "tenant_id" : r.id,
                    "name" : r.name,
                    "total billed" : float ( r.total_billed ),
                    "total_paid" : float ( r.total_paid ),
                    "balance" : balance
                } )
        
        return report


# Resource for generating income report for a given month and year. By default, show the entire income for the current year, but allow filtering by month and year via query parameters.
class GenerateIncomeReport ( Resource ) :

    # Admin required.
    # @token_required
    # @admin_required

    # def get ( self ) :

    #     admin = require_admin ()

    #     data = request.get_json ()

    #     if not admin :
    #         return { "error" : "Unauthorized. Admin access required." }, 403

    #     month = data [ "month" ]
    #     year = data [ "year" ]

    #     query = db.session.query (
    #         func.sum ( Payment.amount ).label ( "total_income" )
    #     ).join ( MonthlyCharge, MonthlyCharge.id == Payment.monthly_charge_id )

    #     if month :
    #         try :
    #             month = int ( month )
    #             query = query.filter ( func.extract ( "month", MonthlyCharge.charge_date ) == month )
    #         except ValueError :
    #             return { "error" : "Month must be an integer." }, 400

    #     if year :
    #         try :
    #             year = int ( year )
    #             query = query.filter ( func.extract ( "year", MonthlyCharge.charge_date ) == year )
    #         except ValueError :
    #             return { "error" : "Year must be an integer." }, 400

    #     results = query.all()

    #     total_income = results[0].total_income or 0

    #     return { "total_income" : total_income }


    def get ( self ) :

        admin = require_admin ()

        data = request.get_json ()

        if not admin :
            return { "error" : "Unauthorized. Admin access required." }, 403

        # month = request.args.get ( "month" )
        # year = request.args.get ( "year" )
        
        month = data [ "month" ]
        year = data [ "year" ]

        if not month or not year :
            return { "error" : "Month and year query parameters are required." }, 400

        try :
            month = int ( month )
            year = int ( year )
        except ValueError :
            return { "error" : "Month and year must be integers." }, 400

        results = db.session.query (
            func.sum ( Payment.amount ).label ( "total_income" )
        ).join ( MonthlyCharge, MonthlyCharge.id == Payment.monthly_charge_id ) \
        .filter ( func.extract ( "month", MonthlyCharge.charge_date ) == month ) \
        .filter ( func.extract ( "year", MonthlyCharge.charge_date ) == year ).all()

        total_income = results[0].total_income or 0

        return { "total_income" : total_income }