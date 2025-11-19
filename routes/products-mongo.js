const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongoService');
const { authenticateToken, optionalAuth } = require('../middleware/auth-mongo');
const { generateResponse } = require('../utils/helpers');

// @route   GET /api/products
// @desc    Obtenir tous les produits avec filtres et pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            condition,
            search,
            sortBy = 'newest',
            page = 1,
            limit = 12
        } = req.query;

        const filters = {
            category: category && category !== 'undefined' ? category : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            condition: condition && condition !== 'undefined' ? condition : undefined,
            search: search && search !== 'undefined' ? search : undefined,
            sortBy,
            page: parseInt(page),
            limit: parseInt(limit),
        };

        console.log('📋 Filtres API:', filters);

        const result = await mongoService.getAllProducts(filters);

        res.json(generateResponse(
            true,
            {
                products: result.products,
                pagination: {
                    total: result.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(result.total / parseInt(limit)),
                },
                filters,
            }
        ));

    } catch (error) {
        console.error('Erreur récupération produits:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des produits.'
        ));
    }
});

// @route   GET /api/products/:id
// @desc    Obtenir un produit par ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await mongoService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Produit non trouvé.'
            ));
        }

        res.json(generateResponse(true, { product }));

    } catch (error) {
        console.error('Erreur récupération produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération du produit.'
        ));
    }
});

// @route   POST /api/products
// @desc    Créer un nouveau produit
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            condition,
            price,
            shippingCost = 0,
            images = [],
        } = req.body;

        // Validation
        if (!title || !description || !category || !price) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                'Les champs requis sont: titre, description, catégorie, prix.'
            ));
        }

        if (price < 0) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                'Le prix doit être positif.'
            ));
        }

        const result = await mongoService.createProduct({
            title,
            description,
            category,
            condition: condition || 'Très bon état',
            price,
            shippingCost,
            images: images.map(url => ({ url, uploadedAt: new Date() })),
            seller: req.userId,
            sellerName: req.userEmail,
            status: 'approved', // Directement approuvé
            validatedAt: new Date(),
        });

        if (!result.success) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                result.error
            ));
        }

        res.status(201).json(generateResponse(
            true,
            { product: result.product },
            'Produit créé avec succès !'
        ));

    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la création du produit.'
        ));
    }
});

// @route   PUT /api/products/:id
// @desc    Mettre à jour un produit
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const product = await mongoService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Produit non trouvé.'
            ));
        }

        // Vérifier les permissions
        if (product.seller._id.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json(generateResponse(
                false,
                null,
                null,
                'Non autorisé à modifier ce produit.'
            ));
        }

        const updatedProduct = await mongoService.updateProduct(
            req.params.id,
            req.body
        );

        res.json(generateResponse(
            true,
            { product: updatedProduct },
            'Produit mis à jour avec succès !'
        ));

    } catch (error) {
        console.error('Erreur mise à jour produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la mise à jour du produit.'
        ));
    }
});

// @route   DELETE /api/products/:id
// @desc    Supprimer un produit
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const product = await mongoService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Produit non trouvé.'
            ));
        }

        // Vérifier les permissions
        if (product.seller._id.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json(generateResponse(
                false,
                null,
                null,
                'Non autorisé à supprimer ce produit.'
            ));
        }

        await mongoService.deleteProduct(req.params.id);

        res.json(generateResponse(
            true,
            null,
            'Produit supprimé avec succès !'
        ));

    } catch (error) {
        console.error('Erreur suppression produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la suppression du produit.'
        ));
    }
});

// @route   GET /api/products/seller/:sellerId
// @desc    Obtenir les produits d'un vendeur
// @access  Public
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const products = await mongoService.getProductsBySeller(req.params.sellerId);

        res.json(generateResponse(
            true,
            { products },
            null
        ));

    } catch (error) {
        console.error('Erreur récupération produits vendeur:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des produits.'
        ));
    }
});

module.exports = router;
