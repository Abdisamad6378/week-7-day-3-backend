# Week 7 Day 3: JWT Authentication

A small full-stack login system. Users can register, log in, stay logged in after a page refresh, and view a dashboard that requires a valid token.

The repo has two parts:

- The root folder is the Express API, which runs on port 4000.
- `week-7-day-3-frontend/` is the React app, built with Vite, which runs on port 5173.

## Running it

You need Node 20 or newer and two terminals.

**Terminal 1, the backend:**

```bash
npm install
cp .env.example .env
npm run dev
```

Change `JWT_SECRET` in `.env` to your own value of at least 32 characters.

**Terminal 2, the frontend:**

```bash
cd week-7-day-3-frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## API

| Method | Route | Auth | Success | Errors |
| ------ | ----- | ---- | ------- | ------ |
| POST | `/api/auth/register` | No | 201 with `{ token, user }` | 400 invalid input, 409 email already used |
| POST | `/api/auth/login` | No | 200 with `{ token, user }` | 401 wrong email or password |
| GET | `/api/auth/me` | Bearer token | 200 with `{ user }` | 401 missing, invalid or expired token |

Register expects `{ email, password, name }` and login expects `{ email, password }`. Errors come back as `{ error: "message" }`.

## How the frontend works

- **`RegisterForm`** checks the name, email, password rules and password match before calling the API. Errors appear in red under each field, and API errors such as a duplicate email appear above the button.
- **`LoginForm`** stores the token and user in `localStorage`, then sends the user to the dashboard. Wrong credentials show "Invalid email or password".
- **`AuthContext`** provides `login`, `register` and `logout`. When the app loads, it checks any saved token against `GET /api/auth/me`.
- **`ProtectedRoute`** guards `/dashboard`. If there is no user, or the token is missing or expired, it clears storage and redirects to `/login`.
- **`Dashboard`** fetches fresh user data when it opens and shows the name, email and member since date, with a Log Out button.

## Things to know

- **Users are stored in memory.** The assignment doesn't include a database, so restarting the backend deletes every account. Saved tokens stop working at that point and you will need to register again.
- **Tokens last one hour.** After that, the next visit to the dashboard sends you back to login.
- **JWTs use base64url, not plain base64.** Calling `atob` directly on a token payload can throw an error, so `ProtectedRoute` converts the characters first.
- **`localStorage` is what the assignment asks for**, but any script running on the page can read it. A production app would usually keep the token in an `httpOnly` cookie.
- **Requests use `fetch`**, matching the assignment's code samples, so `axios` isn't installed.
