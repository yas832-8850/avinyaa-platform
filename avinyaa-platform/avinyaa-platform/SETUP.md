# Avinyaa Platform — Setup Guide (Phase 0)

This gets the app running on your own computer, connected to a real database.
Follow every step in order — don't skip ahead even if it looks familiar.

## What you're setting up

- The Next.js app (the code you already have)
- A free Supabase project (your database + login system, hosted in the cloud)
- The connection between the two

---

## Step 1 — Unzip and install

1. Unzip the project folder somewhere sensible, e.g. `Documents/avinyaa-platform`
2. Open that folder in VS Code
3. Open the terminal in VS Code (Terminal → New Terminal) and run:

```
npm install
```

This downloads all the code libraries the project depends on. Takes a minute or two.

---

## Step 2 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**
3. Give it a name (e.g. "avinyaa-platform"), set a database password (save it somewhere), pick a region close to Australia (e.g. Sydney)
4. Wait ~2 minutes for it to finish setting up

---

## Step 3 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/schema.sql` from your project folder, copy the entire contents
4. Paste it into the Supabase SQL editor, click **Run**
5. You should see "Success. No rows returned" — this means all your tables were created

To confirm: click **Table Editor** in the sidebar — you should see `organisations`, `profiles`, `carriers`, `carrier_rate_cards`, `margin_rules`, and `jobs` listed.

---

## Step 4 — Connect the app to your Supabase project

1. In Supabase, click the **Connect** button near the top of the dashboard
2. Find your **Project URL** and **anon/public key** (NOT the service_role key — never expose that one in a browser-facing app)
3. In your project folder, copy `.env.local.example` and rename the copy to `.env.local`
4. Paste your values in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Save the file

---

## Step 5 — Create your first organisation and user

Since there's no sign-up page yet (that's next), we'll create your first login manually.

**Create your master org:**
1. In Supabase, go to **Table Editor** → `organisations` → **Insert row**
2. `name`: "Avinyaa Installs", `type`: "master" → Save
3. Copy the `id` that gets generated (you'll need it in a moment)

**Create a test client org:**
1. Insert another row: `name`: "Test Client Co", `type`: "client" → Save
2. Copy this `id` too

**Create your login (as super_admin):**
1. Go to **Authentication** → **Users** → **Add user** → **Create new user**
2. Enter your email and a password, tick "Auto Confirm User" → Create
3. Copy the generated user `id`
4. Go to **Table Editor** → `profiles` → **Insert row**
5. `id`: paste the user id from step 3, `org_id`: paste your MASTER org's id, `role`: "super_admin" → Save

---

## Step 6 — Run it

```
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with the email/password you created in Step 5.

You should land on `/dashboard` and see "Avinyaa Installs" as the org name, your email, and "No jobs yet" (since the `jobs` table is empty — expected).

---

## If something goes wrong

- **"Invalid login credentials"** — double check you ticked "Auto Confirm User" when creating the Supabase user
- **Blank/error dashboard** — check `.env.local` has no typos and you restarted `npm run dev` after creating it (env files are only read on startup)
- **Can't see any tables in Table Editor** — the SQL in Step 3 didn't run successfully; check the SQL Editor output for a red error message

Send me the exact error text if you get stuck — don't spend more than 15 minutes stuck on one thing before asking.

---

## What's next (Phase 1)

Once this is running, the next build stage adds: carrier onboarding, the margin rules UI, and an actual booking form that uses `lib/margin.ts` to calculate real sell prices. That'll plug straight into the `jobs` table you already have.
