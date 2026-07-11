# AI Statement Study

React + TypeScript experimental survey for testing whether AI loading cue text affects confidence ratings.

## Local Development

```bash
npm install
npm run dev
```

Participant app:

```text
http://127.0.0.1:5177/
```

The previous in-app browser URL also works with Vite fallback:

```text
http://127.0.0.1:5177/nudge-experiment/
```

Admin dashboard:

```text
http://127.0.0.1:5177/#/admin
```

Default dashboard password is `research-admin`. Set `VITE_ADMIN_PASSWORD` for a different password.

## Supabase

The app uses Supabase when these variables are present:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Without those values, the app stores records in browser localStorage so the study can be piloted immediately.

Run `supabase/schema.sql` in Supabase SQL editor to create the two tables:

- `participant_sessions`
- `trial_responses`

## Configuration

Study settings live in `src/config/experimentConfig.ts`, including:

- Statements
- Experimental conditions
- Loading duration range
- Likert labels
- Consent text
- Instruction text
- Demographic options
- Progress bar visibility
- Database table names
- Study title

## Deployment

Deploy the `nudge-experiment` folder to Vercel as a Vite project.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```
