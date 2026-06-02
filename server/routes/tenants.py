
from flask import request
from flask_restful import Resource
# from auth.permissions import admin_required, manager_required
# from auth.jwt import token_required
from auth.permissions import require_admin, require_manager
from models import db, Tenant, Occupancy, Room
from datetime import datetime


class TenantsList ( Resource ) :
    # /api/tenants

    # Retrieve all tenants and details.
    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        tenants = Tenant.query.all()

        # separate all tenants with active occupancies ( where end_date is null ) and those without active occupancies. This way we can show active tenants with their room details at the top and past tenants at the bottom.

        active_tenants = []
        past_tenants = []

        for t in tenants :
            if t.occupancies and any ( o.end_date is None for o in t.occupancies ) :
                active_tenants.append ( t )
            else :
                past_tenants.append ( t )

        # return [ {
        #     "id" : t.id,
        #     "name" : t.name,
        #     "email" : t.email,
        #     "phone number" : t.phone,
        #     "national_id" : t.national_id,
        #     "room_number" : t.occupancies [ -1 ].room.room_number if t.occupancies else None, # Get the room number of the most recent occupancy if it exists, otherwise return None. Occupancies are ordered by start_date, so the most recent occupancy will be the last one in the list. [-1] takes the last element of the list.
        #     "occupancy_start_date" : str (t.occupancies [ -1 ].start_date) if t.occupancies else None,
        #     "created_at" : str (t.created_at)
        # } for t in active_tenants ], 200
        
        return [ {
            "id" : t.id,
            "name" : t.name,
            "email" : t.email,
            "phone number" : t.phone,
            "national_id" : t.national_id,
            "room_number" : t.occupancies [ -1 ].room.room_number if t.occupancies else None, # Get the room number of the most recent occupancy if it exists, otherwise return None. Occupancies are ordered by start_date, so the most recent occupancy will be the last one in the list. [-1] takes the last element of the list.
            "occupancy_start_date" : str (t.occupancies [ -1 ].start_date) if t.occupancies else None,
            "created_at" : str (t.created_at)
        } for t in active_tenants ] + ["--- Past Tenants below ---"] + [ {
            "id" : t.id,
            "name" : t.name,
            "email" : t.email,
            "phone number" : t.phone,
            "national_id" : t.national_id,
            "room_number" : t.occupancies [ -1 ].room.room_number if t.occupancies else None,
            "occupancy_start_date" : str (t.occupancies [ -1 ].start_date) if t.occupancies else None,
            "created_at" : str (t.created_at)
        } for t in past_tenants ], 200



# Create occupancy in the same request as tenant creation.
class CreateTenantOccupancy ( Resource ) :

    # Endpoint : POST /api/tenants/check-in
    # Creates tenant with occupancy in one request.

    # Endpoint : POST /api/tenants/<int:tenant_id>/occupancies
    # Creates a new occupancy for an existing tenant.

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def post ( self ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        try :

            data = request.get_json ()

            # OPTION 1 : NEW TENANT AND OCCUPANCY
            if "name" in data and "email" in data and "tenant_id" not in data :
                return self.create_tenant_and_occupancy ( data )
            
            # OPTION 2 : NEW OCCUPANCY FOR EXISTING TENANT
            elif "tenant_id" in data and "name" not in data and "email" not in data :
                return self.create_new_occupancy_for_existing_tenant ( data )
            
            else :
                return {
                    "error" : "Invalid request.",
                    "message" : "Either provide new tenant name or existing tenant_id. Do not provide both."
                }
        
        except Exception as e :
            db.session.rollback ()
            return { "error" : str (e) }, 500


    def create_tenant_and_occupancy ( self, data ) :

        try :

            data = request.get_json ()

            # Validate required fields for tenant and occupancy creation.
            # required_fields = [ "name", "email", "phone", "national_id", "room_id", "agreed_rent", "start_date" ]
            required_fields = [ "name", "email", "phone", "national_id", "room_id", "agreed_rent" ]

            for field in required_fields :
                if field not in data :
                    return { "error" : f"{ field } is required." }, 400
            
            # Check if tenant with the same national_id already exists.
            if Tenant.query.filter_by ( national_id = data [ "national_id" ] ).first () :
                return { "error" : "Tenant with same national id already exists."}
            
            # Check if tenant with the same email already exists.
            if Tenant.query.filter_by ( email = data [ "email" ] ).first () :
                return { "error" : "Tenant with same email already exists."}
            
            # Verify room availability
            room = Room.query.get ( data [ "room_id" ] )
            # if not room or room.status != "available" :
            #     return { "error" : "Room not available."}, 409

            if not room :
                return { "error" : "Not an existing room" }, 409

            if room.status != "available" :
                return { "error" : "Room has been booked." }, 409

            # try :
            #     start_date = datetime.fromisoformat ( data [ "start_date" ] ).date()
            # except :
            #     return { "error" : "Invalid date format for start_date. Use ISO format (YYYY-MM-DD)." }, 400

            # Verify agreed_rent is a number and is positive.
            if not isinstance ( data [ "agreed_rent" ], ( int, float ) ) :
                return { "error" : "Invalid agreed rent amount. Must be a number." }, 422

            if data [ "agreed_rent" ] <= 0 :
                return { "error" : "Invalid agreed rent amount." }, 422

            # Create tenant instance.
            tenant = Tenant (
                name = data [ "name" ],
                email = data [ "email" ],
                phone = data [ "phone" ],
                national_id = data [ "national_id" ]
            )

            db.session.add ( tenant )
            # Getting tenant ID before commit to use it for occupancy creation.
            db.session.flush ()

            # Create occupancy instance linked to the above tenant.
            occupancy = Occupancy (
                tenant_id = tenant.id,
                room_id = data [ "room_id" ],
                agreed_rent = data [ "agreed_rent" ],
                start_date = datetime.utcnow().date(),
                created_at = datetime.utcnow()
            )

            db.session.add ( occupancy )
            db.session.commit ()

            # Update room status to occupied.
            room.status = "occupied"
            db.session.commit ()

            return {
                "message" : f"Tenant id { tenant.id }, { tenant.name } created successfully and checked into room { room.room_number }. Check-in date: { str (occupancy.start_date) }."
            }, 201
        
        except Exception as e :
            return { "error" : str (e) }, 500
    
    def create_new_occupancy_for_existing_tenant ( self, data ) :

        # try:
            
        #     with db.session.begin():
                
        #         active_occupancy = Occupancy.query.filter_by(
        #             tenant_id=data["tenant_id"],
        #             end_date=None   
        #         ).first()
                
        #         new_room = (
        #             db.session.query(Room)
        #             .filter(Room.id == data["room_id"])
        #             # .with_for_update()
        #             .first()
        #         )
                
        #         switch_date = datetime.utcnow().date()
                
        #         active_occupancy.end_date = switch_date
                
        #         old_room = Room.query.get(active_occupancy.room_id)
        #         old_room.status = "available"
        #         old_room.current_occupant_id = None
                
        #         new_occupancy = Occupancy(
        #             tenant_id=data["tenant_id"],
        #             room_id=data["room_id"],
        #             agreed_rent=data["agreed_rent"],
        #             start_date=switch_date
        #         )
                
        #         db.session.add(new_occupancy)
                
        #         new_room.status = "occupied"
        #         new_room.current_occupant_id = data["tenant_id"]
                
        #     return {"message": f"Room switch successful. Tenant id { tenant.id }, { tenant.name } switched from room { old_room.room_number } to room { new_room.room_number } on { str (switch_date) }."}, 201
            
        # except Exception as e:
        #     db.session.rollback()
        #     return {"error": str(e)}, 500

        try :

            required_fields = [ "tenant_id", "room_id", "agreed_rent" ]
            for field in required_fields :
                if field not in data :
                    return { "error" : f"{ field } is required." }, 400
            
            # Verify tenant exists.
            tenant = Tenant.query.get ( data [ "tenant_id" ] )
            if not tenant :
                return { "error" : "Tenant not found." }, 404
            
            # Verify tenant has existing occupancy.
            active_occupancy = Occupancy.query.filter (
                    Occupancy.tenant_id == data [ "tenant_id" ],
                    Occupancy.end_date == None
            ).first ()

            if not active_occupancy :
                return { "error" : "Tenant has no active occupancy. Please use the check-in endpoint to create a new tenant and occupancy." }, 409
            
            # Verify room availability
            new_room = Room.query.get ( data [ "room_id" ] )
            # if not new_room or new_room.status != "available" :
            #     return { "error" : "Room not available."}, 409
            
            if not room :
                return { "error" : "Not an existing room" }, 409

            if room.status != "available" :
                return { "error" : "Room has been booked." }, 409
            
            # Verify agreed_rent is a number and is positive.
            if not isinstance ( data [ "agreed_rent" ], ( int, float ) ) :
                return { "error" : "Invalid agreed rent amount. Must be a number." }, 422
            
            if data [ "agreed_rent" ] <= 0 :
                return { "error" : "Invalid agreed_rent amount."}, 422
            
            # Prevent switching to same room.
            if new_room.id == active_occupancy.room_id :
                return { "error" : "Tenant is already occupying this room." }, 409
            
            try :
                switch_date = datetime.utcnow().date()
            
            except Exception as e :
                return { "error" : "Invalid date format for start_date. Use ISO format (YYYY-MM-DD)." }, 400
            
            # Get old room
            old_room = Room.query.get ( active_occupancy.room_id )

            # End current occupancy.
            active_occupancy.end_date = switch_date
            if "damages_or_dues" in data :
                active_occupancy.damages_or_dues = data [ "damages_or_dues" ]
            if "damages_reason" in data :
                active_occupancy.damages_reason = data [ "damages_reason" ]

            active_occupancy.check_out_notes = data.get ( "check_out_notes", f"Tenant switched to room { new_room.room_number } on { switch_date }." )

            # Mark old room as available.
            old_room.status = "available"
            old_room.current_occupant_id = None
            

            # Create new occupancy.
            new_occupancy = Occupancy (
                tenant_id = data [ "tenant_id" ],
                room_id = data [ "room_id" ],
                agreed_rent = data [ "agreed_rent" ],
                start_date = switch_date,
                check_in_notes = data.get ( "check_in_notes", f"Tenant switched from room { old_room.room_number } on { str (switch_date) }." )
            )

            db.session.add ( new_occupancy )

            # Update new room.
            new_room.status = "occupied"
            new_room.current_occupant_id = data [ "tenant_id" ]

            db.session.commit ()

            return {
                "type" : "room_switch",
                # "tenant" : tenant.to_dict (),
                # "old_occupancy" : active_occupancy.to_dict (),
                # "old_room" : old_room.to_dict (),
                # "new_occupancy" : new_occupancy.to_dict (),
                # "new_room" : new_room.to_dict (),
                "message" : f"Tenant id { tenant.id }, { tenant.name } switched from room { old_room.room_number } to room { new_room.room_number } on { str (switch_date) }."
            }, 201
        
        except Exception as e :
            db.session.rollback()
            return { "error" : str (e) }, 500

            
            


class TenantDetails ( Resource ) :
    # /api/tenants/<int:tenant_id>

    # Retireve specific tenant and details.
    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self, tenant_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        tenant = Tenant.query.get ( tenant_id )

        if not tenant :
            return { "error" : "Tenant not found." }, 404
        
        # To retrieve the tenant's occupancy details as well.
        occupancies = tenant.occupancies
        
        return {
            "id" : tenant.id,
            "name" : tenant.name,
            "email" : tenant.email,
            "phone number" : tenant.phone,
            "national_id" : tenant.national_id,
            "room_id" : occupancies [ -1 ].room_id if occupancies else None, # Get the room_id of the most recent occupancy if it exists, otherwise return None. Occupancies are ordered by start_date, so the most recent occupancy will be the last one in the list. [-1] takes the last element of the list.
            "room_number" : tenant.occupancies [ -1 ].room.room_number if tenant.occupancies else None, # Get the room number of the most recent occupancy if it exists, otherwise return None. Occupancies are ordered by start_date, so the most recent occupancy will be the last one in the list. [-1] takes the last element of the list.
            "occupancy_start_date" : str (tenant.occupancies [ -1 ].start_date) if tenant.occupancies else None,

            "created_at" : str (tenant.created_at)
        }, 200

    # Update tenant details (name, email, phone, national_id). Work on how to update occupancy details if tenant details are updated. Maybe create a separate endpoint for updating occupancy details.

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def put ( self, tenant_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403
        
        try :

            tenant = Tenant.query.get ( tenant_id )

            if not tenant :
                return { "error" : "Tenant not found." }, 404
            
            data = request.get_json ()


            # GET DATA FROM USER
            # tenant.name = data.get ( "name", tenant.name )
            if data.get ( "name" ) :
                if tenant.name == data [ "name" ] or Tenant.query.filter_by ( name = data [ "name" ]).first() :
                    return { "error" : "Tenant with this name already exists." }, 400
                else :
                    tenant.name = data [ "name" ]

            # tenant.email = data.get ( "email", tenant.email )
            if data.get ( "email" ) :
                if tenant.email == data [ "email" ] or Tenant.query.filter_by ( email = data [ "email" ]).first () :
                    return { "error" : "Email already exists." }, 400
                else :
                    tenant.email = data [ "email" ]


            # tenant.phone = data.get ( "phone", tenant.phone )
            if data.get ( "phone" ) :
                if tenant.phone == data [ "phone" ] or Tenant.query.filter_by ( 
                    phone = data [ "phone" ]).first () :
                    return { "error" : "Phone number already exists." }, 400
                else :
                    tenant.phone = data [ "phone" ]
                    
            # tenant.national_id = data.get ( "national_id", tenant.national_id )
            if data.get ( "national_id" ) :
                if tenant.national_id == data [ "national_id" ] or Tenant.query.filter_by ( national_id = data [ "national_id" ]).first () :
                    return { "error" : "Tenant with this national_id number already exists." }, 400
                else :
                    tenant.national_id = data [ "national_id" ]

            db.session.commit ()

            return { "message" : f"Tenant id { tenant.id }, { tenant.name } updated successfully." }, 200
        
        except Exception as e :
            db.session.rollback()
            return { "error" : str (e) }, 500
    
    # Delete tenant. Work on how to handle occupancy and billing details when a tenant is deleted. Maybe set occupancy end date to current date and mark all future billings as cancelled or delete them.
    # Theory : Delete tenant, set occupancy end date to current date, delete all future billings. This way we maintain historical data for past occupancies and billings while ensuring that no future charges are generated for the deleted tenant.

    # Admin required.
    # @token_required
    # @admin_required
    # def delete ( self, tenant_id ) :

    #     admin = require_admin ()

    #     if not admin :
    #         return { "error" : "Admin access required." }, 403

    #     tenant = Tenant.query.get ( tenant_id )

    #     if not tenant :
    #         return { "error" : "Tenant not found." }, 404
        
    #     # occupancy = tenant.occupancies [-1] if tenant.occupancies else None
    #     # if occupancy.end_date :
    #     #     return { "message" : "Delete occupancy before"}
        
    #     db.session.delete ( tenant )
    #     db.session.commit ()

    #     return { "message" : "Tenant deleted successfully." }, 200



# Retrieves a tenant's list of occupancies. This will allow us to show the tenant's current and past occupancies when we retrieve their details.
class TenantOccupancies ( Resource ) :
    # /api/tenants/<int:tenant_id>/occupancies

    # Manager required.
    # @token_required
    # @manager_required
    def get ( self, tenant_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        tenant = Tenant.query.get ( tenant_id )

        if not tenant :
            return { "error" : "Tenant not found." }, 404
        
        occupancies = tenant.occupancies

        return [ {
            "id" : o.id,
            "tenant_id" : o.tenant.id,
            "tenant_name" : o.tenant.name,
            "room_id" : o.room_id,
            "room_number" : o.room.room_number,
            "agreed_rent" : int (o.agreed_rent),
            "start_date" : str (o.start_date),
            "end_date" : str (o.end_date) if o.end_date else None,
            "damages_or_dues" : int (o.damages_or_dues) if o.damages_or_dues else 0,
            "damages_reason" : o.damages_reason if o.damages_reason else None,
            "check_in_notes" : o.check_in_notes if o.check_in_notes else None,
            "check_out_notes" : o.check_out_notes if o.check_out_notes else None,
        } for o in occupancies ], 200
    


# Retrieve a tenant's active occupancy, all monthly charges, all payments and running balances. 
class TenantLedger ( Resource ) :
    # /api/tenants/<int:tenant_id>/ledger

    # Admin/ Manager required.
    # @token_required
    # @manager_required
    def get ( self, tenant_id ) :

        manager = require_manager ()

        if not manager :
            return { "error" : "Unauthorized. Manager access required." }, 403

        tenant = Tenant.query.get ( tenant_id )

        if not tenant :
            return { "error" : "Tenant not found." }, 404
        
        occupancies = tenant.occupancies

        ledger = []

        for o in occupancies :
            charges = o.monthly_charges
            payments = [ p for c in charges for p in c.payments ] # Flatten the list of payments from all charges.

            for c in charges :
                ledger.append ( {
                    "occupancy_id" : o.id,
                    "tenant_name" : tenant.name,
                    "room_number" : o.room.room_number,
                    "type" : "charge",
                    "monthly_charge_id" : c.id,
                    "amount" : int (c.rent_amount + c.water_bill),
                    "date" : str (c.charge_date)
                } )
            
            for p in payments :
                ledger.append ( {
                    "occupancy_id" : o.id,
                    "tenant_name" : tenant.name,
                    "room_number" : o.room.room_number,
                    "type" : "payment",
                    "payment_id" : p.id,
                    "monthly_charge_id" : p.monthly_charge_id,
                    "amount" : int (p.amount),
                    "date" : str (p.payment_date)
                } )
        
        # Sort the ledger by date.
        ledger.sort ( key = lambda x : x [ "date" ] )

        # Get the difference of charges and payments to calculate the running balance.
        balance = 0
        for entry in ledger :

            # Add charges to balance and subtract payments from balance.

            if entry [ "type" ] == "charge" :
                balance += entry [ "amount" ]

            elif entry [ "type" ] == "payment" :
                balance -= entry [ "amount" ]
            
            entry [ "running_balance" ] = balance

        return ledger, 200
# Chat Prompt
# What is causing this error?

# npm run build

# > client2@0.0.0 build
# > tsc && vite build

# Version 5.9.3
# tsc: The TypeScript Compiler - Version 5.9.3             
#                                                       TS 
# COMMON COMMANDS

#   tsc
#   Compiles the current project (tsconfig.json in the working directory.)

#   tsc app.ts util.ts
#   Ignoring tsconfig.json, compiles the specified files with default compiler options.

#   tsc -b
#   Build a composite project in the working directory.

#   tsc --init
#   Creates a tsconfig.json with the recommended settings in the working directory.

#   tsc -p ./path/to/tsconfig.json
#   Compiles the TypeScript project located at the specified path.

#   tsc --help --all
#   An expanded version of this information, showing all possible compiler options

#   tsc --noEmit
#   tsc --target esnext
#   Compiles the current project, with additional settings.

# COMMAND LINE FLAGS

# --help, -h
# Print this message.

# --watch, -w
# Watch input files.

# --all
# Show all compiler options.

# --version, -v
# Print the compiler's version.

# --init
# Initializes a TypeScript project and creates a tsconfig.json file.

# --project, -p
# Compile the project given the path to its configuration file, or to a folder with a 'tsconfig.json'.

# --showConfig
# Print the final configuration instead of building.

# --build, -b
# Build one or more projects and their dependencies, if out of date

# COMMON COMPILER OPTIONS

# --pretty
# Enable color and formatting in TypeScript's output to make compiler errors easier to read.
# type: boolean
# default: true

# --declaration, -d
# Generate .d.ts files from TypeScript and JavaScript files in your project.
# type: boolean
# default: `false`, unless `composite` is set

# --declarationMap
# Create sourcemaps for d.ts files.
# type: boolean
# default: false

# --emitDeclarationOnly
# Only output d.ts files and not JavaScript files.
# type: boolean
# default: false

# --sourceMap
# Create source map files for emitted JavaScript files.
# type: boolean
# default: false

# --noEmit
# Disable emitting files from a compilation.
# type: boolean
# default: false

# --target, -t
# Set the JavaScript language version for emitted JavaScript and include compatible library declarations.
# one of: es5, es6/es2015, es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext
# default: es5

# --module, -m
# Specify what module code is generated.
# one of: none, commonjs, amd, umd, system, es6/es2015, es2020, es2022, esnext, node16, node18, node20, nodenext, preserve
# default: undefined

# --lib
# Specify a set of bundled library declaration files that describe the target runtime environment.
# one or more: es5, es6/es2015, es7/es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext, dom, dom.iterable, dom.asynciterable, webworker, webworker.importscripts, webworker.iterable, webworker.asynciterable, scripthost, es2015.core, es2015.collection, es2015.generator, es2015.iterable, es2015.promise, es2015.proxy, es2015.reflect, es2015.symbol, es2015.symbol.wellknown, es2016.array.include, es2016.intl, es2017.arraybuffer, es2017.date, es2017.object, es2017.sharedmemory, es2017.string, es2017.intl, es2017.typedarrays, es2018.asyncgenerator, es2018.asynciterable/esnext.asynciterable, es2018.intl, es2018.promise, es2018.regexp, es2019.array, es2019.object, es2019.string, es2019.symbol/esnext.symbol, es2019.intl, es2020.bigint/esnext.bigint, es2020.date, es2020.promise, es2020.sharedmemory, es2020.string, es2020.symbol.wellknown, es2020.intl, es2020.number, es2021.promise, es2021.string, es2021.weakref/esnext.weakref, es2021.intl, es2022.array, es2022.error, es2022.intl, es2022.object, es2022.string, es2022.regexp, es2023.array, es2023.collection, es2023.intl, es2024.arraybuffer, es2024.collection, es2024.object/esnext.object, es2024.promise, es2024.regexp/esnext.regexp, es2024.sharedmemory, es2024.string/esnext.string, esnext.array, esnext.collection, esnext.intl, esnext.disposable, esnext.promise, esnext.decorators, esnext.iterator, esnext.float16, esnext.error, esnext.sharedmemory, decorators, decorators.legacy
# default: undefined

# --allowJs
# Allow JavaScript files to be a part of your program. Use the 'checkJs' option to get errors from these files.
# type: boolean
# default: false

# --checkJs
# Enable error reporting in type-checked JavaScript files.
# type: boolean
# default: false

# --jsx
# Specify what JSX code is generated.
# one of: preserve, react, react-native, react-jsx, react-jsxdev
# default: undefined

# --outFile
# Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output.

# --outDir
# Specify an output folder for all emitted files.

# --removeComments
# Disable emitting comments.
# type: boolean
# default: false

# --strict
# Enable all strict type-checking options.
# type: boolean
# default: false

# --types
# Specify type package names to be included without being referenced in a source file.

# --esModuleInterop
# Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility.
# type: boolean
# default: false

# You can learn about all of the compiler options at https://aka.ms/tsc