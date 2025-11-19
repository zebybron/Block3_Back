#!/bin/bash
# Script de démarrage rapide pour MongoDB + Collector.shop

echo "🚀 Collector.shop - Setup MongoDB"
echo "=================================="
echo ""

# Vérifier si MongoDB est démarré
echo "✅ Étape 1: Vérifier MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB n'est pas installé"
    echo ""
    echo "Installez MongoDB Community:"
    echo "https://www.mongodb.com/try/download/community"
    echo ""
    exit 1
fi

echo "✅ MongoDB trouvé: $(mongod --version)"
echo ""

# Vérifier si MongoDB est en cours d'exécution
echo "✅ Étape 2: Démarrer MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "   Démarrage de MongoDB..."
    mongod &
    sleep 2
    echo "   ✅ MongoDB démarré"
else
    echo "   ✅ MongoDB est déjà en cours d'exécution"
fi
echo ""

# Installation des dépendances
echo "✅ Étape 3: Installer les dépendances..."
cd Backend
if [ ! -d "node_modules" ]; then
    npm install
    echo "   ✅ Dépendances installées"
else
    echo "   ✅ Dépendances déjà installées"
fi
echo ""

# Initialiser la base de données
echo "✅ Étape 4: Initialiser la base de données..."
echo "   Voulez-vous charger les données de test? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    npm run seed
    echo "   ✅ Données de test chargées"
fi
echo ""

# Démarrer le serveur
echo "✅ Étape 5: Démarrer le serveur..."
echo ""
npm start

