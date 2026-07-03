module.exports = {
  config: {
    name: "quitter",
    aliases: [],
    version: "1.0.0",
    role: 0,
    category: "gestion",
    description: "Fait quitter le groupe au bot (réservé au créateur seulement)"
  },

  onStart: async () => {},

  onChat: async function ({ event, message, api }) {
    if (!event.body || !api) return;

    const texte = event.body.trim().toLowerCase();
    const uidUtilisateur = event.senderID;

    // ✅ Commande exacte
    if (texte !== "bb quitte le groupe") return;

    try {
      // ✅ Récupérer le nom de la personne qui écrit
      const infosUtilisateur = await api.getUserInfo([uidUtilisateur]);
      const nomUtilisateur = infosUtilisateur[uidUtilisateur]?.name || "";

      // ✅ Vérification stricte : seulement Ariel Aks Otaku peut l'utiliser
      if (nomUtilisateur.toLowerCase() !== "ariel aks otaku") {
        return message.reply("❌ Cette commande est réservée uniquement à mon créateur ! 🤍");
      }

      // ✅ Message de confirmation avant de quitter
      await message.reply("👋 Au revoir à tous ! Je quitte ce groupe sur demande de mon créateur ✨");

      // ✅ Le bot quitte le groupe
      setTimeout(() => {
        api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
      }, 2000); // Petite attente pour que le message s'envoie bien

    } catch (erreur) {
      console.log("Erreur quitter groupe :", erreur);
      return message.reply("❌ Impossible de quitter le groupe pour le moment. 🤍");
    }
  }
};
