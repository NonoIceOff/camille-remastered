const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class UnoGame {
  constructor() {
    this.player = null;
    this.bot = { id: 'bot', username: 'Bot', hand: [] };
    this.turnIndex = 0;
    this.deck = this.createDeck();
    this.discardPile = [];
    this.currentColor = null;
  }

  createDeck() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];
    const deck = [];

    for (const color of colors) {
      for (const value of values) {
        deck.push({ color, value });
        if (value !== '0') deck.push({ color, value });
      }
    }

    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', value: 'wild' });
      deck.push({ color: 'wild', value: '+4' });
    }

    return this.shuffle(deck);
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  drawCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        this.deck = this.shuffle(this.discardPile);
        this.discardPile = [];
      }
      cards.push(this.deck.pop());
    }
    return cards;
  }

  addPlayer(player) {
    this.player = {
      id: player.id,
      username: player.username,
      hand: this.drawCards(7)
    };
    this.bot.hand = this.drawCards(7);
  }

  getCurrentPlayer() {
    return this.turnIndex % 2 === 0 ? this.player : this.bot;
  }

  playCard(player, cardIndex) {
    const card = player.hand[cardIndex];
    const topCard = this.discardPile.slice(-1)[0];

    if (this.currentColor === card.color || card.color === 'wild' || card.value === topCard.value) {
      this.discardPile.push(card);
      player.hand.splice(cardIndex, 1);

      if (card.color !== 'wild') {
        this.currentColor = card.color;
      } else {
        this.currentColor = player === this.player ? this.playerChooseColor() : this.botChooseColor();
      }

      if (card.value === '+2') {
        this.getCurrentPlayer().hand.push(...this.drawCards(2));
      } else if (card.value === '+4') {
        this.getCurrentPlayer().hand.push(...this.drawCards(4));
      } else if (card.value === 'skip') {
        this.nextTurn();
      } else if (card.value === 'reverse') {
        this.turnIndex--;
      }

      return card;
    }

    return null;
  }

  playerChooseColor() {
    // Implémentez une méthode pour permettre au joueur de choisir une couleur (c'est un bouchon pour l'instant)
    return 'red';
  }

  botChooseColor() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  botPlay() {
    const bot = this.bot;
    for (let i = 0; i < bot.hand.length; i++) {
      const playedCard = this.playCard(bot, i);
      if (playedCard) {
        return playedCard;
      }
    }
    bot.hand.push(...this.drawCards(1));
    return null;
  }

  nextTurn() {
    this.turnIndex++;
  }
}

const games = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uno')
    .setDescription('Jouez au Uno contre le bot!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Démarrer une nouvelle partie de Uno')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    if (subcommand === 'start') {
      if (games.has(userId)) {
        return interaction.reply({ content: 'Vous avez déjà une partie en cours!', ephemeral: true });
      }

      const game = new UnoGame();
      game.addPlayer({ id: userId, username });
      game.discardPile.push(game.deck.pop());
      game.currentColor = game.discardPile[0].color;
      games.set(userId, game);

      const embed = new EmbedBuilder()
        .setTitle(`Partie de Uno commencée!`)
        .setDescription(`C'est à votre tour, ${username}. Voici votre main:\n${game.player.hand.map((card, index) => `${index}: ${card.color} ${card.value}`).join('\n')}\n\nCarte actuelle: ${game.currentColor} ${game.discardPile[0].value}`);

      const actionRow = new ActionRowBuilder();
      game.player.hand.forEach((card, index) => {
        actionRow.addComponent(
          new ButtonBuilder()
            .setCustomId(`play-${index}`)
            .setLabel(`${card.color} ${card.value}`)
            .setStyle(ButtonStyle.Primary)
        );
      });
      actionRow.addComponent(
        new ButtonBuilder()
          .setCustomId('draw')
          .setLabel('Piocher une carte')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [actionRow] });
    }

    const game = games.get(userId);
    if (!game) {
      return interaction.reply({ content: 'Aucune partie en cours. Utilisez /uno start pour démarrer une partie.', ephemeral: true });
    }
  },

  async handleButton(interaction) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const game = games.get(userId);

    if (!game) {
      return interaction.reply({ content: 'Aucune partie en cours. Utilisez /uno start pour démarrer une partie.', ephemeral: true });
    }

    if (customId.startsWith('play-')) {
      const cardIndex = parseInt(customId.split('-')[1]);
      const player = game.getCurrentPlayer();

      if (player.id !== userId) {
        return interaction.reply({ content: 'Ce n\'est pas votre tour!', ephemeral: true });
      }

      const playedCard = game.playCard(player, cardIndex);
      if (playedCard) {
        game.nextTurn();

        const botPlayedCard = game.botPlay();
        game.nextTurn();

        const embed = new EmbedBuilder()
          .setTitle(`Tour de ${interaction.user.username}`)
          .setDescription(`Vous avez joué ${playedCard.color} ${playedCard.value}.\n\nLe bot a joué ${botPlayedCard ? `${botPlayedCard.color} ${botPlayedCard.value}` : 'aucune carte'}.\n\nMain du bot: ${game.bot.hand.length} cartes\n\nCarte actuelle: ${game.currentColor} ${game.discardPile.slice(-1)[0].value}\n\nVotre main:\n${player.hand.map((card, index) => `${index}: ${card.color} ${card.value}`).join('\n')}`);

        const actionRow = new ActionRowBuilder();
        player.hand.forEach((card, index) => {
          actionRow.addComponent(
            new ButtonBuilder()
              .setCustomId(`play-${index}`)
              .setLabel(`${card.color} ${card.value}`)
              .setStyle(ButtonStyle.Primary)
          );
        });
        actionRow.addComponent(
          new ButtonBuilder()
            .setCustomId('draw')
            .setLabel('Piocher une carte')
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({ embeds: [embed], components: [actionRow] });
      } else {
        return interaction.reply({ content: 'Vous ne pouvez pas jouer cette carte.', ephemeral: true });
      }
    }

    if (customId === 'draw') {
      const player = game.getCurrentPlayer();

      if (player.id !== userId) {
        return interaction.reply({ content: 'Ce n\'est pas votre tour!', ephemeral: true });
      }

      player.hand.push(...game.drawCards(1));
      game.nextTurn();

      const botPlayedCard = game.botPlay();
      game.nextTurn();

      const embed = new EmbedBuilder()
        .setTitle(`Tour de ${interaction.user.username}`)
        .setDescription(`Vous avez pioché une carte.\n\nLe bot a joué ${botPlayedCard ? `${botPlayedCard.color} ${botPlayedCard.value}` : 'aucune carte'}.\n\nMain du bot: ${game.bot.hand.length} cartes\n\nCarte actuelle: ${game.currentColor} ${game.discardPile.slice(-1)[0].value}\n\nVotre main:\n${player.hand.map((card, index) => `${index}: ${card.color} ${card.value}`).join('\n')}`);

      const actionRow = new ActionRowBuilder();
      player.hand.forEach((card, index) => {
        actionRow.addComponent(
          new ButtonBuilder()
            .setCustomId(`play-${index}`)
            .setLabel(`${card.color} ${card.value}`)
            .setStyle(ButtonStyle.Primary)
        );
      });
      actionRow.addComponent(
        new ButtonBuilder()
          .setCustomId('draw')
          .setLabel('Piocher une carte')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [actionRow] });
    }
  }
};
