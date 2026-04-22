/**
 * IAI slack-proxy Worker — full code with Agent Card Deck routes added
 *
 * What changed from your existing worker:
 *   1. `fetch(request)` → `fetch(request, env, ctx)` — required for KV access
 *   2. CORS: added GET method + X-Deck-Token, X-Deck-Pod headers
 *   3. New routes BEFORE the POST-only check:
 *        POST /deck/save   — upsert a deck from the Agent Card Deck app
 *        GET  /deck/list   — list decks for a pod (dashboard reads this)
 *        GET  /deck/get    — fetch a single full deck record
 *   4. New handler functions at the bottom: handleDeckSave, handleDeckList,
 *      handleDeckGet, plus checkDeckAuth, slugifyClientName, deckJson helpers
 *
 * Everything else (Anthropic, Fireflies, OpenAI, Slack) is unchanged.
 *
 * Paste this as the ENTIRE worker code in the Cloudflare editor, then Deploy.
 */

export default {
  async fetch(request, env, ctx) {
    const ALLOWED = [
      'https://iai-pod-dashboard.pages.dev',
      'https://mishaiosb.github.io',
      'http://localhost',
      'http://127.0.0.1'
    ];
    const origin = request.headers.get('Origin') || '';
    const cors = ALLOWED.find(a => origin.startsWith(a)) ? origin : ALLOWED[0];
    const headers = {
      'Access-Control-Allow-Origin': cors,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Slack-Token, X-OpenAI-Key, X-Anthropic-Key, X-Fireflies-Token, X-Deck-Token, X-Deck-Pod',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\//, '');

    // ==========================================================
    // DECK ROUTES — Agent Card Deck integration (KV-backed)
    // Handled BEFORE the POST-only check because /deck/list and
    // /deck/get are GET requests.
    // ==========================================================
    if (path === 'deck/save' && request.method === 'POST') {
      return handleDeckSave(request, env, headers);
    }
    if (path === 'deck/list' && request.method === 'GET') {
      return handleDeckList(url, request, env, headers);
    }
    if (path === 'deck/get' && request.method === 'GET') {
      return handleDeckGet(url, request, env, headers);
    }

    // All remaining routes below are POST-only
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    // ---- Anthropic (Claude) proxy route ----
    if (path === 'anthropic/messages') {
      const apiKey = request.headers.get('X-Anthropic-Key');
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'missing_key' }), {
          status: 401, headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: request.body
      });
      return new Response(anthropicResp.body, {
        status: anthropicResp.status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // ---- Fireflies proxy route ----
    if (path === 'fireflies/graphql') {
      const ffToken = request.headers.get('X-Fireflies-Token');
      if (!ffToken) {
        return new Response(JSON.stringify({ error: 'missing_token' }), {
          status: 401, headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      const ffResp = await fetch('https://api.fireflies.ai/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ffToken
        },
        body: request.body
      });
      return new Response(ffResp.body, {
        status: ffResp.status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // ---- OpenAI proxy route (whitelisted to chat/completions only) ----
    if (path === 'openai/chat/completions') {
      const apiKey = request.headers.get('X-OpenAI-Key');
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'missing_key' }), {
          status: 401, headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      const openaiPath = 'chat/completions';
      const openaiResp = await fetch('https://api.openai.com/v1/' + openaiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: request.body
      });
      return new Response(openaiResp.body, {
        status: openaiResp.status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // ---- Slack proxy route (default — matches any other path) ----
    const token = request.headers.get('X-Slack-Token');
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_token' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) form.append(k, String(v));

    const slackResp = await fetch('https://slack.com/api/' + path, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const data = await slackResp.text();
    return new Response(data, {
      status: slackResp.status,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
};


/* ================================================================
   DECK HANDLERS
   Called by the routing block above. Store deck records in the
   KV namespace bound as `env.DECKS` (binding: DECKS → IAI_DECKS).
   Auth: all routes require X-Deck-Token header matching
   `env.DECK_SHARED_TOKEN` secret.
   ================================================================ */

function deckJson(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function checkDeckAuth(request, env) {
  const token = request.headers.get('X-Deck-Token');
  const expected = env.DECK_SHARED_TOKEN;
  if (!expected) {
    console.error('[Deck] DECK_SHARED_TOKEN secret not configured on worker');
    return false;
  }
  return token === expected;
}

function slugifyClientName(name) {
  return (name || '').toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * POST /deck/save
 * Body: { deckId, pod, clientName, projectName, submittedBy, deck }
 * Upserts a deck record. Spec fields come from the deck app; delivery state
 * (currentGate, signoffs, status, notes) is preserved from any existing record.
 * Revision counter auto-increments on each re-submit.
 */
async function handleDeckSave(request, env, headers) {
  if (!env.DECKS) {
    return deckJson({ ok: false, error: 'kv-not-bound', message: 'DECKS KV binding missing on worker' }, 500, headers);
  }
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return deckJson({ ok: false, error: 'invalid-json' }, 400, headers);
  }

  const { deckId, pod, clientName, projectName, submittedBy, deck } = body;
  if (!deckId || !pod || !clientName || !deck) {
    return deckJson({
      ok: false, error: 'missing-fields',
      required: ['deckId', 'pod', 'clientName', 'deck']
    }, 400, headers);
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
    deckId, pod, clientName, clientSlug,
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

    // Revision counter (auto-increments on re-submit)
    revisionsUsed: existing ? (existing.revisionsUsed ?? 0) + 1 : 0,

    // Timestamps
    firstSubmittedAt: existing?.firstSubmittedAt ?? now,
    lastUpdatedAt: now,
  };

  try {
    await env.DECKS.put(key, JSON.stringify(record));
  } catch (e) {
    console.error('[Deck] KV put failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500, headers);
  }

  return deckJson({
    ok: true,
    deckId,
    clientSlug,
    revisionsUsed: record.revisionsUsed,
    firstSubmission: !existing,
  }, 200, headers);
}

/**
 * GET /deck/list?pod=X
 * Returns summary of all decks for the given pod.
 */
async function handleDeckList(url, request, env, headers) {
  if (!env.DECKS) {
    return deckJson({ ok: false, error: 'kv-not-bound' }, 500, headers);
  }
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  const pod = url.searchParams.get('pod');
  if (!pod) {
    return deckJson({ ok: false, error: 'missing-pod' }, 400, headers);
  }

  let list;
  try {
    list = await env.DECKS.list({ prefix: `deck:${pod}:` });
  } catch (e) {
    console.error('[Deck] KV list failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500, headers);
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

  // Summary fields only — full deck data fetched on demand via /deck/get
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
    ok: true, pod,
    decks: summaries,
    count: summaries.length
  }, 200, headers);
}

/**
 * GET /deck/get?id=X&pod=Y
 * Returns a full deck record (including agent specs, backlog, timeline).
 */
async function handleDeckGet(url, request, env, headers) {
  if (!env.DECKS) {
    return deckJson({ ok: false, error: 'kv-not-bound' }, 500, headers);
  }
  if (!checkDeckAuth(request, env)) {
    return deckJson({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  const deckId = url.searchParams.get('id');
  const pod = url.searchParams.get('pod');
  if (!deckId || !pod) {
    return deckJson({ ok: false, error: 'missing-fields' }, 400, headers);
  }

  let raw;
  try {
    raw = await env.DECKS.get(`deck:${pod}:${deckId}`);
  } catch (e) {
    console.error('[Deck] KV get failed:', e.message);
    return deckJson({ ok: false, error: 'storage-failed' }, 500, headers);
  }

  if (!raw) {
    return deckJson({ ok: false, error: 'not-found' }, 404, headers);
  }

  return deckJson({ ok: true, deck: JSON.parse(raw) }, 200, headers);
}
