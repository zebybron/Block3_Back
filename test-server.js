// Serveur de test simple pour Collector.shop
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware de base
app.use(cors());
app.use(express.json());

// Route de test
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Serveur Collector.shop opérationnel',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Route API de base
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: {
            products: [
                {
                    id: 1,
                    title: "Test Product",
                    price: 100,
                    category: "Test",
                    condition: "Neuf"
                }
            ]
        }
    });
});

// Fonction pour démarrer le serveur avec gestion des conflits de port
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`🚀 Serveur test Collector.shop démarré sur le port ${port}`);
        console.log(`💚 Health check: http://localhost:${port}/health`);
        console.log(`📡 API test: http://localhost:${port}/api/products`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`❌ Port ${port} occupé, essai port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Erreur serveur:', err);
        }
    });

    return server;
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
startServer(PORT);
