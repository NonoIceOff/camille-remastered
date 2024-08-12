const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getUserInfos, modifyUser, changeUserInfos} = require("../../utils/user.js")

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function getUserDailyData(userId) {
  const today = getTodayDate();
  const directoryPath = "daily_claim_usage";
  const filePath = path.resolve(`${directoryPath}/${today}.json`);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  let dailyData = {};

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      dailyData = JSON.parse(fileContent);
    } catch (error) {
      console.error(
        "Erreur lors de la lecture des données quotidiennes:",
        error
      );
    }
  }

  if (!dailyData[userId]) {
    dailyData[userId] = { attempts: 0 };
  }

  return { dailyData, filePath };
}

function saveUserDailyData(filePath, dailyData) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(dailyData, null, 4), "utf-8");
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des données quotidiennes:",
      error
    );
  }
}

const dailyCommand = new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Réclamez votre récompense quotidienne");

const number = 500

module.exports = {
  data: dailyCommand,
  async execute(interaction) {
    await interaction.deferReply();
    const { dailyData, filePath } = getUserDailyData(interaction.user.id);
    if (dailyData[interaction.user.id].attempts <= 0) {
      dailyData[interaction.user.id].attempts += 1;
      saveUserDailyData(filePath, dailyData);

      let userStats = await getUserInfos(interaction.user.id);
      console.log(userStats.coins)
      userStats.coins += number
      changeUserInfos(interaction.user.id,number,"","",0,0,0)

      interaction.editReply(`**Vous obtenez +${number} <:gold:1261787387395047424>.** *Revenez demain pour une nouvelle récompense...*`);
    } else {
      await interaction.editReply({
        content: "Vous avez déjà réclamé votre récompense quotidienne",
        ephemeral: true,
      });
    }
  },
};
