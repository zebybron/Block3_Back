const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères'],
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['Posters', 'Statues', 'Figures', 'Cartes', 'Comics', 'Autres'],
  },
  condition: {
    type: String,
    enum: ['Neuf', 'Très bon état', 'Bon état', 'État moyen', 'À restaurer'],
    default: 'Très bon état',
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  priceHistory: [{
    price: Number,
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  images: [{
    url: String,
    uploadedAt: Date,
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerName: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold', 'removed'],
    default: 'approved',
  },
  validatedAt: Date,
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: String,
  views: {
    type: Number,
    default: 0,
  },
  interestedBuyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  soldAt: Date,
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Créer des indexes pour les performances
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
