require("dotenv").config();

const { sendContactEmails } = require("../lib/contact-mail");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });
  }

  const payload =
    req.body && typeof req.body === "object"
      ? req.body
      : typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : {};

  const result = await sendContactEmails(payload, process.env);
  return res.status(result.status).json(result.body);
};
