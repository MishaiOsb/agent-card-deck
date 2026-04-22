/* ============================================================
   AGENT DECK ROUTES — add to your existing IAI Worker
   Added: 2026-04-22
   ============================================================

   These routes let the Agent Card Deck submit deck data and the
   IAI Pod Dashboard read it. Data is stored in KV namespace IAI_DECKS
   (bound as `env.DECKS`). Auth uses shared secret `env.DECK_SHARED_TOKEN`.

   HOW TO INSTALL
   --------------
   1. Cloudflare: Workers & Pages → KV → Create namespace "IAI_DECKS"
   2. Workers → your worker → Settings → Variables:
        - KV Namespace Binding:  DECKS → IAI_DECKS
        - Secret:                DECK_SHARED_TOKEN = <random string>
   3. Paste the ROUTING block below into your worker's fetch() handler,
      near the other routes (e.g. next to Slack / OpenAI / Claude routing).
   4. Paste the HANDLERS and HELPERS blocks at the bottom of the file
      (outside the fetch() handler).
   5. Make sure your CORS headers include X-Deck-Token and X-Deck-Pod
      (see CORS block — merge with your existing CORS if you already have one).
   6. Save and deploy.

   ENDPOINTS
   ---------
   POST /deck/save       Upsert a deck. Spec-only fields from deck app;
                         Worker preserves delivery state and auto-increments
                         revision counter on re-submit.
   GET  /deck/list?pod=X List all deck summaries for a pod.
   GET  /deck/get?id=X&pod=Y  Fetch a single full deck record.
   ============================================================ */


/* ==========================================================================
   ROUTING — paste inside your existing fetch(request, env, ctx) handler,
   near your other route checks.
   ========================================================================== */

/*
if (url.pathname === '/deck/save' && request.method === 'POST') {
  return handleDeckSave(request, env);
}
if (url.pathname === '/deck/list' && request.method === 'GET') {
  return handleDeckList(url, request, env);
}
if (url.pathname === '/deck/get' && request.method === 'GET') {
  return handleDeckGet(url, request, env);
}
*/


/* ==========================================================================
   CORS — if your worker already has a CORS object, just ADD these two headers
   to the Access-Control-Allow-Headers list:  X-Deck-Token, X-Deck-Pod
   If you don't have CORS yet, use this block.
   ========================================================================== */

const DECK_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Deck-Token, X-Deck-Pod, X-Slack-Token, X-OpenAI-Key, X-Claude-Key',
  'Access-Control-Max-Age': '86400',
};

/* If you don't already handle OPTIONS preflight:
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: DECK_CORS });
}
*/


/* ==========================================================================
   HANDLERS — paste at the bottom of your worker file
   ========================================================================== */

function deckJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...DECK_CORS },
  });
}

function checkDeckAuth(request, env) {
  const token = request.headers.get('X-Deck-Token');
  const expected = env.DECK_SHARED_TOKEN;
  if (!expected) {
    console.error('[Deck] DECK_SHARED_TOKEN not configured on worker');
    return false;
  }
  return token === expected;
}

function slugifyClientName(name) {
  return (name || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function handleDeckSave(request, env) {
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return deckJson({ ok: false, error: 'invalid-json' }, 400);
  }

  const { deckId, pod, clientName, projectName, submittedBy, deck } = body;

  if (!deckId || !pod || !clientName || !deck) {
    return deckJson({
      ok: false,
      error: 'missing-fields',
      required: ['deckId', 'pod', 'clientName', 'deck'],
    }, 400);
  }

  const key = `deck:${pod}:${deckId}`;
  const now = new Date().toISOString();
  const clientSlug = slugifyClientName(clientName);

  // Fetch existing to merge (preserve delivery state, increment revision)
  let existing = null;
  try {
    const raw = await env.DECKS.get(key);
    existing = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[Deck] KV get failed:', e.message);
  }

  const record = {
    // Identity
    deckId,
    pod,
    clientName,
    clientSlug,
    projectName: projectName || '',
    submittedBy: submittedBy || '',

    // Spec (owned by deck app — fresh every save)
    deck,

    // Delivery state (owned by dashboard — preserved across re-submits)
    currentGate: existing?.currentGate ?? 0,        // 0 = pre-gate, 1/2/3 = gates
    gateHistory: existing?.gateHistory ?? [],
    signoffs: existing?.signoffs ?? {},             // { agentId: true/false }
    status: existing?.status ?? 'submitted',
    notes: existing?.notes ?? '',

    // Revision counter (owned by worker — auto-increments on re-submit)
    revisionsUsed: existing ? (existing.revisionsUsed ?? 0) + 1 : 0,

    // Timestamps
    firstSubmittedAt: existing?.firstSubmittedAt ?? now,
    lastUpdatedAt: now,
  };

  try {
    await env.DECKS.put(key, JSON.stringify(record));
  } catch (e) {
    console.error('[Deck] KV put failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500);
  }

  return deckJson({
    ok: true,
    deckId,
    clientSlug,
    revisionsUsed: record.revisionsUsed,
    firstSubmission: !existing,
  });
}

async function handleDeckList(url, request, env) {
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401);
  }

  const pod = url.searchParams.get('pod');
  if (!pod) {
    return deckJson({ ok: false, error: 'missing-pod' }, 400);
  }

  let list;
  try {
    list = await env.DECKS.list({ prefix: `deck:${pod}:` });
  } catch (e) {
    console.error('[Deck] KV list failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500);
  }

  const decks = await Promise.all(
    list.keys.map(async (k) => {
      try {
        const raw = await env.DECKS.get(k.name);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })
  );

  // Summary fields only — full deck fetched on demand via /deck/get
  const summaries = decks.filter(Boolean).map(d => ({
    deckId: d.deckId,
    clientName: d.clientName,
    clientSlug: d.clientSlug,
    projectName: d.projectName,
    submittedBy: d.submittedBy,
    currentGate: d.currentGate,
    status: d.status,
    revisionsUsed: d.revisionsUsed,
    signoffCount: Object.values(d.signoffs || {}).filter(Boolean).length,
    agentCount: Array.isArray(d.deck?.agents) ? d.deck.agents.length : 0,
    backlogCount: Array.isArray(d.deck?.backlog) ? d.deck.backlog.length : 0,
    totalEstimate: d.deck?.timeline?.totalEstimate || '',
    lastUpdatedAt: d.lastUpdatedAt,
    firstSubmittedAt: d.firstSubmittedAt,
  }));

  return deckJson({
    ok: true,
    pod,
    decks: summaries,
    count: summaries.length,
  });
}

async function handleDeckGet(url, request, env) {
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401);
  }

  const deckId = url.searchParams.get('id');
  const pod = url.searchParams.get('pod');

  if (!deckId || !pod) {
    return deckJson({ ok: false, error: 'missing-fields' }, 400);
  }

  let raw;
  try {
    raw = await env.DECKS.get(`deck:${pod}:${deckId}`);
  } catch (e) {
    console.error('[Deck] KV get failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500);
  }

  if (!raw) {
    return deckJson({ ok: false, error: 'not-found' }, 404);
  }

  return deckJson({ ok: true, deck: JSON.parse(raw) });
}

/* ==========================================================================
   END OF DECK ROUTES
   ========================================================================== */
