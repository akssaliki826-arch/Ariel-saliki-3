const axios = require("axios");

module.exports = {
  config: {
    name: "amour",
    aliases: [],
    version: "1.4.0",
    role: 0,
    category: "jeux",
    description: "Choisit au hasard un membre du groupe ❤️"
  },

  onStart: async () => {},

  onChat: async function ({ event, message, api }) {
    if (!event.body || !api) return;

    const texte = event.body.trim().toLowerCase();
    if (texte !== "amour") return;

    try {
      // ✅ Méthode la plus fiable pour récupérer les membres
      const infoGroupe = await api.getThreadInfo(event.threadID);
      const listeIds = infoGroupe.participantIDs || [];

      if (listeIds.length === 0) {
        return message.reply("❌ Aucun membre détecté dans ce groupe 😕");
      }

      // 🎲 Choix aléatoire
      const idChoisi = listeIds[Math.floor(Math.random() * listeIds.length)];

      // ✅ Récupération du nom de manière sûre
      const infosUtilisateurs = await api.getUserInfo([idChoisi]);
      const nom = infosUtilisateurs[idChoisi]?.name || "Ce membre";

      // 💬 Réponse simple et directe
      return message.reply(`💖 Ton amour du jour est : ❤️\n✨ ${nom} ✨`);

    } catch (erreur) {
      console.log("Erreur jeu amour :", erreur);
      return message.reply("❌ Une petite erreur est survenue, réessaie ! ❤️");
    }
  }
};
