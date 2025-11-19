require('dotenv').config();
const { connectDB } = require('./config/database');
const User = require('./models/User');

async function createAdmin() {
    try {
        await connectDB();
        console.log('✅ Connecté à MongoDB\n');

        // Vérifier si admin existe déjà
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (existingAdmin) {
            console.log('ℹ️  Un admin existe déjà avec cet email');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Rôle: ${existingAdmin.role}`);
            
            // Mettre à jour le mot de passe et le rôle
            existingAdmin.password = 'admin123';
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            
            console.log('\n✅ Admin mis à jour avec succès!');
            console.log('   Mot de passe: admin123');
        } else {
            // Créer un nouvel admin
            const admin = new User({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'Collector',
                role: 'admin',
                isSeller: true
            });

            await admin.save();

            console.log('✅ Compte administrateur créé avec succès!\n');
            console.log('📧 Email: admin@example.com');
            console.log('🔑 Mot de passe: admin123');
            console.log('👤 Username: admin');
            console.log('🛡️  Rôle: admin');
        }

        console.log('\n🚀 Vous pouvez maintenant vous connecter:');
        console.log('   - Application: http://localhost:3000');
        console.log('   - Panel Admin: http://localhost:3000/admin-panel.html');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

createAdmin();
