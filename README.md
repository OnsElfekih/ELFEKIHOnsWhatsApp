# 💬 ELFEKIHOnsWhatsApp

Application mobile de messagerie instantanée développée avec React Native et Firebase.

Le projet reproduit les principales fonctionnalités des applications modernes comme WhatsApp et Messenger tout en appliquant les concepts du développement mobile temps réel.

---

# 📖 Description du projet

Cette application permet aux utilisateurs de :

- 👤 créer un compte
- 🔐 se connecter
- 🖼️ gérer leur profil
- 💬 discuter en temps réel
- 👥 créer des groupes
- 📷 envoyer des médias
- 📍 partager une localisation
- 🎤 envoyer des messages vocaux
- ❤️ réagir aux messages
- ↩️ répondre aux messages
- 📤 transférer des messages
- ✏️ modifier des messages
- 🗑️ supprimer des messages
- 🎨 changer le fond des conversations
- 👨‍👩‍👧 gérer les membres des groupes

Les données sont synchronisées en temps réel grâce à Firebase Realtime Database.

---

# ✨ Fonctionnalités principales

## 🔐 Authentification

- création de compte
- connexion
- affichage/masquage du mot de passe
- récupération du mot de passe par email
- sauvegarde de session avec AsyncStorage

---

## 👤 Gestion du profil

- modification du profil
- changement de photo
- historique des photos
- changement du fond de conversation
- affichage du statut de connexion

---

## 💬 Messagerie privée

- envoi de messages texte
- envoi d’images
- envoi de vidéos
- envoi de messages vocaux
- partage de localisation
- réactions aux messages
- réponses aux messages
- copie des messages
- transfert des messages
- modification des messages
- suppression pour moi
- suppression pour tous
- messages épinglés
- liens cliquables
- téléchargement des médias

---

## 👥 Groupes

- création de groupes
- ajout de membres
- suppression de membres
- quitter un groupe
- suppression automatique du groupe si l’administrateur quitte
- changement du nom du groupe
- changement du fond du groupe
- médias partagés
- gestion des liens
- gestion des messages épinglés
- réactions et réponses comme dans les discussions privées

---

## 🟢 Présence utilisateur

- affichage des utilisateurs connectés
- affichage du dernier passage en ligne

---

# 🛠️ Technologies utilisées

## 📱 Frontend

- React Native
- Expo
- JavaScript

---

## ☁️ Backend et services

- Firebase Authentication
- Firebase Realtime Database
- Supabase Storage

---

## 📚 Bibliothèques principales

- React Navigation
- Expo AV
- Expo Image Picker
- Expo Media Library
- Expo Location
- Expo Clipboard
- AsyncStorage

---

# 🏗️ Architecture du projet

```txt
Screens/
│
├── Auth.js
├── SignUp.js
├── Chat.js
├── Home.js
│
├── Home/
│   ├── Groupe.js
│   ├── ListAccount.js
│   └── MyAccount.js
│
Config.js
App.js
```

---

# ⚙️ Installation du projet

## 1️⃣ Cloner le dépôt

```bash
git clone https://github.com/OnsElfekih/ELFEKIHOnsWhatsApp.git
```

## 2️⃣ Accéder au dossier

```bash
cd ELFEKIHOnsWhatsApp
```

## 3️⃣ Installer les dépendances

```bash
npm install
```

## 4️⃣ Installer Expo

```bash
npm install -g expo-cli
```

## 5️⃣ Lancer le projet

```bash
npx expo start
```

---

# 🔥 Configuration Firebase

Créer un projet Firebase puis activer :

- Authentication
- Realtime Database

Ajouter la configuration Firebase dans :

```txt
Config.js
```

Exemple :

```js
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

---

# 📲 Permissions Android

Le projet utilise plusieurs permissions :

- 📷 caméra
- 🎤 microphone
- 🖼️ galerie
- 🎞️ vidéos
- 📍 localisation

Configuration dans :

```txt
app.json
```

---

# 📸 Captures d’écran

Ajouter ici les captures d’écran de :

- 🔐 connexion
- 💬 chat privé
- 👥 groupes
- 📷 partage média
- 👤 profil
- 🎤 vocal
- ❤️ réactions

---

# 👨‍💻 Auteur

**Ons ELFEKIH**
Étudiants en ingénierie informatique — Business Intelligence
---
