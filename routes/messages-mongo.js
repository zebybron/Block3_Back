const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongoService');
const { authenticateToken } = require('../middleware/auth-mongo');
const { generateResponse } = require('../utils/helpers');

// @route   POST /api/messages
// @desc    Envoyer un message
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            conversationId,
            recipientId,
            productId,
            message,
        } = req.body;

        if (!conversationId || !recipientId || !message) {
            return res.status(400).json(generateResponse(
                false,
                null,
                null,
                'conversationId, recipientId, et message sont requis.'
            ));
        }

        const result = await mongoService.createMessage({
            conversationId,
            sender: req.userId,
            senderName: req.userEmail,
            recipient: recipientId,
            recipientName: recipientId,
            productId: productId || null,
            message,
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
            { message: result.message },
            'Message envoyé !'
        ));

    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de l\'envoi du message.'
        ));
    }
});

// @route   GET /api/messages/:conversationId
// @desc    Obtenir une conversation
// @access  Private
router.get('/:conversationId', authenticateToken, async (req, res) => {
    try {
        const messages = await mongoService.getConversation(req.params.conversationId, 100);

        res.json(generateResponse(
            true,
            { messages }
        ));

    } catch (error) {
        console.error('Erreur récupération conversation:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération de la conversation.'
        ));
    }
});

// @route   GET /api/messages/user/conversations
// @desc    Obtenir toutes les conversations d'un utilisateur
// @access  Private
router.get('/user/conversations', authenticateToken, async (req, res) => {
    try {
        const conversations = await mongoService.getUserConversations(req.userId);

        res.json(generateResponse(
            true,
            { conversations }
        ));

    } catch (error) {
        console.error('Erreur récupération conversations:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des conversations.'
        ));
    }
});

module.exports = router;
