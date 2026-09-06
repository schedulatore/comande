import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return json({ error: "richiesta non valida" }, 400);
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  const users = getStore("comande-users");
  const record = await users.get(username, { type: "json" });
  if (!record) {
    return json({ error: "Username o password errati." }, 401);
  }

  const hash = crypto.scryptSync(password, record.salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(record.hash, "hex");
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) {
    return json({ error: "Username o password errati." }, 401);
  }

  const token = crypto.randomBytes(24).toString("hex");
  const sessions = getStore("comande-sessions");
  await sessions.setJSON(token, { username, createdAt: Date.now() });

  return json({ token, username });
};

export const config = { path: "/api/login" };
