const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoService = require('../services/mongoService');
const { authenticateToken } = require('../middleware/auth-mongo');
const { generateToken, validateEmail, validatePassword, sanitizeUser, generateResponse } = require('../utils/helpers');

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, name, firstName, lastName, email, password } = req.body;

        // Accepter soit 'username' soit 'name' du frontend
        const finalUsername = username || name;

        // Validation des données
        if (!finalUsername || !email || !password) {
            return res.status(400).json(generateResponse(
                false, 
                null, 
                null, 
                'Tous les champs sont requis (nom d\'utilisateur, email, mot de passe).'
            ));
        }

        if (!validateEmail(email)) {
            return res.status(400).json(generateResponse(
                false, 
                null, 
                null, 
                'Format d\'email invalide.'
            ));
        }

        if (!validatePassword(password)) {
            return res.status(400).json(generateResponse(
                false, 
                null, 
                null, 
                'Le mot de passe doit contenir au moins 6 caractères.'
            ));
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await mongoService.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json(generateResponse(
                false, 
                null, 
                null, 
                'Un compte avec cet email existe déjà.'
            ));
        }

        const existingUsername = await mongoService.getUserByUsername(finalUsername);
        if (existingUsername) {
            return res.status(409).json(generateResponse(
                false, 
                null, 
                null, 
                'Ce nom d\'utilisateur est déjà pris.'
            ));
        }

        // Créer l'utilisateur
        const result = await mongoService.createUser({
            username: finalUsername.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            firstName: firstName?.trim(),
            lastName: lastName?.trim(),
            role: 'user',
        });

        if (!result.success) {
            return res.status(400).json(generateResponse(
                false, 
                null, 
                null, 
                result.error
            ));
        }

        // Générer le token
        const token = generateToken({
            id: result.user._id.toString(),
            email: result.user.email,
            username: result.user.username,
            role: result.user.role,
        });

        res.status(201).json(generateResponse(
            true,
            {
                user: sanitizeUser(result.user),
                token
            },
            'Compte créé avec succès !'
        ));

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json(generateResponse(
            false, 
            null, 
            null, 
            'Erreur lors de la création du compte.'
        ));
    }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des données
        if (!email || !password) {
            return res.status(400).json(generateResponse(
                false, 
                null, 
                null, 
                'Email et mot de passe requis.'
            ));
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json(generateResponse(
                false, 
                null, 
                null, 
                'Email ou mot de passe incorrect.'
            ));
        }

        // Vérifier le mot de passe
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json(generateResponse(
                false, 
                null, 
                null, 
                'Email ou mot de passe incorrect.'
            ));
        }

        // Générer le token
        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
        });

        res.status(200).json(generateResponse(
            true,
            {
                user: sanitizeUser(user),
                token
            },
            'Connexion réussie !'
        ));

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json(generateResponse(
            false, 
            null, 
            null, 
            'Erreur lors de la connexion.'
        ));
    }
});

// @route   POST /api/auth/verify
// @desc    Vérifier le token et retourner l'utilisateur
// @access  Private
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await mongoService.getUserById(req.userId);

        if (!user) {
            return res.status(404).json(generateResponse(
                false, 
                null, 
                null, 
                'Utilisateur non trouvé.'
            ));
        }

        res.status(200).json(generateResponse(
            true,
            { user: sanitizeUser(user) },
            'Token valide.'
        ));

    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json(generateResponse(
            false, 
            null, 
            null, 
            'Erreur lors de la vérification du token.'
        ));
    }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
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
            { user: sanitizeUser(user) }
        ));

    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        res.status(500).json(generateResponse(
            false,
            null,
            null,
            'Erreur lors de la récupération des informations.'
        ));
    }
});

module.exports = router;
