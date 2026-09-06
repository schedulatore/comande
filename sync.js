import { getStore } from "@netlify/blobs";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

export default async (req) => {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const sessions = getStore("comande-sessions");
  const session = await sessions.get(token, { type: "json" });
  if (!session) return json({ error: "unauthorized" }, 401);

  const data = getStore("comande-data");

  if (req.method === "GET") {
    const value = await data.get(session.username, { type: "json" });
    return json({ data: value || null });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "richiesta non valida" }, 400);
    }
    await data.setJSON(session.username, body);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/sync" };
