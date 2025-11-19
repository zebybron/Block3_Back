const express = require('express');
const router = express.Router();

// Route de santé pour vérifier que le serveur fonctionne
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Serveur Collector.shop fonctionnel',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
