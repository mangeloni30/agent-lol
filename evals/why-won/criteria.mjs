/**
 * Eval criteria for "why we won/lost" outputs.
 * Each criterion returns { pass: boolean, message: string }.
 * Keep these simple and deterministic so beginners can see what's being checked.
 */

/**
 * Output must exist and be a non-empty string.
 */
export function hasContent(output) {
  const ok = typeof output === 'string' && output.trim().length > 0;
  return {
    pass: ok,
    message: ok ? 'Has content' : 'Output is empty or not a string',
  };
}

/**
 * Output should be at least this many characters (encourages 2–4 sentences).
 */
export function minLength(output, min = 80) {
  const len = typeof output === 'string' ? output.length : 0;
  const ok = len >= min;
  return {
    pass: ok,
    message: ok ? `Length OK (${len} chars)` : `Too short: ${len} chars (min ${min})`,
  };
}

/**
 * Output should mention winning/team/result (basic relevance).
 */
export function mentionsResult(output) {
  const text = (output || '').toLowerCase();
  const hasWin = /\bwin(ning)?\b/.test(text) || /\bwon\b/.test(text);
  const hasTeam = /\bteam(s)?\b/.test(text);
  const hasLose = /\blos(t|ing)?\b/.test(text);
  const ok = hasWin || hasTeam || hasLose;
  return {
    pass: ok,
    message: ok ? 'Mentions result (win/team/lose)' : 'Does not clearly mention win/team/lose',
  };
}

/**
 * Output should be in English (no Spanish-specific chars/words).
 * Simple heuristic: common Spanish words or ñ/á/é/í/ó/ú in the first 500 chars.
 */
export function looksEnglish(output) {
  const text = (output || '').slice(0, 500);
  const hasSpanishChars = /[ñáéíóúü¿¡]/.test(text);
  const hasSpanishWords = /\b(equipo|ganaron|perdieron|partida|jugador|minuto)\b/i.test(text);
  const ok = !hasSpanishChars && !hasSpanishWords;
  return {
    pass: ok,
    message: ok ? 'Appears to be in English' : 'Contains Spanish (eval expects English)',
  };
}

/**
 * For support role: output should not over-emphasize farming (e.g. "farm" not the main focus).
 * We only require that "farm" / "cs" / "minions" is not the ONLY thing mentioned;
 * we don't require the model to avoid the word. So we just check that there's more than one
 * concept (e.g. objectives, team, gold, vision, etc.).
 */
export function notOnlyFarming(output) {
  const text = (output || '').toLowerCase();
  const hasFarm = /\b(farm|cs|minions?)\b/.test(text);
  const hasOther = /\b(objective|dragon|baron|tower|vision|team|gold|kill|fight)\b/.test(text);
  const ok = !hasFarm || hasOther;
  return {
    pass: ok,
    message: ok ? 'Does not focus only on farming' : 'Seems to focus only on farming (support eval)',
  };
}

/**
 * Run all criteria and return a summary.
 */
export function runAll(output, options = {}) {
  const { minLen = 80, role = null } = options;
  const results = [
    hasContent(output),
    minLength(output, minLen),
    mentionsResult(output),
    looksEnglish(output),
  ];
  if (role === 'UTILITY' || role === 'SUPPORT') {
    results.push(notOnlyFarming(output));
  }
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  return {
    passed,
    total,
    allPass: passed === total,
    criteria: results,
  };
}
