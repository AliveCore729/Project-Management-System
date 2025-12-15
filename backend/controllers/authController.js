const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleSignIn(req, res) {
  const { id_token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const teacher = await Teacher.findOne({ email: payload.email });
    if (!teacher) return res.status(403).json({ error: "Unauthorized" });
    const token = jwt.sign(
      { email: teacher.email, name: teacher.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("session", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      domain: "localhost",
      path: "/"
    });


    res.json({ ok: true, teacher });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Auth failed" });
  }
}
module.exports = { googleSignIn };
