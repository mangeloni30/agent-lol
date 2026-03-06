/**
 * Eval runner for "why we won/lost".
 *
 * What this does:
 * 1. Loads a fixture match (no real Riot API call).
 * 2. Builds the same summary the API would build.
 * 3. Calls OpenAI with the same prompt the API uses.
 * 4. Runs pass/fail criteria on the model output.
 * 5. Prints a simple report.
 *
 * Run: npm run eval:why-won
 * Loads OPENAI_KEY from the project .env (repo root) if not already set.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runAll } from './criteria.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const green = '\x1b[32m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

// Load .env from project root so OPENAI_KEY is available without passing it on the CLI
function loadEnvFromRoot() {
  const root = join(__dirname, '..', '..');
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvFromRoot();

// ---- Same logic as the API route (keep in sync with src/app/api/riot/match/why-won/route.js) ----
function buildMatchSummary(data) {
  const info = data?.info ?? {};
  const participants = info.participants ?? [];
  const teams = info.teams ?? [];
  const duration = info.gameDuration ?? 0;
  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const participantSummary = participants.map((p) => ({
    championName: p.championName,
    teamId: p.teamId,
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    goldEarned: p.goldEarned,
    totalDamageDealtToChampions: p.totalDamageDealtToChampions,
    visionScore: p.visionScore,
    role: p.teamPosition || p.individualPosition,
  }));

  return {
    gameDuration: `${durationMin}m ${durationSec}s`,
    teams: teams.map((t) => ({
      teamId: t.teamId,
      win: t.win,
      objectives: t.objectives ?? {},
    })),
    participants: participantSummary,
  };
}

async function callWhyWonAgent(summary, userTeamId, userRole) {
  const openaiKey = process.env.OPENAI_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_KEY is required. Set it in .env or: OPENAI_KEY=sk-... node evals/why-won/run.mjs');
  }

  const teamContext = userTeamId != null ? `The player asking is on teamId=${userTeamId}. ` : '';
  const roleContext =
    userRole != null
      ? `Their role is ${userRole}: consider this when analyzing (e.g. for support, farming is not the main task; focus on what matters for that role). `
      : '';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are a League of Legends coach. You are given a match summary (teams, objectives, participants with KDA, gold, damage).
Always consider the asking player's role: e.g. for support, farming is not their main task; focus on what matters for that role (vision, peel, engages, etc.). For other roles, weight metrics accordingly.
Your task: in 2–4 sentences in English, explain why the winning team won (objectives, advantages, decisions) and what the losing team could have done to prevent it or turn it around. Be direct and useful.`,
        },
        {
          role: 'user',
          content: `${teamContext}${roleContext}Match summary:\n${JSON.stringify(summary)}\n\nExplain why the winning team won and what the losing team could have done (2–4 sentences, in English).`,
        },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI ${res.status}`);
  return json?.choices?.[0]?.message?.content?.trim() ?? null;
}

// ---- Main ----
async function main() {
  console.log('Eval: Why we won/lost\n');

  const fixturePath = join(__dirname, 'fixtures', 'sample-match.json');
  const raw = readFileSync(fixturePath, 'utf-8');
  const matchData = JSON.parse(raw);

  const summary = buildMatchSummary(matchData);
  // Fixture: first participant is support (Janna), teamId 100 (winning team)
  const userTeamId = 100;
  const userRole = 'UTILITY';

  console.log('Fixture: sample-match.json (player role = UTILITY/support, team 100 won)\n');
  console.log('Calling OpenAI (same prompt as API)...');

  const output = await callWhyWonAgent(summary, userTeamId, userRole);
  console.log('\n--- Model output ---\n');
  console.log(output || '(empty)');
  console.log('\n--- Criteria ---\n');

  const result = runAll(output, { minLen: 80, role: userRole });

  for (const c of result.criteria) {
    const icon = c.pass ? '  ✓' : '  ✗';
    const color = c.pass ? green : red;
    console.log(color + icon + reset, c.message);
  }

  console.log('\n--- Summary ---\n');
  console.log(`Passed ${result.passed}/${result.total} criteria`);
  console.log(result.allPass ? green + 'PASS' + reset : red + 'FAIL' + reset);
  process.exit(result.allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
