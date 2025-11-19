const express = require('express');
const path = require('path');

// Test simple du serveur
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Serveur de test fonctionnel!', timestamp: new Date().toISOString() });
});

// Tenter de démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`✅ Serveur de test démarré sur http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} déjà utilisé. Tentative sur le port ${PORT + 1}...`);
    const server2 = app.listen(PORT + 1, () => {
      console.log(`✅ Serveur de test démarré sur http://localhost:${PORT + 1}`);
    });
  } else {
    console.error('Erreur serveur:', err);
  }
});

// Arrêt automatique après 30 secondes
setTimeout(() => {
  console.log('Arrêt du serveur de test...');
  process.exit(0);
}, 30000);
