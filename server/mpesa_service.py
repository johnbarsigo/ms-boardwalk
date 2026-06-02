
import requests
import json
from datetime import datetime
from models import db, Payment, Occupancy


class MpesaService :

    # Handling Mpesa C2B transactions

    def __init__ ( self ) :

        self.paybill = "YOUR PAYBILL NUMBER"
        self.consumer_key = os.getenv ( "MPESA_CONSUMER_KEY" )
        self.consumer_secret = os.getenv ( "MPESA_CONSUMER_SECRET" )
        self.mpesa_base_url = "https://sandbox.safaricom.co.ke" # Change to production URL when going live
    

    def get_access_token ( self ) :

        # Get Mpesa access token
        url = f"{self.mpesa_base_url}/oauth/v1/generate?grant_type=client_credentials"

        response = requests.get ( url, auth = ( self.consumer_key, self.consumer_secret ) )

        return response.json ( ) [ "access_token" ]
    

    def c2b_simulate ( self, phone, amount, account_ref ) :

        # Simulate a C2B transaction for testing purposes.
        url = f"{self.mpesa_base_url}/mpesa/c2b/v1/simulate"
        headers = {
            "Authorization" : f"Bearer { self.get_access_token ( ) }",
            "Content-Type" : "application/json"
        }
        payload = {
            "ShortCode" : self.paybill,
            "CommandID" : "CustomerPayBillOnline",
            "Amount" : amount,
            "Msisdn" : phone,
            "BillRefNumber" : account_ref
        }
        response = requests.post ( url, headers = headers, data = json.dumps ( payload ) )

        return response.json ()

        # TESTING THE ABOVE METHOD
        # mpesa_service = MpesaService ( )
        # response = mpesa_service.c2b_simulate ( phone = "25471234567", amount = 1000, account_ref = "TestPayment" )
        # print (response)
    

    def register_url ( self ) :

        # Register the confirmation and validation URLs with Mpesa
        token = self.get_access_token ()
        url = f"{self.mpesa_base_url}/mpesa/c2b/v1/registerurl"

        headers = {
            "Authorization" : f"Bearer {token}",
            "Content-Type" : "application/json"
        }

        payload = {
            "ShortCode" : self.paybill,
            "ResponseType" : "Completed",
            "ConfirmationURL" : os.getenv ( "MPESA_CONFIRMATION_URL", "https://yourdomain.com/confirmation" ),
            "ValidationURL" : os.getenv ( "MPESA_VALIDATION_URL", "https://yourdomain.com/validation" )
        }

        # Make request to register URLs
        response = requests.post ( url, headers = headers, data = json.dumps ( payload ) )
        return response.json ()
    

    def handle_c2b_callback ( self, data ) :

        #  Handle the C2B callback from Mpesa and record the payment in the database.

        # Understand and test the code below. **IMPORTANT**: Ensure that the "BillRefNumber" sent in the C2B simulation matches the occupancy ID or a reference that can be used to identify the tenant and charge in your system.
        try :
            # Extract relevant data from the callback
            phone = data [ "Msisdn" ]
            amount = data [ "TransAmount" ]
            account_ref = data [ "BillRefNumber" ]
            receipt_number = data [ "MpesaReceiptNumber" ]
            transaction_date = datetime.strptime ( data [ "TransTime" ], "%Y%m%d%H%M%S" )

            # Find the corresponding occupancy based on the account reference
            occupancy = Occupancy.query.filter_by ( id = account_ref ).first ( )

            if not occupancy :
                return { "error" : "Occupancy not found for the given account reference." }, 404
            
            # Create a new payment record
            payment = Payment (
                tenant_id = occupancy.tenant_id,
                monthly_charge_id = None, # This can be linked to a specific monthly charge if needed
                status = "completed",
                amount = amount,
                method = "mpesa",
                mpesa_receipt = receipt_number,
                payment_date = transaction_date.date ( )
            )

            db.session.add ( payment )
            db.session.commit ( )

            return { "message" : "Payment recorded successfully." }, 200
        
        except Exception as e :
            return { "error" : str ( e ) }, 500

        # GENERAL PLAN FOR THE ABOVE METHOD:
        # Extract data from callback
        # Find tenant by account reference (bill ref number)
        # Link to occupancy/monthly charge
        # Record payment
        # Update payment status
        # Trigger notifications


# API ENDPOINTS TO BE CREATED:
# POST /api/mpesa/c2b/simulate - To simulate a C2B transaction for testing
# POST /api/mpesa/c2b/confirmation - To handle the confirmation callback from Mpesa
# POST /api/mpesa/c2b/validation - To handle the validation callback from Mpesa

class MpesaCallback ( Resource ) :

    def post ( self ) :

        data = request.get_json ( )

        mpesa_service = MpesaService ( )
        response, status_code = mpesa_service.handle_c2b_callback ( data )

        return response, status_code


class MpesaSimulation ( Resource ) :

    def post ( self ) :

        data = request.get_json ( )

        phone = data.get ( "phone" )
        amount = data.get ( "amount" )
        account_ref = data.get ( "account_ref" )

        mpesa_service = MpesaService ( )
        response = mpesa_service.c2b_simulate ( phone, amount, account_ref )

        return response
    
# Actual mpesa validation endpoint to be called by Mpesa when a C2B transaction is initiated.
class MpesaValidation ( Resource ) :

    def post ( self ) :

        data =  request.get_json ()
        # For now, we will just return a success response to Mpesa. In a real implementation, you would validate the transaction details here.
        return { "ResultCode" : 0, "ResultDesc" : "Validation successful." }
    


class InitiateChequePayment ( Resource ) :

    def post ( self ) :

        data = request.get_json ( )

        tenant_id = data.get ( "tenant_id" )
        amount = data.get ( "amount" )
        account_ref = data.get ( "account_ref" )

        # Here you would implement the logic to initiate a cheque payment, such as generating a unique reference number, recording the payment intent in the database, and providing instructions to the tenant.

        return { "message" : "Cheque payment initiated successfully.", "account_ref" : account_ref }