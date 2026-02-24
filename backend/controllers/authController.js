import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const SALT_ROUNDS = 10;

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: { full_name: user.fullName },
    app_metadata: {},
  };
}

export async function register(req, res) {
  try {
    const { email, password } = req.body;
    const fullName = req.body.full_name || req.body.fullName || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
      include: { profile: true },
    });

    // Create profile on signup (mirrors Supabase handle_new_user)
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, fullName },
      update: { fullName },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      user: toUserResponse(user),
      session: {
        access_token: token,
        user: toUserResponse(user),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      user: toUserResponse(user),
      session: {
        access_token: token,
        user: toUserResponse(user),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = req.user;
  return res.json({
    user: toUserResponse(user),
    session: {
      access_token: req.headers.authorization?.replace("Bearer ", "") || "",
      user: toUserResponse(user),
    },
  });
}
