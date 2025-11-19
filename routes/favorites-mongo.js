const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongoService');
const { authenticateToken } = require('../middleware/auth-mongo');
const { generateResponse } = require('../utils/helpers');

// @route   POST /api/favorites/:productId
// @desc    Ajouter un produit aux favoris
// @access  Private
router.post('/:productId', authenticateToken, async (req, res) => {
    try {
        const user = await mongoService.addToFavorites(req.userId, req.params.productId);

        if (!user) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Erreur lors de l\'ajout aux favoris.'
            ));
        }

        res.json(generateResponse(
            true,
            { favorites: user.favorites },
            'Produit ajouté aux favoris !'
        ));

    } catch (error) {
        console.error('Erreur ajout favoris:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de l\'ajout aux favoris.'
        ));
    }
});

// @route   DELETE /api/favorites/:productId
// @desc    Retirer un produit des favoris
// @access  Private
router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const user = await mongoService.removeFromFavorites(req.userId, req.params.productId);

        if (!user) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Erreur lors de la suppression des favoris.'
            ));
        }

        res.json(generateResponse(
            true,
            { favorites: user.favorites },
            'Produit retiré des favoris !'
        ));

    } catch (error) {
        console.error('Erreur suppression favoris:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la suppression des favoris.'
        ));
    }
});

// @route   GET /api/favorites
// @desc    Obtenir les favoris de l'utilisateur
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const favorites = await mongoService.getFavorites(req.userId);

        res.json(generateResponse(
            true,
            { favorites }
        ));

    } catch (error) {
        console.error('Erreur récupération favoris:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des favoris.'
        ));
    }
});

module.exports = router;
