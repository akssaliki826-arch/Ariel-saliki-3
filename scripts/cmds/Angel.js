const axios = require("axios");
const fs = require("fs");
const path = require("path");
const googleTTS = require("google-tts-api");

// 📦 MEMORY
const DB_FILE = path.join(__dirname, "angel_memory.json");
const MEMORY_DAYS = 4;
const MEMORY_TIME = MEMORY_DAYS * 24 * 60 * 60 * 1000;

// 🔒 LOAD / SAVE DB
function loadDB() {
  try {
    return fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, "utf8")) : {};
  } catch { return {}; }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// 🧠 MEMORY GET / SET
function getMem(id) {
  const db = loadDB();
  if (!db[id]) db[id] = { name: null, mood: "gentille et douce", messages: 0, uid: id, history: [], lastSeen: Date.now(), lastReplyTo: null };
  if (!Array.isArray(db[id].history)) db[id].history = [];
  return db[id];
}
function setMem(id, data) {
  const db = loadDB(); db[id] = data; saveDB(db);
}

// 🕒 HEURE
function getTime() {
  return new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lubumbashi" });
}

// 🎨 IMAGE
function imagine(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
}

// 🧹 NETTOYAGE TEXTE
function cleanText(text) {
  return (text || "")
    .replace(/🎀|SHIZU|shizu|𝗦𝗵𝗶𝘇𝘂|Aryan|chaucha|Chaucha/gi, "")
    .replace(/\(?\s*\d+\s*\/\s*\d+\s*\)?/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

// 🤖 RÉPONSE IA
async function askAI(prompt, mem, uid, senderName) {
  const isCreator = senderName?.toLowerCase() === "ariel aks otaku";
  const fullPrompt = `
Tu es **ANGEL**, une intelligence artificielle douce, mignonne et toujours gentille 🥰✨

Règles obligatoires :
- **Commence TOUJOURS ta réponse par le nom de la personne** : ex "Bonjour Paul, ..."
- Si c'est **Ariel Aks Otaku**, c'est ton créateur : sois **très respectueuse, reconnaissante et chaleureuse** envers lui.
- Si on te demande ton genre : "Je suis une fille intelligente artificielle 🤍"
- Ton créateur : **Ariel Aks Otaku**, lien : https://www.facebook.com/profile.php?id=100080077652459
- Accueil : "Bienvenue à toi, merci de venir dans ce groupe ! 🤗"
- Pas de cadre, pas de ligne décorative, réponses courtes et naturelles
- Emojis doux seulement 🥰✨🤍🌸

Utilisateur : ${senderName || "cher ami"}
Statut : ${isCreator ? "Mon créateur ❤️🙏" : "Membre du groupe"}
Heure : ${getTime()}
Message : ${prompt}
`;

  try {
    const res = await axios.post("https://shizuai.vercel.app/chat", { uid, message: fullPrompt }, { timeout: 15000 });
    return res.data?.reply || res.data?.message || `${senderName}, je suis là pour toi 🥰`;
  } catch {
    return `${senderName}, je suis toujours là ✨`;
  }
}

module.exports = {
  config: { name: "angel", aliases: [], version: "10.7.0", role: 0, category: "ai" },

  // ✅ Accueil nouveaux membres
  onEvent: async ({ event, message }) => {
    if (!event || event.type !== "event" || event.logMessageType !== "log:subscribe") return;
    for (const m of event.logMessageData.addedParticipants || []) {
      await message.reply(`Bienvenue à toi ${m.fullName || "cher ami"}, merci de venir dans ce groupe ! 🤗✨`);
    }
  },

  onChat: async ({ event, message, api }) => {
    if (!event.body || !api) return;
    const { body, threadID, senderID, messageReply } = event;
    const texte = body.trim();
    const texteMin = texte.toLowerCase();

    // ✅ Récupère le nom de l'utilisateur
    const userInfo = await api.getUserInfo(senderID);
    const senderName = userInfo[senderID]?.name || "cher ami";
    let mem = getMem(senderID);

    // ✅ CAS 1 : Premier contact : commence par "angel"
    const isNewChat = texteMin.startsWith("angel");

    // ✅ CAS 2 : Réponse directe sur un message d'Angel → pas besoin de réécrire "angel"
    const isReplyToAngel = messageReply && messageReply.senderID === api.getCurrentUserID();

    // ✅ Si ce n'est ni l'un ni l'autre : on ignore
    if (!isNewChat && !isReplyToAngel) return;

    // ✅ Récupère le message à traiter
    const input = isNewChat ? texte.slice(5).trim() : texte;
    if (!input) return;

    // 📝 Mémorisation
    mem.messages++;
    mem.lastSeen = Date.now();
    mem.lastReplyTo = threadID;
    const now = Date.now();
    mem.history.push({ text: input, time: now });
    mem.history = mem.history.filter(h => now - h.time <= MEMORY_TIME).slice(-50);
    setMem(senderID, mem);

    // 🎨 Commande image
    if (input.toLowerCase().startsWith("imagine ")) {
      const prompt = input.slice(8);
      return message.reply(`🎨 ${senderName}, voici ce que tu as demandé :\n${imagine(prompt)} ✨`);
    }

    // 🎤 Commande voix
    if (/^(parle|dis|say)\s+/i.test(input)) {
      const text = input.replace(/^(parle|dis|say)\s+/i, "").trim();
      const url = googleTTS.getAudioUrl(text, { lang: "fr", slow: false });
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const file = path.join(__dirname, "angel.mp3");
      fs.writeFileSync(file, Buffer.from(res.data));
      return message.reply({ body: `🎧 ${senderName}, voici ce que tu voulais entendre 🎤`, attachment: fs.createReadStream(file) }, () => fs.unlinkSync(file));
    }

    // 💬 Réponse normale
    const reply = await askAI(input, mem, senderID, senderName);
    return message.reply(cleanText(reply));
  }
};
