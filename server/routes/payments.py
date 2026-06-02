
from flask import request, jsonify
from flask_restful import Resource
# from auth.permissions import admin_required, manager_required
# from auth.jwt import token_required
from auth.permissions import require_admin, require_manager
from models import db, Payment, MonthlyCharge
from datetime import datetime


class PaymentsList ( Resource ) :

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    # api/payments
    def get ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        payments = Payment.query.all()

        return [ {
            "id" : p.id,
            "tenant_id" : p.tenant_id,
            "monthly_charge_id" : p.monthly_charge_id,
            "amount" : int (p.amount),
            "method" : p.method if p.method else None,
            "status" : p.status,
            "payment_date" : str (p.payment_date)
        } for p in payments ], 200


class RecordPayment ( Resource ) :

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def post ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        data = request.get_json ()

        charge = MonthlyCharge.query.get ( data [ "monthly_charge_id" ] )

        if not charge :
            return { "error" : "Charge not found." }, 404
        
        if not isinstance ( data [ "amount" ], ( int, float ) ) :
            return { "error" : "Invalid payment amount. Must be a number." }, 422

        if data [ "amount" ] <= 0 :
            return { "error" : "Invalid payment amount." }, 422
        
        if data [ "method" ] not in [ "mpesa", "card", "cash" ] :
            return { "error" : "Invalid payment method." }, 422
        
        payment = Payment (
            tenant_id = charge.occupancy.tenant_id,
            monthly_charge_id = charge.id,
            amount = data [ "amount" ],
            method = data [ "method" ],
            # payment_date = datetime.strptime ( data [ "payment_date" ], "%Y-%m-%d" )
            payment_date = datetime.utcnow() if not data.get ( "payment_date" ) else datetime.strptime ( data [ "payment_date" ], "%Y-%m-%d" )
        )

        db.session.add ( payment )
        db.session.commit ()

        return { "message" : f"Payment for tenant id { charge.occupancy.tenant_id }, { charge.occupancy.tenant.name } recorded." }, 201


class PaymentDetails ( Resource ) :

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self, payment_id ) :

        payment = Payment.query.get ( payment_id )

        if not payment :
            return { "error" : "Payment not found" }, 404
        
        return {
            "id" : payment.id,
            "tenant_id" : payment.tenant_id,
            "monthly_charge_id" : payment.monthly_charge_id,
            "amount" : int (payment.amount),
            "method" : payment.method if payment.method else None,
            "payment_date" : str (payment.payment_date.isoformat()),
            "created_at" : str (payment.created_at.isoformat())
        }
