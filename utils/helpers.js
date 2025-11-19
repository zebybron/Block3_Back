const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id || user._id, 
            email: user.email,
            role: user.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    // Au moins 6 caractères
    return password && password.length >= 6;
};

const sanitizeUser = (user) => {
    // Convertir en objet plain si c'est un document Mongoose
    const plainUser = user.toObject ? user.toObject() : user;
    
    // Retourner l'utilisateur sans le mot de passe
    const { password, __v, ...sanitizedUser } = plainUser;
    return sanitizedUser;
};

const generateResponse = (success, data = null, message = null, error = null) => {
    const response = { success };
    
    if (data !== null) response.data = data;
    if (message) response.message = message;
    if (error) response.error = error;
    
    return response;
};

const paginateResults = (items, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const results = {
        data: items.slice(startIndex, endIndex),
        pagination: {
            current: page,
            total: Math.ceil(items.length / limit),
            limit: limit,
            totalItems: items.length
        }
    };

    if (endIndex < items.length) {
        results.pagination.next = page + 1;
    }

    if (startIndex > 0) {
        results.pagination.previous = page - 1;
    }

    return results;
};

const filterProducts = (products, filters = {}) => {
    let filtered = [...products];

    if (filters.category) {
        filtered = filtered.filter(product => 
            product.category.toLowerCase() === filters.category.toLowerCase()
        );
    }

    if (filters.minPrice !== undefined) {
        filtered = filtered.filter(product => product.price >= filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
        console.log(`🏷️ Filtre prix max: ${filters.maxPrice}, produits avec prix:`, filtered.map(p => ({title: p.title, price: p.price})));
        filtered = filtered.filter(product => product.price <= filters.maxPrice);
        console.log(`✂️ Après filtre prix: ${filtered.length} produits restants`);
    }

    if (filters.condition) {
        filtered = filtered.filter(product => 
            product.condition.toLowerCase() === filters.condition.toLowerCase()
        );
    }

    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.seller.toLowerCase().includes(searchTerm)
        );
    }

    return filtered;
};

const sortProducts = (products, sortBy = 'recent') => {
    const sorted = [...products];

    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'popular':
            return sorted.sort((a, b) => b.views - a.views);
        case 'recent':
        default:
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
};

module.exports = {
    generateToken,
    validateEmail,
    validatePassword,
    sanitizeUser,
    generateResponse,
    paginateResults,
    filterProducts,
    sortProducts
};
