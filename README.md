# BabyFoot Manager

BabyFoot Manager est une application web permettant de gérer et suivre les parties de baby-foot en temps réel. Il permet aux utilisateurs de créer, gérer et terminer des parties, tout en affichant un compteur dynamique du nombre de parties en cours.

## Fonctionnalités

- Créer une nouvelle partie de baby-foot.
- Suivre le temps écoulé pour chaque partie en temps réel.
- Afficher un compteur du nombre de parties non terminées.
- Terminer ou supprimer une partie.
- Mise à jour en temps réel via WebSocket pour les parties créées, terminées ou supprimées.

## Prérequis

Avant de commencer, assurez-vous que vous avez installé les éléments suivants sur votre machine :

- **Node.js** (version 12.x ou plus récente) : [Télécharger Node.js](https://nodejs.org/)
- **PostgreSQL** : [Télécharger PostgreSQL](https://www.postgresql.org/download/)

## Installation

### 1. Clonez le dépôt du projet

git clone https://github.com/aya-othmen7/Baby-Foot-Manager/tree/master.git
cd babyfoot-manager

### 2.Installer les dépendances

Naviguez dans le dossier du projet et installez les dépendances nécessaires avec npm :

npm install

Cela installera tous les packages nécessaires listés dans le fichier package.json.


### 3. Configurer la base de données PostgreSQL
Assurez-vous d'avoir PostgreSQL installé sur votre machine. Ensuite, créez une base de données pour le projet :

psql -U postgres
CREATE DATABASE babyfoot;
Vérifiez que les informations de connexion (nom d'utilisateur, mot de passe, base de données) sont correctes dans le fichier index.js du projet. 
### 4. Démarrer l'application

npm start
Le serveur sera lancé sur http://localhost:3000. Ouvrez cette URL dans votre navigateur pour accéder à l'interface de gestion des parties de BabyFoot.
