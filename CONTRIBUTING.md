# Contributing to Kredo

Thanks for wanting to help. Kredo gives informal workers verifiable proof of their income, so small, careful changes are best.

## Getting set up

1. Fork the repository and clone your fork.
2. Follow **Getting started** in the README: install dependencies, run the SQL files in order, and fill in `.env.local`.
3. Start the app with `npm run dev`.

## Making a change

1. Create a branch from `main`, for example `fix/rating-link-copy` or `docs/update-readme`.
2. Keep the change small and focused on one thing.
3. Run `npm run build` and fix any type errors before you push.
4. Open a pull request and fill in the template.

## Commit messages

Use short, clear messages with a type prefix:

| Prefix | Use for |
|---|---|
| `feat:` | a new feature |
| `fix:` | a bug fix |
| `docs:` | documentation only |
| `chore:` | tooling, config, cleanup |
| `refactor:` | code changes with no behaviour change |

Example: `fix: show a clear error when the rating link has expired`

## Rules for this project

- **Never commit secrets.** `.env.local` and the Supabase service-role key stay out of Git.
- **Database changes go in a new SQL file**, for example `supabase/part9.sql`. Do not edit an old file that people may already have run.
- **Keep the customer flow free of accounts.** A customer should only ever need the rating link.
- **Do not weaken the anti-fraud checks** without discussing it in an issue first.
- Security problems should be reported privately through GitHub's **Report a vulnerability** button, not in public issues.

## Ideas to start with

See the Roadmap in the README. Good first tasks are translations (Tamil), clearer error messages, and accessibility improvements.