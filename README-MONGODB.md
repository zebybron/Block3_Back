# 🚀 Démarrage MongoDB - Collector.shop

## 1️⃣ Prérequis

Vous devez installer **MongoDB**. Choisissez l'option qui vous convient:

### Option A: MongoDB Community (Recommandé)
```powershell
# Windows - Télécharger et installer
# https://www.mongodb.com/try/download/community

# Vérifier après installation
mongod --version
```

### Option B: Docker (Si vous avez Docker)
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option C: MongoDB Atlas (Cloud - Gratuit)
1. Créer compte: https://www.mongodb.com/cloud/atlas
2. Créer un cluster gratuit
3. Copier la chaîne de connexion
4. Modifier `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collector-shop
```

---

## 2️⃣ Démarrer le serveur avec MongoDB

### Étape 1: Assurez-vous que MongoDB est en cours d'exécution

```powershell
# Si MongoDB Community est installé (service Windows)
# Il démarre automatiquement

# Ou démarrez-le manuellement:
mongod

# Vérifier la connexion (dans un autre terminal)
mongo
> show dbs
```

### Étape 2: Démarrer le serveur Collector.shop

```powershell
cd C:\Users\teddy\Documents\Cube3\Backend

# Installer les dépendances (si pas fait)
npm install

# Démarrer le serveur
npm start

# Ou en mode développement
npm run dev
```

Vous devriez voir:
```
✅ MongoDB connecté: localhost
🚀 Serveur démarré sur le port 3000
```

---

## 3️⃣ Initialiser la base de données avec des données de test

```powershell
cd C:\Users\teddy\Documents\Cube3\Backend

# Créer 3 utilisateurs et 4 produits de test
npm run seed

# Ou manuellement
node scripts/migrateData.js
```

Résultat:
```
✅ Connecté à MongoDB
📝 Création des utilisateurs...
  ✅ seller1 créé
  ✅ buyer1 créé
  ✅ admin créé
📝 Création des produits...
  ✅ Poster Spider-Man 1962 créé
  ✅ Figure Batman NECA créé
  ✅ Série complète Comics X-Men créé
  ✅ Statue Superman Sideshow créé
✅ Migration réussie!
```

---

## 4️⃣ Tester les endpoints

### Inscription
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "myuser",
  "email": "myuser@example.com",
  "password": "password123"
}
```

Réponse:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "myuser",
      "email": "myuser@example.com",
      "role": "user"
    },
    "token": "eyJhbGc..."
  },
  "message": "Compte créé avec succès !"
}
```

### Lister les produits
```bash
GET http://localhost:3000/api/products

# Avec filtres
GET http://localhost:3000/api/products?category=Posters&maxPrice=200
```

### Créer un produit
```bash
POST http://localhost:3000/api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mon poster rare",
  "description": "Description détaillée",
  "category": "Posters",
  "condition": "Neuf",
  "price": 50,
  "shippingCost": 5,
  "images": ["https://example.com/poster.jpg"]
}
```

---

## 5️⃣ Arrêter le serveur

```powershell
# Dans le terminal du serveur
Ctrl + C

# Arrêter MongoDB (si démarré manuellement)
Ctrl + C
```

---

## 📊 Base de données MongoDB

### Collections créées

| Collection | Champs | Indexes |
|-----------|--------|---------|
| `users` | username, email, password, role, favorites, cart | username, email |
| `products` | title, description, category, price, seller, status | category+status, seller, price |
| `messages` | conversationId, sender, recipient, message | conversationId, sender, recipient |
| `categories` | name, slug, description | name, slug |

### Commandes utiles

```powershell
# Se connecter
mongo

# Voir les bases
show dbs

# Utiliser la base collector-shop
use collector-shop

# Voir les collections
show collections

# Voir les utilisateurs
db.users.find()

# Voir les produits
db.products.find()

# Compter les documents
db.products.count()

# Supprimer tout (attention!)
db.users.deleteMany({})
db.products.deleteMany({})
```

---

## 🔧 Variables d'environnement (.env)

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/collector-shop

# Serveur
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=collector_shop_super_secret_key_2024
JWT_EXPIRES_IN=24h

# Sécurité
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:8080
```

---

## ❌ Dépannage

### "Impossible de se connecter à MongoDB"
```
✅ Solution: Assurez-vous que MongoDB est démarré
mongod  # Ou vérifiez qu'il est en service Windows
```

### "MongoServerSelectionError"
```
✅ Solution: Vérifier la chaîne MONGODB_URI dans .env
✅ Solution: Vérifier que MongoDB écoute sur localhost:27017
```

### "Impossible d'insérer les documents"
```
✅ Solution: Vérifier les permis

ssions MongoDB
✅ Solution: Vérifier les schémas Mongoose
```

---

## 📚 Fichiers créés/modifiés

✅ `models/User.js` - Schéma utilisateur  
✅ `models/Product.js` - Schéma produit  
✅ `models/Message.js` - Schéma message  
✅ `models/Category.js` - Schéma catégorie  
✅ `config/database.js` - Configuration MongoDB  
✅ `services/mongoService.js` - Service Mongoose  
✅ `routes/auth-mongo.js` - Authentification  
✅ `routes/products-mongo.js` - Produits  
✅ `routes/messages-mongo.js` - Messages  
✅ `routes/favorites-mongo.js` - Favoris  
✅ `routes/admin-mongo.js` - Admin  
✅ `middleware/auth-mongo.js` - Authentification JWT  
✅ `scripts/migrateData.js` - Script de seed  
✅ `server.js` - Serveur mis à jour  
✅ `.env` - Variables MongoDB  

---

## ✨ Prochaines étapes

- [ ] Tester tous les endpoints
- [ ] Migrer les données existantes depuis l'ancien système
- [ ] Ajouter les validations côté frontend
- [ ] Ajouter les notifications de changement de prix
- [ ] Implémenter la détection des fraudes
- [ ] Ajouter l'upload de vraies images
- [ ] Intégrer Stripe/PayPal pour les paiements

---

**C'est prêt! 🎉 Démarrez MongoDB et lancez le serveur!**
