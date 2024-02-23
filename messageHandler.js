const fs = require('fs');
const fuzzyset = require('fuzzyset');
const { EmbedBuilder } = require('discord.js');

function handleMessage(message, client) {
    if (message.author.bot) return;

    if (message.channel.name === 'camille-salon' && message.mentions.has(client.user)) {
        const question = preprocessQuestion(message.content);

        const responses = getResponses();
        const response = findResponse(question, responses);

        if (response) {
            const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Réponse de ${client.user.username}`)
                .setDescription(response)
                .setFooter('Footer pour la réponse');

            message.channel.send({ embeds: [exampleEmbed] });
        } else {
            const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Réponse de ${client.user.username}`)
                .setDescription("Je ne connais pas encore de réponse à cette question. Comment devrais-je répondre ?")
                .setFooter('Footer pour les réponses manquantes');

            message.channel.send({ embeds: [exampleEmbed] });

            const filter = (userResponse) => userResponse.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, time: 60000 });

            collector.on('collect', (userResponse) => {
                const responseContent = userResponse.content.trim();
                if (responseContent) {
                    responses[question] = responseContent;
                    saveResponses(responses);
                    const confirmationEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Réponse enregistrée`)
                        .setDescription(`D'accord, j'ai enregistré votre réponse pour la question ${question}`)
                        .setFooter('Footer pour la confirmation');
                    message.channel.send({ embeds: [confirmationEmbed] });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Erreur')
                        .setDescription("Désolé, je ne peux pas enregistrer une réponse vide.")
                        .setFooter('Footer pour les erreurs');
                    message.channel.send({ embeds: [errorEmbed] });
                }
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Temps écoulé')
                        .setDescription("Désolé, le temps pour répondre est écoulé")
                        .setFooter('Footer pour les temps écoulés');
                    message.channel.send({ embeds: [timeoutEmbed] });
                }
            });
        }
    }
}

function preprocessQuestion(question) {
    question = question.replace(/<@!\d+>/g, '');
    question = question.replace(/<@\d+>/g, '');
    question = question.replace(/[\W\d_]+/g, '');
    question = question.replace(/\s+/g, '');

    return question;
}

function getResponses() {
    try {
        const data = fs.readFileSync('responses.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture de responses.json :', error);
        return {};
    }
}

function saveResponses(responses) {
    try {
        fs.writeFileSync('responses.json', JSON.stringify(responses, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de l\'écriture de responses.json :', error);
    }
}

function findResponse(question, responses) {
    const questionSet = fuzzyset(Object.keys(responses));
    const matches = questionSet.get(question);
    if (matches && matches[0] && matches[0][0] >= 0.7) {
        return responses[matches[0][1]];
    }
    return null;
}

module.exports = { handleMessage };
