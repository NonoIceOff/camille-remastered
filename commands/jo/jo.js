const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const puppeteer = require("puppeteer-core");

// Mapping des codes pays avec leurs émojis de drapeau
const countryFlags = {
  "Norvège": "🇳🇴", "Allemagne": "🇩🇪", "Canada": "🇨🇦",
  "États-Unis d'Amérique": "🇺🇸", "États-Unis": "🇺🇸", "Etats-Unis": "🇺🇸",
  "Suède": "🇸🇪", "Autriche": "🇦🇹", "France": "🇫🇷",
  "Pays-Bas": "🇳🇱", "Suisse": "🇨🇭", "Japon": "🇯🇵",
  "Italie": "🇮🇹", "Russie": "🇷🇺", "ROC": "🇷🇺",
  "République populaire de Chine": "🇨🇳", "Chine": "🇨🇳",
  "Corée du Sud": "🇰🇷", "République de Corée": "🇰🇷",
  "Grande-Bretagne": "🇬🇧", "Finlande": "🇫🇮",
  "Espagne": "🇪🇸", "Australie": "🇦🇺", "Belgique": "🇧🇪",
  "République tchèque": "🇨🇿", "Tchéquie": "🇨🇿",
  "Pologne": "🇵🇱", "Slovénie": "🇸🇮",
  "Nouvelle-Zélande": "🇳🇿", "Danemark": "🇩🇰"
};

/**
 * Find Chrome executable path
 */
function findChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  const fs = require('fs');
  for (const path of paths) {
    try {
      if (fs.existsSync(path)) {
        console.log(`   Chrome trouvé: ${path}`);
        return path;
      }
    } catch (e) {
      // Continue
    }
  }

  console.log('   ⚠️  Chrome non trouvé aux emplacements standards');
  return paths[0]; // Fallback au chemin par défaut
}

/**
 * Scrape medal data from L'Équipe using Puppeteer
 */
async function scrapeMedalData() {
  let browser;
  try {
    const url = "https://www.lequipe.fr/jeux-olympiques-hiver/page-tableau-des-medailles/par-pays";

    console.log(`🔍 Lancement du scraping: ${url}`);

    const chromePath = findChromePath();

    // Lancer Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('📄 Chargement de la page...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('⏳ Attente du tableau des médailles...');
    await page.waitForSelector('table.Table--medal', { timeout: 20000 });

    // Attendre que les données soient chargées
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Extraction des données...');

    const medals = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.Table--medal tbody tr.Table__line');
      const data = [];

      rows.forEach((row) => {
        try {
          // Extraire le nom du pays
          const nameCell = row.querySelector('td.Table__cel--name span.min--phone-xl');
          const countryName = nameCell ? nameCell.textContent.trim() : '';

          // Extraire les médailles depuis les cellules
          const cells = row.querySelectorAll('td.Table__cel');

          if (cells.length >= 7 && countryName) {
            // Structure L'Équipe: [0]=Rang, [1]=Drapeau, [2]=Nom, [3]=Or, [4]=Argent, [5]=Bronze, [6]=Total
            const goldText = cells[3]?.querySelector('span')?.textContent.trim() || '0';
            const silverText = cells[4]?.querySelector('span')?.textContent.trim() || '0';
            const bronzeText = cells[5]?.querySelector('span')?.textContent.trim() || '0';

            const gold = parseInt(goldText);
            const silver = parseInt(silverText);
            const bronze = parseInt(bronzeText);

            data.push({
              countryName: countryName,
              gold: gold,
              silver: silver,
              bronze: bronze,
              total: gold + silver + bronze
            });
          }
        } catch (e) {
          // Ignorer les erreurs
        }
      });

      return data;
    });

    await browser.close();

    console.log(`✅ Scraping réussi: ${medals.length} pays extraits`);

    if (medals.length > 0) {
      console.log(`   Exemples: ${medals[0].countryName} (🥇${medals[0].gold} 🥈${medals[0].silver} 🥉${medals[0].bronze})`);
    }

    // Ajouter les drapeaux emoji
    const medalsWithFlags = medals.map(m => ({
      country: `${getCountryFlag(m.countryName)} ${m.countryName}`,
      gold: m.gold,
      silver: m.silver,
      bronze: m.bronze,
      total: m.total
    }));

    return medalsWithFlags;

  } catch (error) {
    console.error("❌ Erreur lors du scraping:", error.message);
    console.error("Stack trace:", error.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Erreur lors de la fermeture du navigateur:", closeError.message);
      }
    }
    throw error;
  }
}

/**
 * Get country flag emoji
 */
function getCountryFlag(countryName) {
  return countryFlags[countryName] || "🏳️";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jo")
    .setDescription("Affiche le classement des médailles des Jeux Olympiques 2026")
    .addStringOption(option =>
      option.setName("pays")
        .setDescription("Rechercher un pays spécifique")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Scraper les données réelles des JO 2026
      console.log("🔍 Démarrage du scraping des médailles...");
      const medalsData = await scrapeMedalData();

      if (!medalsData || medalsData.length === 0) {
        return interaction.editReply({
          content: "❌ Impossible de récupérer les données des médailles. Le site Olympics.com est peut-être indisponible.",
          ephemeral: true
        });
      }

      console.log(`✅ Données récupérées: ${medalsData.length} pays`);

      // Option: recherche d'un pays spécifique
      const paysRecherche = interaction.options.getString("pays");

      if (paysRecherche) {
        const pays = medalsData.find(
          m => m.country.toLowerCase().includes(paysRecherche.toLowerCase())
        );

        if (!pays) {
          return interaction.editReply({
            content: `❌ Pays "${paysRecherche}" non trouvé dans le classement.`,
            ephemeral: true
          });
        }

        const position = medalsData.indexOf(pays) + 1;
        const embed = new EmbedBuilder()
          .setTitle(`🏅 Médailles des JO 2026 - ${pays.country}`)
          .setColor("#FFD700")
          .setDescription(`**Position: #${position}**`)
          .addFields(
            { name: "🥇 Or", value: `${pays.gold}`, inline: true },
            { name: "🥈 Argent", value: `${pays.silver}`, inline: true },
            { name: "🥉 Bronze", value: `${pays.bronze}`, inline: true },
            { name: "📊 Total", value: `**${pays.total}** médailles`, inline: false }
          )
          .setFooter({ text: "Jeux Olympiques d'hiver 2026 - Milano Cortina" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      // Affichage du classement complet (TOUS les pays)
      let classement = "";

      // Discord a une limite de 4096 caractères pour la description d'un embed
      // On va créer plusieurs embeds si nécessaire
      const embeds = [];
      let currentClassement = "";

      medalsData.forEach((country, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `**${index + 1}.**`;
        const line = `${medal} ${country.country}\n   🥇 ${country.gold}  🥈 ${country.silver}  🥉 ${country.bronze}  📊 **${country.total}**\n\n`;

        // Si ajouter cette ligne dépasse 4000 caractères, créer un nouvel embed
        if ((currentClassement + line).length > 4000) {
          const embed = new EmbedBuilder()
            .setTitle(embeds.length === 0 ? "🏅 Tableau des Médailles - JO 2026" : "🏅 Tableau des Médailles - JO 2026 (suite)")
            .setColor("#FFD700")
            .setDescription(currentClassement);

          if (embeds.length === 0) {
            embed.setThumbnail("https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/2026_Winter_Olympics_logo.svg/1200px-2026_Winter_Olympics_logo.svg.png");
          }

          embeds.push(embed);
          currentClassement = line;
        } else {
          currentClassement += line;
        }
      });

      // Ajouter le dernier embed
      if (currentClassement.length > 0) {
        const embed = new EmbedBuilder()
          .setTitle(embeds.length === 0 ? "🏅 Tableau des Médailles - JO 2026" : "🏅 Tableau des Médailles - JO 2026 (suite)")
          .setColor("#FFD700")
          .setDescription(currentClassement)
          .setFooter({ text: `Jeux Olympiques d'hiver 2026 - Milano Cortina 🇮🇹 | ${medalsData.length} pays` })
          .setTimestamp();

        if (embeds.length === 0) {
          embed.setThumbnail("https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/2026_Winter_Olympics_logo.svg/1200px-2026_Winter_Olympics_logo.svg.png");
          embed.addFields({
            name: "💡 Astuce",
            value: "Utilisez `/jo pays:<nom_du_pays>` pour voir les détails d'un pays spécifique",
            inline: false
          });
        }

        embeds.push(embed);
      }

      await interaction.editReply({ embeds: embeds });

    } catch (error) {
      console.error("Erreur lors de la récupération des données des JO:", error);
      await interaction.editReply({
        content: "❌ Une erreur est survenue lors du scraping des données. Le site Olympics.com est peut-être indisponible ou a changé de structure.",
        ephemeral: true
      });
    }
  },
};

