/**
 * Script de migration des données du système in-memory vers MongoDB
 * Utilisation: node scripts/migrateData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importer les modèles
const User = require('../models/User');
const Product = require('../models/Product');

// Importer la base de données in-memory
const db = require('../models/Database');

// Données de test pour initialiser MongoDB
const INITIAL_DATA = {
  users: [
    {
      username: 'seller1',
      email: 'seller1@collector.shop',
      password: 'password123',
      role: 'seller',
      isSeller: true,
      firstName: 'John',
      lastName: 'Doe',
      sellerInfo: {
        shopName: 'Collections Rares',
        description: 'Vente de collections rares et authentiques',
        rating: 4.8,
        totalSales: 45,
      },
    },
    {
      username: 'buyer1',
      email: 'buyer1@collector.shop',
      password: 'password123',
      role: 'user',
      isSeller: false,
      firstName: 'Jane',
      lastName: 'Smith',
    },
    {
      username: 'admin',
      email: 'admin@collector.shop',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Collector',
    },
  ],
  products: [
    {
      title: 'Poster Spider-Man 1962',
      description: 'Poster original de la première apparition de Spider-Man en comic book',
      category: 'Posters',
      condition: 'Très bon état',
      price: 125,
      shippingCost: 10,
      images: [
        { url: 'https://via.placeholder.com/300x400?text=Spider-Man+Poster', uploadedAt: new Date() },
      ],
      status: 'approved',
    },
    {
      title: 'Figure Batman NECA',
      description: 'Figure collectible Batman de haute qualité par NECA',
      category: 'Figures',
      condition: 'Neuf',
      price: 280,
      shippingCost: 15,
      images: [
        { url: 'https://via.placeholder.com/300x400?text=Batman+Figure', uploadedAt: new Date() },
      ],
      status: 'approved',
    },
    {
      title: 'Série complète Comics X-Men',
      description: 'Collection complète des 50 premiers numéros des X-Men',
      category: 'Comics',
      condition: 'Bon état',
      price: 350,
      shippingCost: 20,
      images: [
        { url: 'https://via.placeholder.com/300x400?text=X-Men+Comics', uploadedAt: new Date() },
      ],
      status: 'approved',
    },
    {
      title: 'Statue Superman Sideshow',
      description: 'Statue Superman édition limitée par Sideshow Collectibles',
      category: 'Statues',
      condition: 'Très bon état',
      price: 420,
      shippingCost: 30,
      images: [
        { url: 'https://via.placeholder.com/300x400?text=Superman+Statue', uploadedAt: new Date() },
      ],
      status: 'approved',
    },
  ],
};

async function migrateData() {
  try {
    // Connexion MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collector-shop';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Vérifier s'il y a déjà des données
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();

    if (userCount > 0 || productCount > 0) {
      console.log(`
⚠️  Il y a déjà des données dans la base:
  - ${userCount} utilisateurs
  - ${productCount} produits

Voulez-vous continuer? Cela créera des doublons.
      `);
      // Pour continuer automatiquement en production
    }

    console.log('\n📝 Création des utilisateurs...');
    const users = [];
    for (const userData of INITIAL_DATA.users) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`  ✅ ${user.username} créé`);
    }

    const seller = users[0]; // seller1

    console.log('\n📝 Création des produits...');
    for (const productData of INITIAL_DATA.products) {
      const product = new Product({
        ...productData,
        seller: seller._id,
        sellerName: seller.username,
        validatedAt: new Date(),
      });
      await product.save();
      console.log(`  ✅ ${product.title} créé`);
    }

    console.log('\n✅ Migration réussie!');
    console.log(`   - ${users.length} utilisateurs créés`);
    console.log(`   - ${INITIAL_DATA.products.length} produits créés`);

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

// Lancer la migration
migrateData();
