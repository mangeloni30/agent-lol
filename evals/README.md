# Evals (evaluations)

Evals check that our AI features behave as we expect. They run **offline** (no dev server, no Riot API) using **fixture data** and **criteria** so results are reproducible.

## Why we won/lost eval

- **What it does:** Calls the same “why we won/lost” coach prompt we use in the API, with a fixed match fixture, then runs pass/fail criteria on the model output.
- **Where:** `evals/why-won/`
  - `fixtures/sample-match.json` – one Riot-style match (team 100 won, team 200 lost; one support player).
  - `criteria.mjs` – rules: has content, min length, mentions win/team/lose, English, and for support role “not only farming”.
  - `run.mjs` – loads fixture → builds summary → calls OpenAI → runs criteria → prints report.

### How to run

```bash
# From project root (loads OPENAI_KEY from .env if you use dotenv, or set it explicitly)
OPENAI_KEY=sk-your-key npm run eval:why-won
```

Or:

```bash
node evals/why-won/run.mjs
```

(Ensure `OPENAI_KEY` is in your environment or `.env` if you load it in the shell.)

### What you’ll see

1. **Fixture** – which match and role we’re using (support on winning team).
2. **Model output** – the 2–4 sentences from the coach.
3. **Criteria** – ✓/✗ for each check (content, length, relevance, English, not-only-farming for support).
4. **Summary** – e.g. `Passed 5/5 criteria` and **PASS** or **FAIL**. Exit code 0 = pass, 1 = fail (so you can use this in CI later).

### Adding more evals

- Add another fixture in `fixtures/` (e.g. a losing-team match) and in `run.mjs` run the agent for that fixture and optionally add a second “case” that runs the same criteria.
- Add criteria in `criteria.mjs` (e.g. “contains the word ‘objective’” or “sentence count between 2 and 4”) and call them from `runAll` or from the runner.

Keeping the **prompt and summary logic** in `run.mjs` in sync with the API route (e.g. `src/app/api/riot/match/why-won/route.js`) ensures the eval actually tests what production uses.
