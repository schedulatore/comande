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

  if (!username || username.length < 3) {
    return json({ error: "Lo username deve avere almeno 3 caratteri." }, 400);
  }
  if (!password || password.length < 6) {
    return json({ error: "La password deve avere almeno 6 caratteri." }, 400);
  }

  const users = getStore("comande-users");
  const existing = await users.get(username);
  if (existing) {
    return json({ error: "Questo username è già in uso." }, 409);
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  await users.setJSON(username, { salt, hash, createdAt: Date.now() });

  const token = crypto.randomBytes(24).toString("hex");
  const sessions = getStore("comande-sessions");
  await sessions.setJSON(token, { username, createdAt: Date.now() });

  return json({ token, username });
};

export const config = { path: "/api/signup" };
