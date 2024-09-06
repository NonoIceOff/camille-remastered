const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("zevent")
    .setDescription("Affiche les informations du ZEVENT 2024"),

  async execute(interaction) {
    await interaction.deferReply();
    const zeventapi = await axios.get("https://zevent.fr/api/");

    const streamers = zeventapi.data.live;

    // Tri des streamers par montant de dons (décroissant)
    const topDonations = [...streamers]
      .sort((a, b) => b.donationGoal.donationAmount.number - a.donationGoal.donationAmount.number)
      .slice(0, 3);

    // Tri des streamers par nombre de viewers (décroissant)
    const topViewers = [...streamers]
      .sort((a, b) => b.viewersAmount.number - a.viewersAmount.number)
      .slice(0, 3);

    const embed = new EmbedBuilder()
      .setTitle("Données du ZEVENT 2024")
      .setColor("#36FF00")
      .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf63PcO9BtgFThFZOpXjPNbnQgB_lHUlZdgA&s");

    // Ajout de la cagnotte globale
    embed.addFields({
      name: "Cagnotte globale",
      value: `${zeventapi.data.donationAmount.formatted}`,
      inline: true,
    });

    // Ajout du nombre total de viewers
    embed.addFields({
      name: "Viewers au total",
      value: `${zeventapi.data.viewersCount.formatted}`,
      inline: true,
    });

    // Ajout des 3 meilleurs streamers en termes de dons
    embed.addFields({
      name: "Top 3 Donations",
      value: topDonations.map(s => `${s.display} - ${s.donationGoal.donationAmount.formatted}`).join("\n"),
      inline: false,
    });

    // Ajout des 3 meilleurs streamers en termes de viewers
    embed.addFields({
      name: "Top 3 Viewers",
      value: topViewers.map(s => `${s.display} - ${s.viewersAmount.formatted} viewers`).join("\n"),
      inline: false,
    });

    embed.setFooter({ text: "Donnez au ZEVENT ici : https://zevent.fr/don" });

    await interaction.editReply({ embeds: [embed] });
  },
};
