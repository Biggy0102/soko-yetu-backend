# Soko Yetu Backend

Backend for the Soko Yetu frontend. This first phase covers **database schema +
authentication** (register/login).

## Stack
- Node.js + Express
- PostgreSQL
- Prisma ORM
- bcrypt for password hashing, JWT for auth tokens

## Setup

1. **Install PostgreSQL** locally (or use a hosted service like Supabase/Railway/Render).
   Create a database called `soko_yetu`.

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set your environment variables.** Copy `.env.example` to `.env` (already done)
   and edit `DATABASE_URL` to match your actual Postgres credentials, and set
   `JWT_SECRET` to a long random string.

4. **Generate the Prisma client and create the tables:**
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   This reads `prisma/schema.prisma` and creates all the tables (users, listings,
   categories, etc.) in your database.

5. **Seed the static reference data** (categories, subcategories, countries -
   copied directly from the frontend's `js/data.js`):
   ```
   npm run seed
   ```

6. **Start the server:**
   ```
   npm run dev
   ```
   This runs on `http://localhost:4000` by default (change `PORT` in `.env` if needed).

## What's implemented so far

### Database schema (`prisma/schema.prisma`)
Tables for: `users`, `countries`, `categories`, `subcategories`, `listings`,
`photos`, `price_history_entries`, `offers`, `callbacks`, `reports`, `saved_ads`,
`conversations`, `messages`.

Every table is modeled directly on what the frontend already expects - field
names and shapes trace back to `js/data.js`, `js/post-ad.js`, `js/dashboard.js`,
`js/listing.js`, and `js/auth.js`.

### Auth endpoints

**POST `/api/auth/register`**
```json
{
  "name": "James Mwangi",
  "phone": "0712345678",
  "email": "james@example.com",   // optional
  "password": "secret123",
  "countryCode": "KE"
}
```
Returns `{ token, user }` on success, or `{ errors: { field: message } }` on
validation failure (same rules as `js/auth.js`'s `handleRegister`, now enforced
on the server).

**POST `/api/auth/login`**
```json
{
  "identifier": "0712345678",   // phone or email
  "password": "secret123"
}
```
Returns `{ token, user }` on success, or `{ error: message }` on failure.

**GET `/api/auth/me`**
Requires header `Authorization: Bearer <token>`. Returns the logged-in user's
profile. Use this to check "is anyone logged in" when a page loads.

### Quick test (once the server is running)
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"James Mwangi","phone":"0712345678","password":"secret123","countryCode":"KE"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"0712345678","password":"secret123"}'

# Get profile (replace TOKEN with the token from login/register response)
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer TOKEN"
```

## Not built yet (next phases)
- Listings CRUD + browse/search/filter
- Photo upload
- Dashboard ("my ads") stats
- Seller profile data
- Offers / callbacks / reports / saved ads
- Messaging

## Notes
- `npx prisma validate/generate/migrate` need to download a small binary from
  Prisma's servers the first time - this requires normal internet access on
  your machine (it failed in the sandboxed environment this was built in,
  which blocks unlisted domains).
- Phone numbers are stored as digits only (no leading 0, no country code) -
  matches how `js/auth.js` and `js/post-ad.js` already process them.
