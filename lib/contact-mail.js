const nodemailer = require("nodemailer");

function cleanInput(value, maxLength) {
  return typeof value === "string"
    ? value.trim().replace(/\r/g, "").slice(0, maxLength)
    : "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTransporter(env = process.env) {
  const host = cleanInput(env.SMTP_HOST, 160) || "smtp.mail.ovh.net";
  const portValue = Number(env.SMTP_PORT || 465);
  const secure = `${env.SMTP_SECURE || "true"}`.toLowerCase() !== "false";
  const user = cleanInput(env.SMTP_USER, 160);
  const pass = env.SMTP_PASS || "";

  if (!user || !pass) {
    throw new Error("missing_smtp_credentials");
  }

  return nodemailer.createTransport({
    host,
    port: Number.isFinite(portValue) ? portValue : 465,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function buildStudioNotification({ name, email, phone, subject, message }) {
  return {
    subject: `[DÉCLIC Sculpt Studio] ${subject}`,
    text: [
      `Nom : ${name}`,
      `Email : ${email}`,
      `Téléphone : ${phone || "Non renseigné"}`,
      `Objet : ${subject}`,
      "",
      message,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
        <h2 style="margin:0 0 16px">Nouveau message depuis le site DÉCLIC Sculpt Studio</h2>
        <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(phone || "Non renseigné")}</p>
        <p><strong>Objet :</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message :</strong></p>
        <p style="white-space:pre-line">${escapeHtml(message)}</p>
      </div>
    `,
  };
}

function buildAutoReply({ name, message }) {
  const firstName = name.split(/\s+/)[0] || name;

  return {
    subject: "DÉCLIC Sculpt Studio | Nous avons bien reçu votre message",
    text: [
      `Bonjour ${firstName},`,
      "",
      "Votre message a bien été reçu par DÉCLIC Sculpt Studio.",
      "Nous revenons vers vous rapidement pour répondre à votre demande.",
      "",
      "Vous pouvez aussi réserver votre séance ici :",
      "https://www.planity.com/declic-sculpt-studio-33750-beychac-et-caillau",
      "",
      "Rappel de votre message :",
      message,
      "",
      "DÉCLIC Sculpt Studio",
      "26 Impasse de la Joncasse",
      "33750 Beychac-et-Caillau",
      "06 11 69 98 33",
      "contact@declicsculptstudio.fr",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.7;background:#f6f2ec;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ece2d4;padding:32px">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#c66a1c">
            DÉCLIC Sculpt Studio
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.05">Votre message a bien été reçu.</h1>
          <p style="margin:0 0 14px">Bonjour ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 14px">
            Merci pour votre message. L'équipe DÉCLIC Sculpt Studio revient vers vous rapidement.
          </p>
          <p style="margin:0 0 20px">
            Si vous voulez avancer tout de suite, vous pouvez réserver votre séance ici :
          </p>
          <p style="margin:0 0 24px">
            <a
              href="https://www.planity.com/declic-sculpt-studio-33750-beychac-et-caillau"
              style="display:inline-block;padding:14px 20px;background:#8f3400;color:#fff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase"
            >Réserver sur Planity</a>
          </p>
          <div style="margin:0 0 20px;padding:16px;background:#f7f3ee;border-left:4px solid #c66a1c">
            <p style="margin:0 0 8px;font-weight:700">Rappel de votre message</p>
            <p style="margin:0;white-space:pre-line">${escapeHtml(message)}</p>
          </div>
          <p style="margin:0;color:#5a5148">
            DÉCLIC Sculpt Studio<br>
            26 Impasse de la Joncasse<br>
            33750 Beychac-et-Caillau<br>
            06 11 69 98 33<br>
            contact@declicsculptstudio.fr
          </p>
        </div>
      </div>
    `,
  };
}

async function sendContactEmails(payload, env = process.env) {
  const name = cleanInput(payload.name, 80);
  const email = cleanInput(payload.email, 160).toLowerCase();
  const phone = cleanInput(payload.phone, 30);
  const subject = cleanInput(payload.subject, 120) || "Demande de contact";
  const message = cleanInput(payload.message, 4000);
  const website = cleanInput(payload.website, 120);

  if (website) {
    return { status: 200, body: { ok: true } };
  }

  if (!name || !email || !message) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Merci de renseigner votre nom, votre e-mail et votre message.",
      },
    };
  }

  if (!isEmail(email)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "L'adresse e-mail semble invalide.",
      },
    };
  }

  try {
    const transporter = getTransporter(env);
    const smtpUser = cleanInput(env.SMTP_USER, 160);
    const contactTo =
      cleanInput(env.CONTACT_TO, 160) ||
      cleanInput(env.SMTP_TO, 160) ||
      smtpUser;
    const fromAddress = cleanInput(env.SMTP_FROM, 160) || smtpUser;
    const studioNotification = buildStudioNotification({
      name,
      email,
      phone,
      subject,
      message,
    });

    await transporter.sendMail({
      from: `"DÉCLIC Sculpt Studio" <${fromAddress}>`,
      to: contactTo,
      replyTo: email,
      subject: studioNotification.subject,
      text: studioNotification.text,
      html: studioNotification.html,
    });

    if (`${env.AUTO_REPLY_ENABLED || "true"}`.toLowerCase() !== "false") {
      const autoReply = buildAutoReply({ name, message });

      try {
        await transporter.sendMail({
          from: `"DÉCLIC Sculpt Studio" <${fromAddress}>`,
          to: email,
          replyTo: fromAddress,
          subject: autoReply.subject,
          text: autoReply.text,
          html: autoReply.html,
        });
      } catch (autoReplyError) {
        console.error("Auto-reply failed:", autoReplyError);
      }
    }

    return {
      status: 200,
      body: {
        ok: true,
        message: "Message envoyé. Un e-mail de confirmation vient d'être envoyé.",
      },
    };
  } catch (error) {
    if (error && error.message === "missing_smtp_credentials") {
      return {
        status: 503,
        body: {
          ok: false,
          error: "Le serveur mail n'est pas encore configuré.",
        },
      };
    }

    console.error("SMTP send failed:", error);
    return {
      status: 500,
      body: {
        ok: false,
        error: "Envoi impossible pour le moment. Essayez plus tard ou utilisez l'adresse e-mail du studio.",
      },
    };
  }
}

module.exports = {
  sendContactEmails,
};
