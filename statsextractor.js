const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// URL de connexion à la base de données
const dbUrl = "postgresql://zelda_owner:bN34TCSylqaK@ep-patient-voice-a2mnswxd.eu-central-1.aws.neon.tech/zelda?sslmode=require";

// Paths
const inventoryFolderPath = './inventory';

// Fonction pour échapper les guillemets simples dans les valeurs SQL
function escapeSqlValue(value) {
    return value.replace(/'/g, "''");
}

// Fonction pour obtenir l'ID de l'item de la base de données ou l'insérer s'il n'existe pas
async function getOrInsertItem(client, emoji, name, rarity, price) {
    const query = `
        SELECT id FROM items
        WHERE emoji = $1 AND name = $2 AND rarity = $3 AND price = $4
    `;
    const result = await client.query(query, [emoji, name, rarity, price]);
    if (result.rows.length > 0) {
        return result.rows[0].id;
    }
}

// Fonction principale pour traiter les fichiers JSON et insérer les données dans la base de données
async function processInventory() {
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        const files = fs.readdirSync(inventoryFolderPath);

        for (const filename of files) {
            if (filename.endsWith('.json')) {
                const filePath = path.join(inventoryFolderPath, filename);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let userId = filename.replace('user_', '').replace('.json', '');
                console.log(userId)

                for (const item of data.items) {
                    const emoji = escapeSqlValue(item.emoji);
                    const name = escapeSqlValue(item.name);
                    const rarity = escapeSqlValue(item.rarity);
                    const price = item.price;
                    const quantity = item.quantity;

                    const itemId = await getOrInsertItem(client, emoji, name, rarity, price);
                    // Insérer dans l'inventaire
                    const inventoryInsertQuery = `
                        INSERT INTO inventorys (user_id, item_id, quantity)
                        VALUES ($1, $2, $3)
                    `;
                    
                    await client.query(inventoryInsertQuery, [userId, itemId, quantity]);
                }
            }
        }

        console.log("Data inserted successfully");
    } catch (err) {
        console.error("Error processing inventory:", err);
    } finally {
        await client.end();
    }
}

processInventory();
