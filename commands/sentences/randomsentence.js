const { SlashCommandBuilder } = require('discord.js');

const randomPhraseCommand = new SlashCommandBuilder()
    .setName('randomsentence')
    .setDescription('Envoie une phrase aléatoire.');

module.exports = {
    data: randomPhraseCommand,
    async execute(interaction) {
        const subjects = [
            "Le chat", "Le chien", "La voiture", "L'oiseau", "Le professeur",
            "L'étudiant", "Le programmeur", "Le robot", "Le musicien",
            "La bibliothécaire", "Le jardinier", "Le médecin", "L'artiste",
            "Le chef", "Le policier", "Le vendeur", "L'écrivain", "Le joueur de football",
            "L'astronaute", "Le super-héros", "Le magicien", "Le scientifique",
            "Le pirate", "Le fantôme", "Le monstre"
        ];
        
        const verbs = [
            "mange", "regarde", "trouve", "aime", "déteste",
            "construit", "détruit", "lit", "écrit", "joue",
            "danse", "chante", "rit", "pleure", "court",
            "saute", "grimpe", "navigue", "vole", "nage",
            "rêve", "pense", "écoute", "observe", "explique"
        ];
        
        const objects = [
            "une pomme", "un livre", "un film", "une chanson", "un jouet",
            "une maison", "un ordinateur", "un tableau", "une mélodie", "un animal",
            "une étoile", "un trésor", "un secret", "un message", "un rêve",
            "une invention", "une potion", "un sortilège", "une épée", "une baguette magique",
            "une montagne", "une forêt", "un océan", "une galaxie", "un univers parallèle"
        ];
        
        const adjectives = [
            "rouge", "bleu", "vert", "jaune", "rose",
            "violet", "orange", "noir", "blanc", "gris",
            "clair", "sombre", "brillant", "terne", "chaud",
            "froid", "rapide", "lent", "fort", "faible",
            "géant", "minuscule", "mystérieux", "magique", "étrange"
        ];
        
        const adverbs = [
            "rapidement", "lentement", "joyeusement", "tristement", "soigneusement",
            "bruyamment", "silencieusement", "clairement", "obscurément", "facilement",
            "difficilement", "gentiment", "méchamment", "honnêtement", "secrètement",
            "fièrement", "humblement", "bravement", "lâchement", "avec enthousiasme",
            "avec tristesse", "avec joie", "avec colère", "avec peur", "avec amour"
        ];
        
        const durations = [
            "pendant une heure", "pour quelques minutes", "toute la journée", "depuis longtemps", "dans un instant",
            "dans une semaine", "pour toujours", "pour un moment", "dans une heure", "dans une minute",
            "dans un instant", "chaque jour", "chaque nuit", "tous les matins", "tous les soirs",
            "tous les après-midis", "tous les jours", "tous les soirs", "toutes les nuits", "tous les weekends",
            "tous les mois", "tous les ans", "à tout moment", "à tout instant", "à chaque fois"
        ];
        
        const places = [
            "dans le parc", "à la maison", "au travail", "dans la rue", "à l'école",
            "au cinéma", "au restaurant", "à la bibliothèque", "au musée", "à la plage",
            "à la montagne", "dans la forêt", "dans l'espace", "sous l'eau", "dans une grotte",
            "dans un château", "dans une ville", "dans un village", "dans une contrée lointaine", "sur une île déserte",
            "dans un monde imaginaire", "dans un univers parallèle", "sur une autre planète", "dans un royaume magique", "dans un lieu mystérieux"
        ];

        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
        const randomObject = objects[Math.floor(Math.random() * objects.length)];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomAdverb = adverbs[Math.floor(Math.random() * adverbs.length)];
        const randomDuration = durations[Math.floor(Math.random() * durations.length)];
        const randomPlace = places[Math.floor(Math.random() * places.length)];

        const randomPhrase = `${randomSubject} ${randomVerb} ${randomObject} ${randomAdjective} ${randomAdverb} ${randomDuration} ${randomPlace}.`;

        await interaction.reply(randomPhrase);
    },
};
