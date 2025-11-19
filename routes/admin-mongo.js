const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongoService');
const { authenticateToken, requireAdmin } = require('../middleware/auth-mongo');
const { generateResponse } = require('../utils/helpers');

// @route   GET /api/admin/products/pending
// @desc    Obtenir les produits en attente de validation
// @access  Admin only
router.get('/products/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const products = await Product.find({ status: 'pending' })
            .populate('seller')
            .sort({ createdAt: -1 });

        res.json(generateResponse(
            true,
            { products },
            null
        ));

    } catch (error) {
        console.error('Erreur récupération produits pending:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des produits.'
        ));
    }
});

// @route   GET /api/admin/stats
// @desc    Obtenir les statistiques de la plateforme
// @access  Admin only
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const User = require('../models/User');
        const Message = require('../models/Message');

        const [totalProducts, pendingProducts, approvedProducts, rejectedProducts, totalUsers, totalMessages] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ status: 'pending' }),
            Product.countDocuments({ status: 'approved' }),
            Product.countDocuments({ status: 'rejected' }),
            User.countDocuments(),
            Message.countDocuments()
        ]);

        // Produits récents
        const recentProducts = await Product.find()
            .populate('seller')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(generateResponse(
            true,
            {
                stats: {
                    products: {
                        total: totalProducts,
                        pending: pendingProducts,
                        approved: approvedProducts,
                        rejected: rejectedProducts
                    },
                    users: totalUsers,
                    messages: totalMessages
                },
                recentProducts
            }
        ));

    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des statistiques.'
        ));
    }
});

// @route   PUT /api/admin/products/:id/approve
// @desc    Approuver un produit
// @access  Admin only
router.put('/products/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const product = await mongoService.updateProduct(req.params.id, {
            status: 'approved',
            validatedAt: new Date(),
            validatedBy: req.userId,
        });

        if (!product) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Produit non trouvé.'
            ));
        }

        res.json(generateResponse(
            true,
            { product },
            'Produit approuvé !'
        ));

    } catch (error) {
        console.error('Erreur approbation produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de l\'approbation du produit.'
        ));
    }
});

// @route   PUT /api/admin/products/:id/reject
// @desc    Rejeter un produit
// @access  Admin only
router.put('/products/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { reason } = req.body;

        const product = await mongoService.updateProduct(req.params.id, {
            status: 'rejected',
            rejectionReason: reason || 'Non spécifiée',
            validatedAt: new Date(),
            validatedBy: req.userId,
        });

        if (!product) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Produit non trouvé.'
            ));
        }

        res.json(generateResponse(
            true,
            { product },
            'Produit rejeté !'
        ));

    } catch (error) {
        console.error('Erreur rejet produit:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors du rejet du produit.'
        ));
    }
});

// @route   DELETE /api/admin/products/:id
// @desc    Supprimer un produit (modération)
// @access  Admin only
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await mongoService.deleteProduct(req.params.id);

        res.json(generateResponse(
            true,
            null,
            'Produit supprimé par modération.'
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

// @route   GET /api/admin/users
// @desc    Obtenir la liste de tous les utilisateurs
// @access  Admin only
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await mongoService.getAllUsers();

        res.json(generateResponse(
            true,
            { users },
            null
        ));

    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des utilisateurs.'
        ));
    }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Changer le rôle d'un utilisateur
// @access  Admin only
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'seller', 'admin'].includes(role)) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                'Rôle invalide. Acceptés: user, seller, admin'
            ));
        }

        const user = await mongoService.updateUser(req.params.id, { role });

        if (!user) {
            return res.status(404).json(generateResponse(
                false,
                null,
                null,
                'Utilisateur non trouvé.'
            ));
        }

        res.json(generateResponse(
            true,
            { user },
            `Rôle changé à: ${role}`
        ));

    } catch (error) {
        console.error('Erreur changement rôle:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors du changement de rôle.'
        ));
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur (modération)
// @access  Admin only
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndDelete(req.params.id);

        res.json(generateResponse(
            true,
            null,
            'Utilisateur supprimé par modération.'
        ));

    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la suppression de l\'utilisateur.'
        ));
    }
});

// @route   GET /api/admin/categories
// @desc    Obtenir les catégories
// @access  Admin only
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const categories = await mongoService.getAllCategories();

        res.json(generateResponse(
            true,
            { categories },
            null
        ));

    } catch (error) {
        console.error('Erreur récupération catégories:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des catégories.'
        ));
    }
});

// @route   POST /api/admin/categories
// @desc    Créer une nouvelle catégorie
// @access  Admin only
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        if (!name) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                'Le nom de la catégorie est requis.'
            ));
        }

        const result = await mongoService.createCategory({
            name,
            description: description || '',
            icon: icon || '📦',
            createdBy: req.userId,
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
            { category: result.category },
            'Catégorie créée !'
        ));

    } catch (error) {
        console.error('Erreur création catégorie:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la création de la catégorie.'
        ));
    }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Supprimer une catégorie
// @access  Admin only
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await mongoService.deleteCategory(req.params.id);

        res.json(generateResponse(
            true,
            null,
            'Catégorie supprimée !'
        ));

    } catch (error) {
        console.error('Erreur suppression catégorie:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la suppression de la catégorie.'
        ));
    }
});

// @route   GET /api/admin/moderation/history
// @desc    Obtenir l'historique de modération
// @access  Admin only
router.get('/moderation/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const { limit = 50, status } = req.query;

        const query = status ? { status } : { status: { $in: ['approved', 'rejected'] } };
        
        const history = await Product.find(query)
            .populate('seller')
            .populate('validatedBy')
            .sort({ validatedAt: -1 })
            .limit(parseInt(limit));

        res.json(generateResponse(
            true,
            { history }
        ));

    } catch (error) {
        console.error('Erreur historique modération:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération de l\'historique.'
        ));
    }
});

module.exports = router;
