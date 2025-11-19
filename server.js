const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Importer la connexion MongoDB
const { connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;

// Variable pour tracker si MongoDB est disponible
let mongoDBAvailable = false;

// Connexion MongoDB (optionnelle)
connectDB()
    .then(() => {
        mongoDBAvailable = true;
        console.log('✅ Mode MongoDB activé');
    })
    .catch(err => {
        mongoDBAvailable = false;
        console.log('⚠️  MongoDB non disponible, utilisation du système in-memory');
        console.log('💡 Pour utiliser MongoDB, installez-le: https://www.mongodb.com/try/download/community');
    });

// Middleware de sécurité avec CSP permissive pour le développement
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",  // Permet les scripts inline
                "'unsafe-eval'",    // Permet eval() pour certaines libs
                "https://cdn.jsdelivr.net",
                "https://code.jquery.com",
                "https://stackpath.bootstrapcdn.com",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],  // CRUCIAL: Permet onclick="..."
            scriptSrcElem: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://code.jquery.com",
                "https://stackpath.bootstrapcdn.com",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://stackpath.bootstrapcdn.com",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            mediaSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null  // Désactiver pour localhost
        }
    }
}));

// Configuration CORS très permissive pour le développement
app.use(cors({
    origin: true, // Autoriser toutes les origines
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Trop de requêtes depuis cette IP, essayez plus tard.'
});
app.use(limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware pour servir les fichiers statiques (images uploadées)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes API (AVANT le middleware static pour éviter les conflits)
app.use('/api/auth', require('./routes/auth-mongo'));
app.use('/api/products', require('./routes/products-mongo'));
app.use('/api/messages', require('./routes/messages-mongo'));
app.use('/api/favorites', require('./routes/favorites-mongo'));
app.use('/api/admin', require('./routes/admin-mongo'));

// Middleware pour servir les fichiers statiques du Frontend (APRÈS les routes API)
const frontendDir = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendDir));
console.log('📂 Serving frontend from:', frontendDir);

// Rendre io disponible pour les routes
app.set('io', io);

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Route pour servir collector_app.html à la racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'collector_app.html'));
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        message: 'L\'endpoint demandé n\'existe pas.'
    });
});

// Middleware de gestion d'erreur global
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'Fichier trop volumineux',
            message: 'La taille du fichier ne peut pas dépasser 5MB.'
        });
    }
    
    res.status(err.status || 500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue.'
    });
});

// Configuration WebSocket pour le chat en temps réel
const connectedUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
    // Authentification via token JWT
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`✅ Utilisateur connecté: ${socket.userEmail} (${socket.userId})`);
    
    // Enregistrer l'utilisateur connecté
    connectedUsers.set(socket.userId, socket.id);
    
    // Notifier les autres utilisateurs de la connexion
    socket.broadcast.emit('user_connected', {
        userId: socket.userId,
        timestamp: new Date()
    });
    
    // Rejoindre les conversations de l'utilisateur
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`👥 ${socket.userEmail} a rejoint la conversation ${conversationId}`);
    });
    
    // Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`👋 ${socket.userEmail} a quitté la conversation ${conversationId}`);
    });
    
    // Envoyer un message en temps réel
    socket.on('send_message', (data) => {
        const { conversationId, content, type = 'text' } = data;
        
        const message = {
            id: Date.now().toString(),
            senderId: socket.userId,
            senderEmail: socket.userEmail,
            content,
            type,
            timestamp: new Date(),
            read: false
        };
        
        // Diffuser le message à tous les participants de la conversation
        io.to(`conversation_${conversationId}`).emit('new_message', {
            conversationId,
            message
        });
        
        console.log(`💬 Message de ${socket.userEmail} dans conversation ${conversationId}`);
    });
    
    // Marquer un message comme lu
    socket.on('mark_read', (data) => {
        const { conversationId, messageId } = data;
        
        io.to(`conversation_${conversationId}`).emit('message_read', {
            conversationId,
            messageId,
            userId: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Notification de saisie en cours
    socket.on('typing_start', (conversationId) => {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId,
            userId: socket.userId,
            userEmail: socket.userEmail
        });
    });
    
    socket.on('typing_stop', (conversationId) => {
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
            conversationId,
            userId: socket.userId
        });
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`❌ Utilisateur déconnecté: ${socket.userEmail}`);
        connectedUsers.delete(socket.userId);
        
        socket.broadcast.emit('user_disconnected', {
            userId: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Gestion des erreurs
    socket.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
    });
});

// Fonction pour envoyer une notification à un utilisateur spécifique
function notifyUser(userId, event, data) {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
}

// Rendre la fonction disponible globalement
global.notifyUser = notifyUser;
global.io = io;

// Fonction pour trouver un port libre
function startServer(port) {
    server.listen(port, () => {
        console.log(`🚀 Serveur Collector.shop démarré sur le port ${port}`);
        console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
        console.log(`📡 API disponible sur: http://localhost:${port}/api`);
        console.log(`💬 WebSocket disponible sur: ws://localhost:${port}`);
        console.log(`💚 Health check: http://localhost:${port}/api/health`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`❌ Port ${port} déjà utilisé, tentative sur le port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Erreur serveur:', err);
        }
    });
}

// Démarrage du serveur
startServer(PORT);

module.exports = app;
