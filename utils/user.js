const axios = require("axios");
const { TOKEN, guildId, clientId, test } = require("../config");

const modifyUser = async (
  id,
  coins,
  bio,
  color,
  voicetime,
  amethyst,
  messages
) => {
  try {
    const response = await axios.post(
      `https://zeldaapi.vercel.app/api/user/${id}`,
      {
        id: id,
        coins: coins,
        bio: bio,
        color: color,
        voicetime: voicetime,
        amethyst: amethyst,
        messages: messages,
      }
    );

    console.log("Réponse de l'API:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("Erreur de la réponse de l'API:", error.response.data);
    } else {
      console.error("Erreur lors de la requête API:", error.message);
    }
  }
};

const checkAchievementMessages = async (messages, id, client) => {
  if (messages == 1) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const commandC = guild.channels.cache.find(
        (channel) => channel.name === "test-bot"
      );

      if (commandC) {
        commandC.send({
          content: `:trophy:  **Bienvenue parmi nous** *Avoir envoyé votre premier message*`,
          files: ["assets/achievement.png"],
        });
      } else {
        console.error("Command channel not found.");
      }
    } else {
      console.error("Guild not found.");
    }
  }
};

const changeUserInfos = async (
  id,
  coins,
  bio,
  color,
  voicetime,
  amethyst,
  messages,
  client
) => {
  // RECUPERER LES DONNEES
  try {
    let userInfos = await getUserInfos(id);

    let newcoins = Math.floor(userInfos.coins + coins);
    let newbio = userInfos.bio;
    let newcolor = userInfos.color;
    let newvoicetime = userInfos.voicetime + voicetime;
    let newamethyst = Math.floor(userInfos.amethyst + amethyst);
    let newmessages = userInfos.messages + messages;
    checkAchievementMessages(newmessages, id, client);

    modifyUser(
      id,
      newcoins,
      newbio,
      newcolor,
      newvoicetime,
      newamethyst,
      newmessages
    );
  } catch (error) {
    console.error("Erreur de la récupoération de l utilisateur", error);
  }
};

const getUserInfos = async (id) => {
  // RECUPERER LES DONNEES
  try {
    response = await axios.get(`https://zeldaapi.vercel.app/api/user/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Erreur de la réponse de l'API:", error.response.data);
      return;
    } else {
      console.error("Erreur lors de la requête API:", error.message);
      return;
    }
  }
};

module.exports = {
  modifyUser,
  changeUserInfos,
  getUserInfos,
};
