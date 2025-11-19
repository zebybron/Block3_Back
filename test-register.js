// Script de test pour l'inscription
const fetch = require('node-fetch');

async function testRegister() {
    const baseURL = 'http://localhost:3000/api';
    
    console.log('🧪 Test d\'inscription...\n');
    
    // Test 1: Inscription valide
    try {
        console.log('Test 1: Inscription valide');
        const response = await fetch(`${baseURL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Register',
                email: 'testregister@example.com',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.log('Erreur:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Email déjà utilisé
    try {
        console.log('Test 2: Email déjà utilisé');
        const response = await fetch(`${baseURL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Duplicate',
                email: 'admin@collector.shop',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.log('Erreur:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Données manquantes
    try {
        console.log('Test 3: Données manquantes');
        const response = await fetch(`${baseURL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Incomplete',
                email: 'incomplete@example.com'
                // password manquant
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.log('Erreur:', error.message);
    }
}

testRegister().catch(console.error);
