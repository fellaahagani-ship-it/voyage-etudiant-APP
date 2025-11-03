const nodemailer = require("nodemailer");

// === CONFIGURATION DU SERVICE GMAIL ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "fellaahagani@gmail.com", // 👉 ton adresse Gmail
    pass: "rdrq bhdg oeei qymy", // 👉 ton mot de passe d’application Gmail
  },
});

// === FONCTION EMAIL RESPONSIVE ===
async function sendAdminEmail(nomProf, module, destination, niveau, etudiants) {
  const htmlMessage = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f2f2f2;
        font-family: Arial, sans-serif;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
      }
      .header {
        background-color: #007BFF;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header h2 {
        margin: 0;
        font-size: 20px;
      }
      .content {
        padding: 20px;
        color: #333333;
      }
      .section {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .section h3 {
        margin-top: 0;
        color: #007BFF;
      }
      .footer {
        background-color: #007BFF;
        color: #ffffff;
        text-align: center;
        padding: 10px;
        font-size: 13px;
      }
      @media screen and (max-width: 600px) {
        .content {
          padding: 15px;
          font-size: 15px;
        }
        .section {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <table role="presentation">
      <tr>
        <td align="center">
          <table class="container" role="presentation">
            <tr>
              <td class="header">
                <h2>📢 Confirmation de la liste des étudiants</h2>
              </td>
            </tr>
            <tr>
              <td class="content">
                <p>Bonjour <strong>Administrateur</strong>,</p>
                <p>Le professeur <strong>${nomProf}</strong> a confirmé une nouvelle liste d’étudiants pour un voyage scolaire.</p>

                <div class="section">
                  <h3>🧭 Détails du voyage</h3>
                  <p><strong>📘 Module :</strong> ${module}</p>
                  <p><strong>🎓 Niveau :</strong> ${niveau}</p>
                  <p><strong>🌍 Destination :</strong> ${destination}</p>
                </div>

                <div class="section">
                  <h3>👥 Liste des étudiants</h3>
                  ${
                    Array.isArray(etudiants)
                      ? etudiants.map(e => `<p>• ${e}</p>`).join("")
                      : `<p>${etudiants}</p>`
                  }
                </div>

                <p style="text-align:center;color:#777;font-size:14px;">
                  📅 ${new Date().toLocaleString()} <br>
                  ✉️ Message automatique envoyé par <strong>Voyage Étudiant</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td class="footer">
                © ${new Date().getFullYear()} Voyage Étudiant — Tous droits réservés
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await transporter.sendMail({
  from: '"Voyage Étudiant" <tonemail@gmail.com>',
  to: "ton.vrai.email@domaine.com", // ⚠️ ne pas laisser admin@gmail.com si le compte n’existe pas
  subject: `Confirmation de la liste par ${nomProf}`,
  html: htmlMessage, // <== HTML bien formaté
  text: "Ce message contient des informations de confirmation de voyage étudiant.", // version texte de secours
  encoding: "utf-8", // <== force l’encodage
  headers: {
    "Content-Type": "text/html; charset=UTF-8",
    "Content-Transfer-Encoding": "quoted-printable"
  }
});

}

module.exports = { sendAdminEmail };
