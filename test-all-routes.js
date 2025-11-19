require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let userId = null;
let productId = null;
let messageId = null;

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(status, message) {
    const color = status === 'SUCCESS' ? colors.green : status === 'ERROR' ? colors.red : colors.yellow;
    console.log(`${color}${status}${colors.reset} - ${message}`);
}

async function testAuth() {
    console.log(`\n${colors.blue}=== TEST AUTHENTIFICATION ===${colors.reset}`);
    
    try {
        // Test inscription
        const randomId = Math.random().toString(36).substring(7);
        const email = `test${randomId}@example.com`;
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: `TestUser${randomId}`,
            firstName: 'Test',
            lastName: 'User',
            email: email,
            password: 'Test123456'
        });
        
        if (registerRes.data.success && registerRes.data.data.token) {
            authToken = registerRes.data.data.token;
            userId = registerRes.data.data.user._id;
            log('SUCCESS', `Inscription OK - User: ${registerRes.data.data.user.username}, Name: ${registerRes.data.data.user.name}`);
        } else {
            log('ERROR', 'Inscription échouée - Pas de token');
            return false;
        }

        // Test connexion
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: email,
            password: 'Test123456'
        });
        
        if (loginRes.data.success && loginRes.data.data.token) {
            log('SUCCESS', `Connexion OK - Token reçu`);
        } else {
            log('ERROR', 'Connexion échouée');
            return false;
        }

        return true;
    } catch (error) {
        log('ERROR', `Auth: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) console.log('Détails:', JSON.stringify(error.response.data, null, 2));
        return false;
    }
}

async function testProducts() {
    console.log(`\n${colors.blue}=== TEST PRODUITS ===${colors.reset}`);
    
    try {
        // Test création produit
        const createRes = await axios.post(`${BASE_URL}/products`, {
            title: 'Article de test',
            description: 'Description test',
            price: 29.99,
            category: 'Posters',
            condition: 'Neuf',
            images: ['https://via.placeholder.com/300']
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (createRes.data.success && createRes.data.data.product) {
            productId = createRes.data.data.product._id;
            log('SUCCESS', `Produit créé - ID: ${productId}`);
        } else {
            log('ERROR', 'Création produit échouée');
            console.log('Réponse:', JSON.stringify(createRes.data, null, 2));
            return false;
        }

        // Test récupération tous les produits
        const allProductsRes = await axios.get(`${BASE_URL}/products`);
        if (allProductsRes.data.success && Array.isArray(allProductsRes.data.data.products)) {
            log('SUCCESS', `Liste produits OK - ${allProductsRes.data.data.products.length} produits`);
        } else {
            log('ERROR', 'Récupération liste produits échouée');
        }

        // Test récupération produit par ID
        const productRes = await axios.get(`${BASE_URL}/products/${productId}`);
        if (productRes.data.success && productRes.data.data.product) {
            log('SUCCESS', `Produit récupéré - Titre: ${productRes.data.data.product.title}`);
        } else {
            log('ERROR', 'Récupération produit par ID échouée');
        }

        // Test filtres
        const filteredRes = await axios.get(`${BASE_URL}/products?category=Posters&minPrice=20&maxPrice=50`);
        if (filteredRes.data.success) {
            log('SUCCESS', `Filtres OK - ${filteredRes.data.data.products.length} résultats`);
        } else {
            log('ERROR', 'Filtres échoués');
        }

        return true;
    } catch (error) {
        log('ERROR', `Produits: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            console.log('Détails erreur:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function testFavorites() {
    console.log(`\n${colors.blue}=== TEST FAVORIS ===${colors.reset}`);
    
    try {
        // Ajouter aux favoris
        const addRes = await axios.post(`${BASE_URL}/favorites/${productId}`, {}, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (addRes.data.success) {
            log('SUCCESS', 'Ajout aux favoris OK');
        } else {
            log('ERROR', 'Ajout favoris échoué');
            return false;
        }

        // Récupérer favoris
        const getFavRes = await axios.get(`${BASE_URL}/favorites`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (getFavRes.data.success && Array.isArray(getFavRes.data.data.favorites)) {
            log('SUCCESS', `Liste favoris OK - ${getFavRes.data.data.favorites.length} favoris`);
        } else {
            log('ERROR', 'Récupération favoris échouée');
        }

        // Retirer des favoris
        const removeRes = await axios.delete(`${BASE_URL}/favorites/${productId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (removeRes.data.success) {
            log('SUCCESS', 'Retrait des favoris OK');
        } else {
            log('ERROR', 'Retrait favoris échoué');
        }

        return true;
    } catch (error) {
        log('ERROR', `Favoris: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) console.log('Détails:', JSON.stringify(error.response.data, null, 2));
        return false;
    }
}

async function testMessages() {
    console.log(`\n${colors.blue}=== TEST MESSAGES ===${colors.reset}`);
    
    try {
        // Envoyer un message
        const sendRes = await axios.post(`${BASE_URL}/messages`, {
            conversationId: `conv_${userId}`,
            recipientId: userId, // S'envoie à soi-même pour le test
            productId: productId,
            message: 'Message de test'
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (sendRes.data.success && sendRes.data.data.message) {
            messageId = sendRes.data.data.message._id;
            log('SUCCESS', `Message envoyé - ID: ${messageId}`);
        } else {
            log('ERROR', 'Envoi message échoué');
            console.log('Réponse:', JSON.stringify(sendRes.data, null, 2));
            return false;
        }

        // Récupérer messages
        const conversationId = `conv_${userId}`;
        const getRes = await axios.get(`${BASE_URL}/messages/${conversationId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (getRes.data.success && Array.isArray(getRes.data.data.messages)) {
            log('SUCCESS', `Liste messages OK - ${getRes.data.data.messages.length} messages`);
        } else {
            log('ERROR', 'Récupération messages échouée');
        }

        return true;
    } catch (error) {
        log('ERROR', `Messages: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) console.log('Détails:', JSON.stringify(error.response.data, null, 2));
        return false;
    }
}

async function testAdmin() {
    console.log(`\n${colors.blue}=== TEST ADMIN ===${colors.reset}`);
    
    try {
        // Récupérer produits en attente (nécessite droits admin)
        const pendingRes = await axios.get(`${BASE_URL}/admin/products/pending`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        // Devrait échouer car l'utilisateur n'est pas admin
        if (pendingRes.status === 403 || !pendingRes.data.success) {
            log('SUCCESS', 'Restriction admin fonctionne (utilisateur normal rejeté)');
        } else {
            log('WARNING', 'Endpoint admin accessible sans droits!');
        }

        return true;
    } catch (error) {
        if (error.response?.status === 403) {
            log('SUCCESS', 'Restriction admin fonctionne (403 reçu)');
            return true;
        } else {
            log('ERROR', `Admin: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }
}

async function runAllTests() {
    console.log(`${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║   TEST COMPLET DES ROUTES MONGODB     ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}`);

    const results = [];

    results.push(await testAuth());
    if (authToken) {
        results.push(await testProducts());
        results.push(await testFavorites());
        results.push(await testMessages());
        results.push(await testAdmin());
    }

    console.log(`\n${colors.blue}=== RÉSULTATS ===${colors.reset}`);
    const passed = results.filter(r => r === true).length;
    const total = results.length;
    
    if (passed === total) {
        console.log(`${colors.green}✅ TOUS LES TESTS RÉUSSIS (${passed}/${total})${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  ${passed}/${total} tests réussis${colors.reset}`);
    }
}

runAllTests().catch(err => {
    console.error(`${colors.red}Erreur fatale: ${err.message}${colors.reset}`);
    process.exit(1);
});
