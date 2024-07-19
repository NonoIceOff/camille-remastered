import os
import json

# Chemin vers le répertoire contenant les fichiers JSON extraits
stats_folder_path = './stats'

# Liste pour stocker les valeurs à insérer
values_list = []

# Parcourir chaque fichier JSON dans le répertoire
for filename in os.listdir(stats_folder_path):
    if filename.endswith('.json'):
        file_path = os.path.join(stats_folder_path, filename)
        with open(file_path, 'r') as file:
            data = json.load(file)
            user_id = filename.replace('.json', '')
            user_id = user_id.replace('user_', '')
            coins = data.get('coins', 0)
            amethyst = data.get('amethyst', 0)
            messages = data.get('messages', 0)
            voicetime = data.get('voiceTime', 0)
            color = data.get('color', '')
            bio = data.get('bio', '')
            values_list.append(f"('{user_id}', {coins}, {amethyst}, {messages}, {voicetime}, '{color}', '{bio}')")

# Générer les instructions SQL d'insertion
insert_query = "INSERT INTO users (id, coins, amethyst, messages, voicetime, color, bio) VALUES \n"
insert_query += ",\n".join(values_list) + ";"

# Sauvegarder la requête d'insertion dans un fichier
insert_query_file_path = './insert_users.sql'
with open(insert_query_file_path, 'w') as file:
    file.write(insert_query)

print(f"SQL insert query saved to {insert_query_file_path}")
