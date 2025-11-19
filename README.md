# 🚀 Collector.shop - Backend API

API REST Node.js + Express + MongoDB pour la plateforme Collector.shop.

## 📋 Prérequis

- Node.js 18+ 
- MongoDB 7+
- npm ou yarn

## 🔧 Installation

```bash
# Cloner le repository
git clone <votre-repo-url>
cd Backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Puis éditer .env avec vos valeurs
```

## ⚙️ Configuration

Créez un fichier `.env` avec les variables suivantes:

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/collector_db

# JWT
JWT_SECRET=votre_secret_jwt_changez_moi_en_production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Démarrage

```bash
# Mode développement
npm start

# Avec nodemon (rechargement auto)
npm run dev

# Mode production
NODE_ENV=production npm start
```

## 🔑 Créer un administrateur

```bash
node create-admin.js
```

Connexion admin par défaut:
- Email: `admin@example.com`
- Mot de passe: `admin123`

## 📚 Documentation API

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Info utilisateur courant

### Produits

- `GET /api/products` - Liste des produits (avec filtres)
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (auth requise)
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### Messages

- `GET /api/messages/conversations` - Liste des conversations
- `GET /api/messages/conversation/:userId` - Messages avec un utilisateur
- `POST /api/messages` - Envoyer un message

### Favoris

- `GET /api/favorites` - Liste des favoris
- `POST /api/favorites/:productId` - Ajouter aux favoris
- `DELETE /api/favorites/:productId` - Retirer des favoris

### Admin (nécessite rôle admin)

- `GET /api/admin/products/pending` - Produits en attente
- `PUT /api/admin/products/:id/approve` - Approuver un produit
- `PUT /api/admin/products/:id/reject` - Rejeter un produit
- `DELETE /api/admin/products/:id` - Supprimer un produit
- `GET /api/admin/users` - Liste des utilisateurs
- `PUT /api/admin/users/:id/role` - Changer le rôle
- `GET /api/admin/categories` - Liste des catégories
- `POST /api/admin/categories` - Créer une catégorie
- `GET /api/admin/stats` - Statistiques
- `GET /api/admin/moderation/history` - Historique modération

## 🏗️ Structure

```
Backend/
├── config/
│   └── database.js       # Configuration MongoDB
├── middleware/
│   └── auth-mongo.js     # Authentification JWT
├── models/
│   ├── User.js           # Modèle utilisateur
│   ├── Product.js        # Modèle produit
│   ├── Message.js        # Modèle message
│   ├── Favorite.js       # Modèle favoris
│   └── Category.js       # Modèle catégorie
├── routes/
│   ├── auth-mongo.js     # Routes authentification
│   ├── products-mongo.js # Routes produits
│   ├── messages-mongo.js # Routes messages
│   ├── favorites-mongo.js# Routes favoris
│   └── admin-mongo.js    # Routes admin
├── services/
│   └── mongoService.js   # Logique métier MongoDB
├── utils/
│   └── helpers.js        # Fonctions utilitaires
├── uploads/              # Dossier images uploadées
├── .env                  # Variables d'environnement (non versionné)
├── .gitignore
├── package.json
└── server.js             # Point d'entrée
```

## 🔒 Sécurité

- Helmet.js pour sécuriser les headers HTTP
- Rate limiting pour prévenir les abus
- JWT pour l'authentification
- Bcrypt pour hasher les mots de passe
- CORS configuré
- Validation des données

## 🐳 Docker

```bash
# Build l'image
docker build -t collector-backend .

# Lancer le conteneur
docker run -p 3000:3000 --env-file .env collector-backend
```

Ou utilisez `docker-compose.yml` à la racine du projet.

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Test de modération
node test-moderation.js <admin-token>
```

## 📊 Monitoring

- Health check: `GET /api/health`
- WebSocket pour le chat temps réel

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amélioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amélioration`)
5. Ouvrez une Pull Request

## 📝 Licence

MIT

## 👤 Auteur

Teddy Corbillon
