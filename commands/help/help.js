const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const itemsPerPage = 1; // Nombre d'éléments par page

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Pour vous aider"),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      let test = [
        {
          name: "Commande /drop",
          description: "Lance ta ligne et attrape quelque chose !",
          long_description:
            "- `/drop [type] [nombre]`\n" +
            "  1. Permet de lancer votre ligne et d'attraper des items aléatoires selon le type de drop choisi.\n" +
            "  2. Chaque item a une rareté (commun, peu commun, rare, très rare) et son propre emoji représentatif.\n" +
            "  3. Le nombre maximum de tentatives est défini par votre rôle :\n" +
            "     - Par défaut, vous avez 10 tentatives / jour.\n" +
            "     - Pour les membres, c'est 15 tentatives / jour.\n" +
            "     - Pour les VIP, c'est 20 tentatives / jour.\n" +
            "     - Pour les Légendes, c'est 25 tentatives / jour.",
        },

        {
          name: "Commande /sell",
          description:
            "Vendez tous les articles d'une rareté spécifique ou tous les articles de votre inventaire.",
          long_description:
            "- `/sell [sous-commande]`\n" +
            "  - **Sous-commandes :**\n" +
            "    1. `dry` : Simule la vente de tous vos items.\n" +
            "    2. `inventory [rarity]` : Simule la vente de tous vos items, ou des items d'une rareté spécifique si elle est indiquée.\n" +
            "  - **Options :**\n" +
            "    - `rarity` (facultatif) : Rareté des articles à vendre (commun, peu commun, rare, très rare). Si non spécifiée, tous les items sont vendus.\n" +
            "  - **Multiplieur de Rôle :**\n" +
            "    - Vos gains sont affectés par un multiplicateur basé sur votre rôle :\n" +
            "      1. `Membre` : 60% du prix total.\n" +
            "      2. `VIP` : 70% du prix total.\n" +
            "      3. `Légende` : 80% du prix total.\n",
        },

        {
          name: "Commande /rank",
          description: "Affiche différents classements",
          long_description:
          "- `/rank [sous-commande]`\n" +
          "  - **Sous-commandes :**\n" +
          "    1. `voice` : Classe par temps de vocal.\n" +
          "    2. `dollars` : Classe par :dollar:.\n",
        },

        {
          name: "Commande /vote",
          description: "Affiche le lien pour voter pour le serveur",
          long_description:
          "- `/vote `\n" +
          "  1. Permet de voter pour le serveur sur le site server-prive.net.\n" +
          "  2. Une fois le vote effectué vous gagnez 500 :dollar:.\n",
        },

        {
          name: "Autres commandes",
          description: "Les plus petites commandes",
          long_description:
          "\n__Les commandes fun__\n" +
          "- `/kiss [user] `\n" +
          "  1. Permet d'embrasser un utilisateur.\n" +
          "- `/love [user1] [user2] `\n" +
          "  1. Calcule la compatibilité amouseure entre les deux utilisateurs.\n"+
          "- `/secret [user]  `\n" +
          "  1. Envoie votre message personnalisé anonynement à un utilisateur en MP grâce au bot.\n"+
          "  2. Vous ne pourrez pas voir sa réponse.\n"+
          "- `/bio [biographie]  `\n" +
          "  1. Change votre biographie du profil du bot.\n"+
          "- `/color [r] [g] [b]  `\n" +
          "  1. Change la couleur de votre profil du bot.\n"+
          "\n__Les mini-jeux__\n" +
          "- `/demineur `\n" +
          "  1. Jouer au démineur.\n" +
          "- `/justeprix `\n" +
          "  1. Devinez un nombre entre 1 et 100 en un mininum de tentatibes..\n"+
          "- `/ppc [choix] `\n" +
          "  1. Défier le bot au Pierre Feuille Ciseaux en choissant l'un de ces 3 choix.\n"
        }
        
        
        // Ajoutez plus de commandes ici si nécessaire
      ];

      // Calculer le nombre total de pages nécessaires pour la pagination
      const totalPages = Math.ceil(test.length / itemsPerPage);

      let currentPage = 1; // Page actuelle, commence à 1

      const generateEmbedPage = async (startIndex) => {
        const pageItems = test.slice(startIndex, startIndex + itemsPerPage);

        const embed = new EmbedBuilder()
          .setTitle(pageItems[0].name)
          .setColor("#FFD700");

        const command = pageItems[0];

        embed.addFields({
          name: `${command.description}`,
          value: `${command.long_description}`,
          inline: true,
        });

        embed.setFooter({ text: `Commande ${currentPage} sur ${totalPages}` });

        return embed;
      };

      // Fonction pour générer les boutons de pagination
      const generateButtons = () => {
        const previousLabel =
          currentPage > 1 ? test[currentPage - 2].name : "Précédent";
        const nextLabel =
          currentPage < totalPages ? test[currentPage].name : "Suivant";

        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous_page")
            .setLabel(previousLabel)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel(nextLabel)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages)
        );
      };

      // Envoyer le message initial avec la première page et les boutons de pagination
      const initialMessage = await interaction.editReply({
        embeds: [await generateEmbedPage(0)],
        components: [generateButtons()],
      });

      // Créer un collecteur pour gérer les interactions avec les boutons
      const collector = interaction.channel.createMessageComponentCollector({
        filter: (buttonInteraction) =>
          buttonInteraction.isButton() &&
          buttonInteraction.user.id === interaction.user.id,
        time: 60000, // 60 secondes
      });

      // Écouter les événements 'collect' pour les interactions de boutons
      collector.on("collect", async (buttonInteraction) => {
        if (buttonInteraction.customId === "previous_page" && currentPage > 1) {
          currentPage--;
        } else if (
          buttonInteraction.customId === "next_page" &&
          currentPage < totalPages
        ) {
          currentPage++;
        }

        // Mettre à jour le message avec la nouvelle page et les boutons mis à jour
        await buttonInteraction.update({
          embeds: [await generateEmbedPage((currentPage - 1) * itemsPerPage)],
          components: [generateButtons()],
        });
      });

      // Écouter l'événement 'end' du collecteur
      collector.on("end", async () => {
        // Désactiver les boutons de pagination à la fin du collecteur
        const updatedButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous_page")
            .setLabel("Précédent")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("Suivant")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await initialMessage.edit({ components: [updatedButtons] });
      });
    } catch (error) {
      console.error("Une erreur est survenue :", error);
      await interaction.editReply(
        "Une erreur est survenue lors de l'exécution de la commande."
      );
    }
  },
};
