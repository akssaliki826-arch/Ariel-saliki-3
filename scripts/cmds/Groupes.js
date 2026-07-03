const fs = require("fs");
const path = require("path");

// 📁 Sauvegarde temporaire de la liste des groupes
const LISTE_GROUPS = path.join(__dirname, "liste_groupes.json");

module.exports = {
  config: {
    name: "allgroupe",
    aliases: ["all groupe"],
    version: "1.1.0",
    role: 0,
    category: "gestion",
    description: "Liste tous les groupes et permet de quitter n'importe lequel (créateur seulement)"
  },

  onStart: async () => {},

  onChat: async function ({ event, message, api }) {
    if (!event.body || !api) return;

    const texte = event.body.trim().toLowerCase();
    const uidUtilisateur = event.senderID;

    // ✅ Vérification : seulement Ariel Aks Otaku
    const infosUtilisateur = await api.getUserInfo([uidUtilisateur]);
    const nomUtilisateur = infosUtilisateur[uidUtilisateur]?.name || "";
    if (nomUtilisateur.toLowerCase() !== "ariel aks otaku") return;

    // ✅ Commande : afficher tous les groupes
    if (texte === "all groupe") {
      try {
        const tousLesGroupes = await api.getThreadList(200, null, ["INBOX"]);
        const groupes = tousLesGroupes.filter(t => t.isGroup && t.threadID);

        if (!groupes.length) {
          return message.reply("❌ Je ne suis dans aucun groupe pour l'instant 🤷‍♀️");
        }

        // ✅ Enregistre la liste pour pouvoir quitter plus tard
        fs.writeFileSync(LISTE_GROUPS, JSON.stringify(groupes.map(g => ({ id: g.threadID, nom: g.name || "Groupe sans nom" })), null, 2));

        let reponse = `📋 **Liste des groupes où je suis présente (${groupes.length}) :**\n\n`;
        groupes.forEach((g, i) => {
          reponse += `🔹 ${i+1}. ${g.name || "Groupe sans nom"}\n`;
        });
        reponse += `\n💡 Pour faire quitter un groupe : écris : **quitter groupe NUMÉRO**\nExemple : quitter groupe 2`;

        return message.reply(reponse);

      } catch (err) {
        console.log("Erreur liste groupes :", err);
        return message.reply("❌ Impossible de récupérer la liste des groupes 😕");
      }
    }

    // ✅ Commande : quitter un groupe par son numéro
    const match = texte.match(/^quitter groupe (\d+)$/);
    if (match) {
      const numero = parseInt(match[1]) - 1;
      if (!fs.existsSync(LISTE_GROUPS)) {
        return message.reply("❌ D'abord écris : **all groupe** pour charger la liste 📋");
      }

      const liste = JSON.parse(fs.readFileSync(LISTE_GROUPS, "utf8"));
      if (numero < 0 || numero >= liste.length) {
        return message.reply("❌ Numéro invalide ! Vérifie la liste et réessaie 🤔");
      }

      const groupe = liste[numero];
      try {
        await message.reply(`👋 Je quitte le groupe : **${groupe.nom}** ✨`);
        setTimeout(() => {
          api.removeUserFromGroup(api.getCurrentUserID(), groupe.id);
        }, 1500);
      } catch (err) {
        console.log("Erreur quitter groupe :", err);
        return message.reply("❌ Impossible de quitter ce groupe 😕");
      }
    }
  }
};
