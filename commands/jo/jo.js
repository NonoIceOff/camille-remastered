const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jo')
    .setDescription('médailles'),

  async execute(interaction) {
    await interaction.deferReply();

    const response = await axios.get("https://apis.codante.io/olympic-games/countries")
    let countrys = response.data.data

    const embed = new EmbedBuilder()
    .setTitle(`Tableau des médailles des JO DE PARIS 2024`)
    .setColor('#FFD700')
    .setThumbnail("https://www.macapflag.com/blog/wp-content/uploads/2022/05/logo-officiel-jeux-paralympiques-Paris-2024.jpg");

    for (let index = 0; index < 18; index++) {
        await interaction.editReply({
            content: `Récupération des données des équipes ... (${index}/18)`,
        });
        let cflag = countrys[index].id.toLowerCase()
        let flag = countrys[index].id.slice(0, 2).toLowerCase()
        if (cflag == "chn") {
            flag = 'cn'
        }
        if (cflag == "ned") {
            flag = 'nl'
        }
        if (cflag == "kor") {
            flag = 'kr'
        }
        if (cflag == "kaz") {
            flag = 'kz'
        }
        if (cflag == "ger") {
            flag = 'de'
        }
        if (cflag == "rsa") {
            flag = 'za'
        }
        if (cflag == "irl") {
            flag = 'ie'
        }
        if (cflag == "slo") {
            flag = 'si'
        }
        if (cflag == "gua") {
            flag = 'gt'
        }
        if (cflag == "cro") {
            flag = 'hr'
        }
        if (cflag == "swe") {
            flag = 'se'
        }
        embed.addFields({
            name: `${index+1}. ${countrys[index].id} :flag_${flag}:`,
            value: `:first_place:${countrys[index].gold_medals}  :second_place:${countrys[index].silver_medals}  :third_place:${countrys[index].bronze_medals} **(:medal:${countrys[index].total_medals})**`,
            inline: true,
          });
        
    }
    await interaction.editReply({
        content: " ",
      embeds: [embed]
    });

  },
};
