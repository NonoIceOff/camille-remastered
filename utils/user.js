const axios = require("axios");
const BASE_API_URL = "https://zeldaapi.vercel.app/api";

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

const changeUserInfos = async (
  id,
  coins,
  bio,
  color,
  voicetime,
  amethyst,
  messages
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
    console.error(
      "Erreur de la récupoération de l utilisateur",
      error
    );
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
