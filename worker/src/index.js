const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

const badRequest = (message) => json({ error: message }, 400);
const notFound = () => json({ error: "Not found" }, 404);

const nowUtc = () => new Date().toISOString();

const randomToken = (length) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
};

const parseBody = async (request) => {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
};

const requireFields = (body, fields) => {
  if (!body) return "Missing JSON body";
  for (const field of fields) {
    if (!body[field]) return `Missing field: ${field}`;
  }
  return null;
};

const scoreSubmission = (submission, key) => {
  if (!key) return null;
  let score = 0;
  if (submission.q3_neon_sign === key.q3_neon_sign) score += 1;
  if (submission.q4_photo_booth === key.q4_photo_booth) score += 1;
  if (submission.q5_sweetheart_table === key.q5_sweetheart_table) score += 1;
  if (submission.q6_choreographed_first_dance === key.q6_choreographed_first_dance) score += 1;
  if (submission.q7_best_man_speech_over_under === key.q7_best_man_speech_over_under) score += 1;
  if (submission.q8_maid_of_honor_speech_over_under === key.q8_maid_of_honor_speech_over_under) score += 1;
  if (submission.q9_best_man_beautiful_thank_parents === key.q9_best_man_beautiful_thank_parents) score += 1;
  if (submission.q10_job_mentioned === key.q10_job_mentioned) score += 1;
  if (submission.q11_bouquet_toss === key.q11_bouquet_toss) score += 1;
  if (submission.q12_dress_change === key.q12_dress_change) score += 1;
  return score;
};

const computeLeaderboard = (submissions, key, winnerId) => {
  const scored = submissions.map((submission) => {
    const score = scoreSubmission(submission, key);
    return {
      ...submission,
      total_points: score === null ? null : score,
      is_winner: winnerId === submission.id,
    };
  });

  const maxScore = scored.reduce((max, entry) => {
    if (entry.total_points === null) return max;
    return Math.max(max, entry.total_points);
  }, -1);

  const tied = scored
    .filter((entry) => entry.total_points !== null && entry.total_points === maxScore)
    .map((entry) => ({ id: entry.id, display_name: entry.display_name }));

  return { leaderboard: scored, tied };
};

const mapSubmissionRow = (row) => ({
  id: row.id,
  wedding_id: row.wedding_id,
  display_name: row.display_name,
  submitted_at_utc: row.submitted_at_utc,
  q1_whose_wedding: row.q1_whose_wedding,
  q2_your_name: row.q2_your_name,
  q3_neon_sign: row.q3_neon_sign,
  q4_photo_booth: row.q4_photo_booth,
  q5_sweetheart_table: row.q5_sweetheart_table,
  q6_choreographed_first_dance: row.q6_choreographed_first_dance,
  q7_best_man_speech_over_under: row.q7_best_man_speech_over_under,
  q8_maid_of_honor_speech_over_under: row.q8_maid_of_honor_speech_over_under,
  q9_best_man_beautiful_thank_parents: row.q9_best_man_beautiful_thank_parents,
  q10_job_mentioned: row.q10_job_mentioned,
  q11_bouquet_toss: row.q11_bouquet_toss,
  q12_dress_change: row.q12_dress_change,
  q13_tiebreaker: row.q13_tiebreaker,
});

const handleCreateWedding = async (request, env) => {
  const body = await parseBody(request);
  const missing = requireFields(body, ["name", "date"]);
  if (missing) return badRequest(missing);

  const inviteCode = randomToken(6);
  const adminToken = randomToken(32);
  const timestamp = nowUtc();

  await env.DB.prepare(
    `INSERT INTO weddings (name, date, invite_code, admin_token, submissions_open, created_at_utc, updated_at_utc)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(body.name, body.date, inviteCode, adminToken, timestamp, timestamp)
    .run();

  const wedding = await env.DB.prepare(
    "SELECT id, name, date, invite_code, admin_token, submissions_open FROM weddings WHERE invite_code = ?"
  )
    .bind(inviteCode)
    .first();

  return json({ wedding });
};

const handleGetWeddingByInvite = async (inviteCode, env) => {
  const wedding = await env.DB.prepare(
    "SELECT id, name, date, invite_code, submissions_open FROM weddings WHERE invite_code = ?"
  )
    .bind(inviteCode)
    .first();
  if (!wedding) return notFound();
  return json({ wedding });
};

const handleGetSubmission = async (inviteCode, displayName, env) => {
  const wedding = await env.DB.prepare(
    "SELECT id, submissions_open FROM weddings WHERE invite_code = ?"
  )
    .bind(inviteCode)
    .first();
  if (!wedding) return notFound();

  const submission = await env.DB.prepare(
    "SELECT * FROM submissions WHERE wedding_id = ? AND display_name = ?"
  )
    .bind(wedding.id, displayName)
    .first();

  if (!submission) return json({ exists: false, submissions_open: !!wedding.submissions_open });
  return json({
    exists: true,
    submissions_open: !!wedding.submissions_open,
    submission: mapSubmissionRow(submission),
  });
};

const handleSubmit = async (inviteCode, request, env) => {
  const wedding = await env.DB.prepare(
    "SELECT id, submissions_open FROM weddings WHERE invite_code = ?"
  )
    .bind(inviteCode)
    .first();
  if (!wedding) return notFound();

  if (!wedding.submissions_open) {
    return json({ error: "Submissions are closed." }, 403);
  }

  const body = await parseBody(request);
  const required = [
    "display_name",
    "q1_whose_wedding",
    "q2_your_name",
    "q3_neon_sign",
    "q4_photo_booth",
    "q5_sweetheart_table",
    "q6_choreographed_first_dance",
    "q7_best_man_speech_over_under",
    "q8_maid_of_honor_speech_over_under",
    "q9_best_man_beautiful_thank_parents",
    "q10_job_mentioned",
    "q11_bouquet_toss",
    "q12_dress_change",
    "q13_tiebreaker",
  ];
  const missing = requireFields(body, required);
  if (missing) return badRequest(missing);

  const existing = await env.DB.prepare(
    "SELECT * FROM submissions WHERE wedding_id = ? AND display_name = ?"
  )
    .bind(wedding.id, body.display_name)
    .first();

  if (existing) {
    return json({ already_submitted: true, submission: mapSubmissionRow(existing) }, 200);
  }

  const submittedAt = nowUtc();

  await env.DB.prepare(
    `INSERT INTO submissions (
      wedding_id, display_name, submitted_at_utc,
      q1_whose_wedding, q2_your_name, q3_neon_sign, q4_photo_booth, q5_sweetheart_table,
      q6_choreographed_first_dance, q7_best_man_speech_over_under, q8_maid_of_honor_speech_over_under,
      q9_best_man_beautiful_thank_parents, q10_job_mentioned, q11_bouquet_toss, q12_dress_change, q13_tiebreaker
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      wedding.id,
      body.display_name,
      submittedAt,
      body.q1_whose_wedding,
      body.q2_your_name,
      body.q3_neon_sign,
      body.q4_photo_booth,
      body.q5_sweetheart_table,
      body.q6_choreographed_first_dance,
      body.q7_best_man_speech_over_under,
      body.q8_maid_of_honor_speech_over_under,
      body.q9_best_man_beautiful_thank_parents,
      body.q10_job_mentioned,
      body.q11_bouquet_toss,
      body.q12_dress_change,
      body.q13_tiebreaker
    )
    .run();

  const saved = await env.DB.prepare(
    "SELECT * FROM submissions WHERE wedding_id = ? AND display_name = ?"
  )
    .bind(wedding.id, body.display_name)
    .first();

  return json({ already_submitted: false, submission: mapSubmissionRow(saved) });
};

const handleAdminGetWedding = async (adminToken, env) => {
  const wedding = await env.DB.prepare(
    "SELECT id, name, date, invite_code, submissions_open, winner_submission_id FROM weddings WHERE admin_token = ?"
  )
    .bind(adminToken)
    .first();
  if (!wedding) return notFound();

  const submissions = await env.DB.prepare(
    "SELECT * FROM submissions WHERE wedding_id = ? ORDER BY submitted_at_utc ASC"
  )
    .bind(wedding.id)
    .all();

  const answerKey = await env.DB.prepare(
    "SELECT * FROM answer_keys WHERE wedding_id = ?"
  )
    .bind(wedding.id)
    .first();

  const { leaderboard, tied } = computeLeaderboard(
    submissions.results.map(mapSubmissionRow),
    answerKey,
    wedding.winner_submission_id
  );

  return json({
    wedding,
    submissions: submissions.results.map(mapSubmissionRow),
    answer_key: answerKey,
    leaderboard,
    tied,
  });
};

const handleToggleSubmissions = async (adminToken, request, env) => {
  const body = await parseBody(request);
  const missing = requireFields(body, ["submissions_open"]);
  if (missing) return badRequest(missing);

  const wedding = await env.DB.prepare(
    "SELECT id FROM weddings WHERE admin_token = ?"
  )
    .bind(adminToken)
    .first();
  if (!wedding) return notFound();

  const updated = nowUtc();
  await env.DB.prepare(
    "UPDATE weddings SET submissions_open = ?, updated_at_utc = ? WHERE id = ?"
  )
    .bind(body.submissions_open ? 1 : 0, updated, wedding.id)
    .run();

  return json({ success: true });
};

const handleAnswerKey = async (adminToken, request, env) => {
  const body = await parseBody(request);
  const required = [
    "q3_neon_sign",
    "q4_photo_booth",
    "q5_sweetheart_table",
    "q6_choreographed_first_dance",
    "q7_best_man_speech_over_under",
    "q8_maid_of_honor_speech_over_under",
    "q9_best_man_beautiful_thank_parents",
    "q10_job_mentioned",
    "q11_bouquet_toss",
    "q12_dress_change",
  ];
  const missing = requireFields(body, required);
  if (missing) return badRequest(missing);

  const wedding = await env.DB.prepare(
    "SELECT id FROM weddings WHERE admin_token = ?"
  )
    .bind(adminToken)
    .first();
  if (!wedding) return notFound();

  await env.DB.prepare(
    `INSERT INTO answer_keys (
      wedding_id, q3_neon_sign, q4_photo_booth, q5_sweetheart_table, q6_choreographed_first_dance,
      q7_best_man_speech_over_under, q8_maid_of_honor_speech_over_under, q9_best_man_beautiful_thank_parents,
      q10_job_mentioned, q11_bouquet_toss, q12_dress_change
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wedding_id) DO UPDATE SET
      q3_neon_sign = excluded.q3_neon_sign,
      q4_photo_booth = excluded.q4_photo_booth,
      q5_sweetheart_table = excluded.q5_sweetheart_table,
      q6_choreographed_first_dance = excluded.q6_choreographed_first_dance,
      q7_best_man_speech_over_under = excluded.q7_best_man_speech_over_under,
      q8_maid_of_honor_speech_over_under = excluded.q8_maid_of_honor_speech_over_under,
      q9_best_man_beautiful_thank_parents = excluded.q9_best_man_beautiful_thank_parents,
      q10_job_mentioned = excluded.q10_job_mentioned,
      q11_bouquet_toss = excluded.q11_bouquet_toss,
      q12_dress_change = excluded.q12_dress_change
    `
  )
    .bind(
      wedding.id,
      body.q3_neon_sign,
      body.q4_photo_booth,
      body.q5_sweetheart_table,
      body.q6_choreographed_first_dance,
      body.q7_best_man_speech_over_under,
      body.q8_maid_of_honor_speech_over_under,
      body.q9_best_man_beautiful_thank_parents,
      body.q10_job_mentioned,
      body.q11_bouquet_toss,
      body.q12_dress_change
    )
    .run();

  return json({ success: true });
};

const handleWinner = async (adminToken, request, env) => {
  const body = await parseBody(request);
  const missing = requireFields(body, ["submission_id"]);
  if (missing) return badRequest(missing);

  const wedding = await env.DB.prepare(
    "SELECT id FROM weddings WHERE admin_token = ?"
  )
    .bind(adminToken)
    .first();
  if (!wedding) return notFound();

  await env.DB.prepare(
    "UPDATE weddings SET winner_submission_id = ?, updated_at_utc = ? WHERE id = ?"
  )
    .bind(body.submission_id, nowUtc(), wedding.id)
    .run();

  return json({ success: true });
};

const handleCsv = async (adminToken, env) => {
  const wedding = await env.DB.prepare(
    "SELECT id, name, date, winner_submission_id FROM weddings WHERE admin_token = ?"
  )
    .bind(adminToken)
    .first();
  if (!wedding) return notFound();

  const submissions = await env.DB.prepare(
    "SELECT * FROM submissions WHERE wedding_id = ? ORDER BY submitted_at_utc ASC"
  )
    .bind(wedding.id)
    .all();

  const answerKey = await env.DB.prepare(
    "SELECT * FROM answer_keys WHERE wedding_id = ?"
  )
    .bind(wedding.id)
    .first();

  const { leaderboard } = computeLeaderboard(
    submissions.results.map(mapSubmissionRow),
    answerKey,
    wedding.winner_submission_id
  );

  const headers = [
    "wedding_name",
    "wedding_date",
    "participant_display_name",
    "submitted_at_utc",
    "q1_whose_wedding",
    "q2_your_name",
    "q3_neon_sign",
    "q4_photo_booth",
    "q5_sweetheart_table",
    "q6_choreographed_first_dance",
    "q7_best_man_speech_over_under",
    "q8_maid_of_honor_speech_over_under",
    "q9_best_man_beautiful_thank_parents",
    "q10_job_mentioned",
    "q11_bouquet_toss",
    "q12_dress_change",
    "q13_tiebreak_answer",
    "total_points",
    "is_winner",
  ];

  const lines = [headers.join(",")];
  for (const entry of leaderboard) {
    const row = [
      wedding.name,
      wedding.date,
      entry.display_name,
      entry.submitted_at_utc,
      entry.q1_whose_wedding,
      entry.q2_your_name,
      entry.q3_neon_sign,
      entry.q4_photo_booth,
      entry.q5_sweetheart_table,
      entry.q6_choreographed_first_dance,
      entry.q7_best_man_speech_over_under,
      entry.q8_maid_of_honor_speech_over_under,
      entry.q9_best_man_beautiful_thank_parents,
      entry.q10_job_mentioned,
      entry.q11_bouquet_toss,
      entry.q12_dress_change,
      entry.q13_tiebreaker,
      entry.total_points ?? "",
      entry.is_winner ? "true" : "false",
    ];
    const escaped = row.map((value) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes("\n") || str.includes("\"")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(escaped.join(","));
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

const handleRecoverAdmin = async (request, env) => {
  const secret = request.headers.get("x-admin-recovery-secret");
  if (!secret || secret !== env.ADMIN_RECOVERY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await parseBody(request);
  const missing = requireFields(body, ["invite_code"]);
  if (missing) return badRequest(missing);

  const wedding = await env.DB.prepare(
    "SELECT id FROM weddings WHERE invite_code = ?"
  )
    .bind(body.invite_code)
    .first();
  if (!wedding) return notFound();

  const newToken = randomToken(32);
  await env.DB.prepare(
    "UPDATE weddings SET admin_token = ?, updated_at_utc = ? WHERE id = ?"
  )
    .bind(newToken, nowUtc(), wedding.id)
    .run();

  return json({ admin_token: newToken });
};

const handleOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Recovery-Secret",
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (request.method === "OPTIONS") return handleOptions();

    if (request.method === "POST" && pathname === "/api/admin/weddings") {
      return handleCreateWedding(request, env);
    }

    if (request.method === "GET" && pathname.startsWith("/api/weddings/")) {
      const [_, __, ___, inviteCode, segment] = pathname.split("/");
      if (!inviteCode) return notFound();
      if (segment === "submissions") {
        const displayName = searchParams.get("display_name");
        if (!displayName) return badRequest("Missing display_name");
        return handleGetSubmission(inviteCode, displayName, env);
      }
      return handleGetWeddingByInvite(inviteCode, env);
    }

    if (request.method === "POST" && pathname.startsWith("/api/weddings/")) {
      const [_, __, ___, inviteCode, segment] = pathname.split("/");
      if (!inviteCode || segment !== "submissions") return notFound();
      return handleSubmit(inviteCode, request, env);
    }

    if (request.method === "GET" && pathname.startsWith("/api/admin/weddings/")) {
      const [_, __, ___, adminToken, segment] = pathname.split("/");
      if (!adminToken) return notFound();
      if (segment === "csv") {
        return handleCsv(adminToken, env);
      }
      return handleAdminGetWedding(adminToken, env);
    }

    if (request.method === "POST" && pathname.startsWith("/api/admin/weddings/")) {
      const [_, __, ___, adminToken, segment] = pathname.split("/");
      if (!adminToken) return notFound();
      if (segment === "toggle") {
        return handleToggleSubmissions(adminToken, request, env);
      }
      if (segment === "answer-key") {
        return handleAnswerKey(adminToken, request, env);
      }
      if (segment === "winner") {
        return handleWinner(adminToken, request, env);
      }
      return notFound();
    }

    if (request.method === "POST" && pathname === "/api/admin/recover") {
      return handleRecoverAdmin(request, env);
    }

    return notFound();
  },
};
