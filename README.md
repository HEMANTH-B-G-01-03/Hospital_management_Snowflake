Hospital Management System — Glacier HMS
A full-stack Hospital Management System powered by Snowflake, Node.js, and Express.js.

Glacier HMS provides role-based workflows for administrators, doctors, and patients to manage hospital operations, including patient profiles, appointments, billing, and medical records. Snowflake is used for data storage and analytics, while dashboard visualizations are powered by SQL views.
Table of Contents
- Overview
- Features
- Technology Stack
- System Architecture
- Project Structure
- Getting Started
- Demo Accounts
- Role-Based Access Control
- Database Design
- API Reference
- Security Considerations
- Troubleshooting
- Future Enhancements
- License
Overview
Glacier HMS is designed to simplify common hospital administration workflows through a single web application.

The system supports three user roles:
- Admin: Manages hospital resources and administrative operations.
- Doctor: Views relevant patient and appointment information and manages assigned medical records.
- Patient: Books appointments and views personal appointments, bills, and medical records.
The backend exposes REST APIs through Express.js. JWT authentication and role-based middleware protect application resources. Snowflake stores the application data and provides aggregated information for dashboard visualizations.
Features
Patient Management
- Add, update, search, and delete patient profiles.
- Maintain patient details such as age, gender, blood group, contact information, and email.
Doctor Management
- Manage doctor profiles and specialties.
- Maintain consultation fees and availability status.
Appointment Management
- Allow patients to book appointments.
- Allow administrators and doctors to schedule and update appointments.
- Track appointment statuses: Scheduled, Completed, and Cancelled.
Billing Management
- Create and manage patient bills.
- Track payment statuses: Paid, Pending, and Overdue.
- Restrict patients to viewing their own bills.
Medical Records
- Store diagnosis, treatment details, and notes.
- Associate records with the relevant patient and treating doctor.
- Apply role-based access to medical information.
Dashboard and Analytics
- Display revenue collected, patient count, doctor count, and today's appointments.
- Visualize monthly revenue.
- Show appointment distribution by status.
- Display appointment workload by doctor.
- Use Snowflake SQL views for dashboard aggregations.
Authentication and User Experience
- JWT-based authentication.
- Separate access permissions for admins, doctors, and patients.
- Patient self-registration.
- Responsive interface with mobile navigation.
- Loading indicators, empty states, error messages, and toast notifications.
Technology Stack
Layer	Technology	Purpose
Database and Analytics	Snowflake	Data storage, SQL queries, and analytics views
Backend	Node.js, Express.js	REST API and application server
Authentication	JSON Web Token (JWT)	User authentication and authorization
Password Security	bcryptjs	Password hashing
Snowflake Integration	snowflake-sdk	Backend-to-database connectivity
Frontend	HTML, CSS, JavaScript	User interface
Data Visualization	Chart.js	Interactive dashboard charts


Application hosting: Express serves both the frontend and backend API, so the application runs through a single Node.js process.
System Architecture
+---------------------------+
|       Browser / UI        |
|---------------------------|
| HTML, CSS, JavaScript     |
| Dashboard and Chart.js    |
| API client                |
+-------------+-------------+
              |
              | HTTP requests + JWT
              v
+---------------------------+
|       Express API         |
|---------------------------|
| Authentication middleware |
| Role-based authorization  |
| REST API routes           |
| Snowflake DB connection   |
+-------------+-------------+
              |
              | SQL queries + bind variables
              v
+---------------------------+
|         Snowflake         |
|---------------------------|
| HOSPITAL_DB.HMS           |
| Application tables        |
| Analytics SQL views       |
| HMS_WH warehouse          |
+---------------------------+
Request Flow
1. A user signs in through the browser and receives a JWT.
2. The frontend includes the token in subsequent protected API requests.
3. Authentication middleware verifies the token.
4. Role-based middleware checks whether the user can access the requested operation.
5. The API executes parameterized SQL queries against Snowflake.
6. Snowflake returns the requested data, which the backend sends to the frontend as JSON.
7. Dashboard charts use data returned from the analytics views.
The dashboard uses these Snowflake views:
- V_MONTHLY_REVENUE
- V_APPT_STATUS
- V_DOCTOR_LOAD
Project Structure
Hospital_management_Snowflake/
├── database/
│   └── schema.sql
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   └── seed-users.js
│   └── src/
│       ├── db.js
│       ├── auth.js
│       └── routes.js
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js
│       ├── ui.js
│       └── app.js
│
└── README.md
File	Description
database/schema.sql	Creates the Snowflake warehouse, database, schema, tables, views, and sample data.
backend/server.js	Configures the Express server, health endpoint, static frontend hosting, and error handling.
backend/src/db.js	Manages the Snowflake connection and query helper.
backend/src/auth.js	Handles JWT authentication and role-based middleware.
backend/src/routes.js	Defines authentication, resource CRUD, and dashboard API routes.
backend/scripts/seed-users.js	Creates demo user accounts with hashed passwords.
frontend/index.html	Main frontend entry point.
frontend/css/styles.css	Application theme, layout, and responsive styles.
frontend/js/api.js	Frontend API request helper, including token and error handling.
frontend/js/ui.js	Reusable UI components such as tables, modals, toasts, and loaders.
frontend/js/app.js	Authentication screen, application navigation, pages, and dashboard.


Getting Started
Follow these steps to run Glacier HMS locally.
Prerequisites
- Node.js version 18 or newer.
- npm (included with Node.js).
- A Snowflake account.
- A Snowflake user with permission to create the required database and warehouse.
1. Set Up Snowflake
1. Sign in to your Snowflake account.
2. Open a Snowflake SQL Worksheet.
3. Open database/schema.sql from the project.
4. Execute the complete SQL script.
The script creates:
- Warehouse: HMS_WH (X-Small, configured to auto-suspend after 60 seconds).
- Database: HOSPITAL_DB.
- Schema: HMS.
- Application tables for patients, doctors, appointments, bills, medical records, and users.
- Analytics views for dashboard reporting.
- Sample data for initial application testing.
2. Configure the Backend
Open a terminal and navigate to the backend directory:
cd backend
Create your environment configuration file:
cp .env.example .env
On Windows Command Prompt, use:
copy .env.example .env
Configure the following values in backend/.env:
Variable	Description
SF_ACCOUNT	Snowflake account identifier in the orgname-accountname format.
SF_USER	Snowflake username.
SF_PASSWORD	Snowflake password.
SF_WAREHOUSE	Snowflake warehouse name; project default is HMS_WH.
SF_DATABASE	Snowflake database name; project default is HOSPITAL_DB.
SF_SCHEMA	Snowflake schema name; project default is HMS.
JWT_SECRET	A long, random secret used to sign JWTs.
PORT	Backend server port; defaults to 4000.


Generate a secure JWT secret using Node.js:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
Copy the generated value into JWT_SECRET in your .env file.
Important: Never commit your .env file or expose Snowflake credentials and JWT secrets in a public repository.

3. Install Dependencies and Start the Application
From the backend directory, install the dependencies:
npm install
Create the demo user accounts:
npm run seed
Start the application:
npm start
Open the application in your browser:
http://localhost:4000
To verify the backend and Snowflake connection, visit:
http://localhost:4000/api/health
The health endpoint returns Snowflake version information when the connection succeeds.
Demo Accounts
The seed script creates the following demonstration accounts.

Demo password for all accounts: Password123!
Role	Email	Linked Record
Admin	admin@hms.demo	None
Doctor	doctor@hms.demo	Dr. Meera Iyer
Patient	patient@hms.demo	Ana Torres


Security warning: These credentials are for demonstration purposes only. Change or remove the demo accounts before deploying the application or exposing it beyond a local demo environment.

Role-Based Access Control
Glacier HMS uses server-side role checks and ownership filtering to control access to application resources.
Resource	Admin	Doctor	Patient
Dashboard	View	View	Not available
Patients	Full access	View	Not available
Doctors	Full access	View	View
Appointments	Full access	View and update own	Book and view own
Billing	Full access	Not available	View own
Medical Records	Full access	Add, edit, and view own	View own


Access restrictions are enforced on the server. Hiding a menu item in the frontend is not treated as the only security mechanism.
Database Design
The Snowflake database uses the HOSPITAL_DB database and HMS schema.
Main Tables
Table	Important Columns	Purpose
PATIENTS	NAME, AGE, GENDER, PHONE, BLOOD_GROUP, EMAIL	Stores patient profiles.
DOCTORS	NAME, SPECIALTY, PHONE, EMAIL, FEE, AVAILABLE	Stores doctor information.
APPOINTMENTS	PATIENT_ID, DOCTOR_ID, APPT_DATE, APPT_TIME, REASON, STATUS	Stores appointment information.
BILLS	PATIENT_ID, DESCRIPTION, AMOUNT, STATUS, ISSUED_ON	Stores patient billing details.
RECORDS	PATIENT_ID, DOCTOR_ID, DIAGNOSIS, TREATMENT, NOTES, RECORDED_ON	Stores medical records.
USERS	EMAIL, PASSWORD_HASH, ROLE, REF_ID	Stores login credentials and user-role associations.


Entity Relationships
PATIENTS ──┬── APPOINTMENTS ── DOCTORS
           ├── BILLS
           └── RECORDS ─────── DOCTORS

USERS (EMAIL, PASSWORD_HASH, ROLE, REF_ID)
The USERS table associates login accounts with their corresponding patient or doctor record through REF_ID.
Analytics Views
View	Purpose
V_MONTHLY_REVENUE	Groups paid revenue by month.
V_APPT_STATUS	Provides appointment counts by status.
V_DOCTOR_LOAD	Provides appointment counts per doctor.


Snowflake constraint note: Snowflake records primary-key and foreign-key constraints but does not enforce them for standard tables, except for NOT NULL constraints. The application must therefore maintain referential integrity.
API Reference
All API endpoints are prefixed with /api.

Protected endpoints require this HTTP header:
Authorization: Bearer <token>
Authentication routes and the health endpoint do not require a JWT.

API errors are returned as JSON:
{
  "error": "message"
}
Authentication Endpoints
Method	Endpoint	Request Body	Description
POST	/api/auth/login	email, password	Authenticates a user and returns a token and user details.
POST	/api/auth/register	name, email, password, optional age, gender	Registers a new patient and creates a login account.


Registration requires a password of at least eight characters.
Resource Endpoints
The following resources support CRUD operations:
- patients
- doctors
- appointments
- bills
- records
Method	Endpoint	Description
GET	/api/{resource}	Retrieves resource rows, filtered by user role.
POST	/api/{resource}	Creates a resource record.
PUT	/api/{resource}/:id	Updates a resource record.
DELETE	/api/{resource}/:id	Deletes a resource record.


Available operations depend on the authenticated user's role and ownership permissions.
Other Endpoints
Method	Endpoint	Description
GET	/api/dashboard	Returns KPI and chart data for admins and doctors.
GET	/api/health	Checks the Snowflake connection and returns Snowflake version information.


Common HTTP Status Codes
Status Code	Meaning
400	Invalid input.
401	Missing or expired authentication token.
403	The user is not authorized to perform the operation.
404	Unknown endpoint or resource.
409	Email address is already registered.
500	Server-side or Snowflake error.


Security Considerations
The project includes the following security measures:
- Parameterized SQL queries: Bind variables are used to reduce SQL injection risk.
- Password hashing: Passwords are hashed with bcrypt and are not stored or returned in plain text.
- JWT authentication: Tokens expire after eight hours.
- Automatic sign-out: The frontend signs out the user when the API returns an HTTP 401 response.
- Server-side authorization: Role and ownership checks are performed by backend middleware and route logic.
- Frontend output escaping: Rendered data is HTML-escaped.
- Credential separation: Snowflake credentials are stored in the backend .env file.
Production Readiness
Glacier HMS is a learning and portfolio project. It is not intended for handling real patient data in its current form.

A production hospital system would require additional security, privacy, and reliability measures, including:
- Audit logging and access monitoring.
- Appropriate encryption policies for data at rest and in transit.
- HTTPS and secure deployment configuration.
- Rate limiting and additional abuse protection.
- Stronger credential and secret management.
- Applicable legal and regulatory compliance, such as HIPAA or GDPR where relevant.
Troubleshooting
Problem	Possible Solution
/api/health returns a 500 error	Verify SF_ACCOUNT, username, password, warehouse, database, and schema settings in .env. Check the backend terminal for the Snowflake error.
Demo user login fails	Run npm run seed after executing database/schema.sql.
Snowflake rejects password authentication	Some Snowflake accounts require MFA or key-pair authentication. A service user and corresponding key-pair configuration may be required; update the connection configuration in backend/src/db.js accordingly.
Dashboard charts are empty	Verify that the sample-data inserts and analytics view definitions in database/schema.sql were executed successfully.
Port is already in use	Change the PORT value in .env and restart the server.


Future Enhancements
Potential improvements include:
- Pagination and server-side search for large data tables.
- Appointment conflict detection to prevent doctors from being double-booked.
- PDF invoice generation and printable medical summaries.
- Snowflake Streams and Tasks for automated reporting updates.
- Unit and API testing with Jest and Supertest.
- Docker-based setup and deployment documentation.
- Key-pair authentication for Snowflake connectivity.
License
The project is described as released under the MIT License. Ensure that an MIT LICENSE file is included in the repository before publishing it.
