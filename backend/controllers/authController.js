const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const {
  getSessionCookieOptions,
  resolveAuthenticatedUser,
} = require("../utils/auth");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleSignIn(req, res) {
  const { id_token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const authUser = await resolveAuthenticatedUser({
      email: payload.email,
      name: payload.name,
    });
    if (!authUser) return res.status(403).json({ error: "Unauthorized" });

    const token = jwt.sign(
      { email: authUser.email, name: authUser.name, role: authUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // ✅ FIXED COOKIE (NO DOMAIN)
    res.cookie("session", token, getSessionCookieOptions(8 * 60 * 60 * 1000));

    res.json({
      ok: true,
      user: {
        id: authUser.id,
        role: authUser.role,
        email: authUser.email,
        name: authUser.name,
        teacherId: authUser.teacherId,
        teacher: authUser.teacher,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auth failed" });
  }
}

module.exports = { googleSignIn };
