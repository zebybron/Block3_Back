require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = null;
let normalToken = null;
let testProductId = null;

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

async function createAdminUser() {
    console.log(`\n${colors.blue}=== CRÉATION COMPTE ADMIN ===${colors.reset}`);
    
    try {
        // Créer utilisateur normal
        const email = `admin${Date.now()}@test.com`;
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: `Admin`,
            email: email,
            password: 'admin123'
        });
        
        adminToken = registerRes.data.data.token;
        const userId = registerRes.data.data.user._id;
        
        log('SUCCESS', `Compte créé: ${email}`);
        
        // Promouvoir en admin (nécessite accès direct MongoDB ou admin existant)
        console.log(`${colors.yellow}IMPORTANT: Exécutez cette commande MongoDB pour donner droits admin:${colors.reset}`);
        console.log(`db.users.updateOne({_id: ObjectId("${userId}")}, {$set: {role: "admin"}})`);
        console.log(`\nOu utilisez la console Mongo:`);
        console.log(`mongosh collector-shop`);
        console.log(`db.users.updateOne({email: "${email}"}, {$set: {role: "admin"}})`);
        
        return true;
    } catch (error) {
        log('ERROR', `Création admin: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function createNormalUser() {
    console.log(`\n${colors.blue}=== CRÉATION UTILISATEUR NORMAL ===${colors.reset}`);
    
    try {
        const email = `seller${Date.now()}@test.com`;
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: `Seller`,
            email: email,
            password: 'seller123'
        });
        
        normalToken = registerRes.data.data.token;
        log('SUCCESS', `Vendeur créé: ${email}`);
        
        return true;
    } catch (error) {
        log('ERROR', `Création vendeur: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function createTestProduct() {
    console.log(`\n${colors.blue}=== CRÉATION PRODUIT TEST ===${colors.reset}`);
    
    try {
        const createRes = await axios.post(`${BASE_URL}/products`, {
            title: 'Produit à modérer',
            description: 'Ce produit doit être validé par un administrateur avant d\'apparaître sur le site',
            price: 99.99,
            category: 'Posters',
            condition: 'Neuf',
            images: ['https://via.placeholder.com/300']
        }, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        
        testProductId = createRes.data.data.product._id;
        const status = createRes.data.data.product.status;
        
        log('SUCCESS', `Produit créé - ID: ${testProductId} - Status: ${status}`);
        
        return true;
    } catch (error) {
        log('ERROR', `Création produit: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testPendingList() {
    console.log(`\n${colors.blue}=== TEST LISTE PRODUITS EN ATTENTE ===${colors.reset}`);
    
    try {
        // Sans token admin (devrait échouer)
        try {
            await axios.get(`${BASE_URL}/admin/products/pending`, {
                headers: { 'Authorization': `Bearer ${normalToken}` }
            });
            log('ERROR', 'Utilisateur normal peut accéder aux produits pending!');
        } catch (error) {
            if (error.response?.status === 403) {
                log('SUCCESS', 'Restriction admin fonctionne (403)');
            }
        }
        
        // Avec token admin
        const pendingRes = await axios.get(`${BASE_URL}/admin/products/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const count = pendingRes.data.data.products.length;
        log('SUCCESS', `Admin accède aux produits pending: ${count} produit(s)`);
        
        return true;
    } catch (error) {
        log('ERROR', `Liste pending: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testApproval() {
    console.log(`\n${colors.blue}=== TEST APPROBATION ===${colors.reset}`);
    
    try {
        // Tenter sans droits admin (devrait échouer)
        try {
            await axios.put(`${BASE_URL}/admin/products/${testProductId}/approve`, {}, {
                headers: { 'Authorization': `Bearer ${normalToken}` }
            });
            log('ERROR', 'Utilisateur normal peut approuver!');
        } catch (error) {
            if (error.response?.status === 403) {
                log('SUCCESS', 'Restriction admin sur approbation fonctionne');
            }
        }
        
        // Approuver avec admin
        const approveRes = await axios.put(`${BASE_URL}/admin/products/${testProductId}/approve`, {}, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const status = approveRes.data.data.product.status;
        log('SUCCESS', `Produit approuvé - Nouveau status: ${status}`);
        
        // Vérifier que le produit est maintenant visible
        const productRes = await axios.get(`${BASE_URL}/products/${testProductId}`);
        const visibleStatus = productRes.data.data.product.status;
        
        if (visibleStatus === 'approved') {
            log('SUCCESS', 'Produit approuvé est maintenant visible');
        }
        
        return true;
    } catch (error) {
        log('ERROR', `Approbation: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testRejection() {
    console.log(`\n${colors.blue}=== TEST REJET ===${colors.reset}`);
    
    try {
        // Créer un autre produit pour le rejeter
        const createRes = await axios.post(`${BASE_URL}/products`, {
            title: 'Produit à rejeter',
            description: 'Ce produit sera rejeté',
            price: 50.00,
            category: 'Figures',
            condition: 'Bon état',
            images: []
        }, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        
        const productId = createRes.data.data.product._id;
        
        // Rejeter avec raison
        const rejectRes = await axios.put(`${BASE_URL}/admin/products/${productId}/reject`, {
            reason: 'Images manquantes et description insuffisante'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const status = rejectRes.data.data.product.status;
        const reason = rejectRes.data.data.product.rejectionReason;
        
        log('SUCCESS', `Produit rejeté - Status: ${status}`);
        log('SUCCESS', `Raison: ${reason}`);
        
        return true;
    } catch (error) {
        log('ERROR', `Rejet: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testDeletion() {
    console.log(`\n${colors.blue}=== TEST SUPPRESSION ===${colors.reset}`);
    
    try {
        // Créer un produit pour le supprimer
        const createRes = await axios.post(`${BASE_URL}/products`, {
            title: 'Produit à supprimer',
            description: 'Ce produit sera supprimé par modération',
            price: 25.00,
            category: 'Cartes',
            condition: 'Très bon état',
            images: []
        }, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        
        const productId = createRes.data.data.product._id;
        
        // Supprimer
        await axios.delete(`${BASE_URL}/admin/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        log('SUCCESS', 'Produit supprimé par modération');
        
        // Vérifier qu'il n'existe plus
        try {
            await axios.get(`${BASE_URL}/products/${productId}`);
            log('ERROR', 'Produit supprimé est toujours accessible!');
        } catch (error) {
            if (error.response?.status === 404) {
                log('SUCCESS', 'Produit supprimé n\'est plus accessible');
            }
        }
        
        return true;
    } catch (error) {
        log('ERROR', `Suppression: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testStats() {
    console.log(`\n${colors.blue}=== TEST STATISTIQUES ===${colors.reset}`);
    
    try {
        const statsRes = await axios.get(`${BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const stats = statsRes.data.data.stats;
        
        log('SUCCESS', `Stats récupérées:`);
        console.log(`  - Total produits: ${stats.products.total}`);
        console.log(`  - En attente: ${stats.products.pending}`);
        console.log(`  - Approuvés: ${stats.products.approved}`);
        console.log(`  - Rejetés: ${stats.products.rejected}`);
        console.log(`  - Utilisateurs: ${stats.users}`);
        console.log(`  - Messages: ${stats.messages}`);
        
        return true;
    } catch (error) {
        log('ERROR', `Stats: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║   TEST SYSTÈME DE MODÉRATION ADMIN        ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);

    const results = [];

    // Créer les utilisateurs
    results.push(await createNormalUser());
    
    // Si pas d'admin token fourni, créer un compte
    if (!adminToken) {
        console.log(`\n${colors.yellow}Aucun token admin fourni. Créez un admin manuellement.${colors.reset}`);
        await createAdminUser();
        console.log(`\nRelancez ce script après avoir promu l'utilisateur en admin.`);
        return;
    }

    if (normalToken) {
        results.push(await createTestProduct());
        results.push(await testPendingList());
        results.push(await testApproval());
        results.push(await testRejection());
        results.push(await testDeletion());
        results.push(await testStats());
    }

    console.log(`\n${colors.blue}=== RÉSULTATS ===${colors.reset}`);
    const passed = results.filter(r => r === true).length;
    const total = results.length;
    
    if (passed === total) {
        console.log(`${colors.green}✅ TOUS LES TESTS RÉUSSIS (${passed}/${total})${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  ${passed}/${total} tests réussis${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}Pour accéder au panel admin:${colors.reset}`);
    console.log(`http://localhost:3000/admin-panel.html`);
}

// Possibilité de passer un token admin en argument
if (process.argv[2]) {
    adminToken = process.argv[2];
    console.log(`${colors.green}Token admin fourni${colors.reset}`);
}

runAllTests().catch(err => {
    console.error(`${colors.red}Erreur fatale: ${err.message}${colors.reset}`);
    process.exit(1);
});
