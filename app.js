const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const session = require("express-session");
const { sendAdminEmail } = require("./config/email");


const app = express();
const PORT = 3000;

// === CONFIGURATION ===
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "study-tourism-secret",
  resave: false,
  saveUninitialized: true
}));

// === CONFIGURATION MULTER ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });
}

const dataPath = path.join(__dirname, "data", "prof.json");


// Crée automatiquement le dossier "data" s'il n'existe pas
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// === FONCTIONS UTILES ===
function lireProfs() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, "utf-8").trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("⚠️ Erreur lecture JSON :", err);
    return [];
  }
}

function ecrireProfs(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// === ROUTES ===

// 🏠 Page d’accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔐 Page de connexion
app.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"));
});

// 🧑‍🏫 Page d’inscription
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// 💾 Inscription
app.post("/register", upload.single("photo"), (req, res) => {
  let { nom, prenom, password } = req.body;

  // nettoyage
  nom = (nom || "").trim().toLowerCase();
  prenom = (prenom || "").trim();
  password = (password || "").trim();

  const photo = req.file ? `/uploads/${req.file.filename}` : "";
  let professeurs = lireProfs();

  // vérifier existence
  const existe = professeurs.find(p =>
    p.nom && p.password &&
    p.nom.trim().toLowerCase() === nom &&
    p.password.trim() === password
  );

  if (existe) {
    return res.send(`
      <div style="background:linear-gradient(135deg,#ff0000,#800000);height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;font-family:'Poppins',sans-serif;text-align:center;">
        <h2 style="margin-bottom:20px;">⚠️ هذا الحساب موجود بالفعل</h2>
        <a href="/auth" style="background:white;color:#ff0000;padding:10px 20px;border-radius:25px;text-decoration:none;font-weight:bold;">🔙 العودة إلى تسجيل الدخول</a>
      </div>
    `);
  }

  const nouveauProf = { nom, prenom, password, photo };
  professeurs.push(nouveauProf);
  ecrireProfs(professeurs);

  req.session.prof = nouveauProf;
  console.log("✅ Nouveau professeur ajouté :", nom);
  res.redirect("/dashboard");
});

// 🔑 Connexion
app.post("/login", (req, res) => {
  let { nom, password } = req.body;
  const professeurs = lireProfs();

  // validation de base
  if (!nom || !password) {
    return res.send("<h3>⚠️ Veuillez remplir tous les champs</h3><a href='/auth'>Retour</a>");
  }

  // nettoyage utilisateur
  nom = nom.trim().toLowerCase();
  password = password.trim();

  console.log("🔍 Tentative de connexion :", nom);

  // on filtre les profs valides
  const profsValides = professeurs.filter(p => p && p.nom && p.password);

  // recherche exacte
  const prof = profsValides.find(p =>
    p.nom.trim().toLowerCase() === nom &&
    p.password.trim() === password
  );

  if (prof) {
    req.session.prof = prof;
    console.log("✅ Connexion réussie :", prof.nom);
    return res.redirect("/dashboard");
  }

  console.log("❌ Nom ou mot de passe incorrect :", nom);
  res.send(`
    <div style="
      background: linear-gradient(135deg, #ff0000, #800000);
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: 'Poppins', sans-serif;
      text-align: center;">
      <h2 style="margin-bottom: 20px;">❌ كلمة المرور أو الاسم غير صحيح</h2>
      <a href="/auth" style="
        background: white;
        color: #ff0000;
        padding: 10px 20px;
        border-radius: 25px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s;">
        🔙 الرجوع إلى صفحة الدخول
      </a>
    </div>
  `);
});

// 🧭 Tableau de bord
app.get("/dashboard", (req, res) => {
  if (!req.session.prof) return res.redirect("/auth");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// 📦 API : infos prof connecté
app.get("/api/professeur", (req, res) => {
  if (!req.session.prof) return res.json({ nom: "Invité", prenom: "", photo: "" });
  res.json(req.session.prof);
});

// 🚪 Déconnexion
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/auth"));
});

// 📩 Confirmation

app.post("/envoyer-confirmation", async (req, res) => {
  const { module, destination, niveau, etudiants } = req.body;
  const prof = req.session.prof;

  console.log("=== 📩 Confirmation reçue ===");
  console.log("Professeur :", prof ? prof.nom : "Inconnu");

  try {
    const nomProf = prof ? `${prof.prenom} ${prof.nom}` : "Un professeur inconnu";
    await sendAdminEmail(nomProf, module, destination, niveau, etudiants);
    res.send("✅ Confirmation envoyée avec succès et email transmis à l’administrateur !");
  } catch (err) {
    console.error("❌ Erreur envoi email :", err);
    res.status(500).send("⚠️ Erreur lors de l’envoi de l’email à l’administrateur.");
  }
});




// 🧹 Nettoyage auto de prof.json au démarrage
try {
  let profs = lireProfs();
  profs = profs
    .filter(p => p && p.nom && p.password)
    .map(p => ({
      nom: p.nom.trim().toLowerCase(),
      prenom: (p.prenom || "").trim(),
      password: p.password.trim(),
      photo: p.photo || ""
    }));
  ecrireProfs(profs);
  console.log("🧼 prof.json nettoyé automatiquement ✅");
} catch (err) {
  console.error("⚠️ Erreur pendant le nettoyage de prof.json :", err);
}

// === Démarrage du serveur ===
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne : http://localhost:${PORT}`);
});
