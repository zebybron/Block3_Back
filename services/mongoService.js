const User = require('../models/User');
const Product = require('../models/Product');
const Message = require('../models/Message');
const Category = require('../models/Category');

class MongoDBService {
  // ==================== USERS ====================
  
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserByUsername(username) {
    try {
      return await User.findOne({ username });
    } catch (error) {
      console.error('Erreur getUserByUsername:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      console.error('Erreur getUserByEmail:', error);
      return null;
    }
  }

  async getUserById(userId) {
    try {
      return await User.findById(userId).populate('favorites').populate('cart.productId');
    } catch (error) {
      console.error('Erreur getUserById:', error);
      return null;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
      return user;
    } catch (error) {
      console.error('Erreur updateUser:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      return await User.find().select('-password');
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }
  }

  // ==================== PRODUCTS ====================

  async createProduct(productData) {
    try {
      const product = new Product(productData);
      await product.save();
      await product.populate('seller');
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getProductById(productId) {
    try {
      return await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } },
        { new: true }
      ).populate('seller').populate('validatedBy');
    } catch (error) {
      console.error('Erreur getProductById:', error);
      return null;
    }
  }

  async getProductsByCategory(category) {
    try {
      return await Product.find({
        category,
        status: 'approved',
      }).populate('seller').sort({ createdAt: -1 });
    } catch (error) {
      console.error('Erreur getProductsByCategory:', error);
      return [];
    }
  }

  async getProductsBySeller(sellerId) {
    try {
      return await Product.find({ seller: sellerId }).populate('seller').sort({ createdAt: -1 });
    } catch (error) {
      console.error('Erreur getProductsBySeller:', error);
      return [];
    }
  }

  async getAllProducts(filters = {}) {
    try {
      let query = { status: 'approved' };

      // Filtre par catégorie
      if (filters.category && filters.category !== 'undefined') {
        query.category = filters.category;
      }

      // Filtre par condition
      if (filters.condition && filters.condition !== 'undefined') {
        query.condition = filters.condition;
      }

      // Filtre par prix
      if (filters.maxPrice) {
        query.price = { $lte: filters.maxPrice };
      }

      // Filtre par recherche
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];
      }

      let products = Product.find(query).populate('seller');

      // Tri
      if (filters.sortBy === 'price-asc') {
        products = products.sort({ price: 1 });
      } else if (filters.sortBy === 'price-desc') {
        products = products.sort({ price: -1 });
      } else if (filters.sortBy === 'newest') {
        products = products.sort({ createdAt: -1 });
      } else if (filters.sortBy === 'views') {
        products = products.sort({ views: -1 });
      }

      // Pagination
      let skip = 0;
      let limit = 20;
      if (filters.page && filters.limit) {
        skip = (filters.page - 1) * filters.limit;
        limit = filters.limit;
      }

      products = products.skip(skip).limit(limit);

      const result = await products.exec();
      const total = await Product.countDocuments(query);

      return { products: result, total };
    } catch (error) {
      console.error('Erreur getAllProducts:', error);
      return { products: [], total: 0 };
    }
  }

  async updateProduct(productId, updateData) {
    try {
      const product = await Product.findByIdAndUpdate(productId, updateData, { new: true })
        .populate('seller');
      return product;
    } catch (error) {
      console.error('Erreur updateProduct:', error);
      return null;
    }
  }

  async deleteProduct(productId) {
    try {
      return await Product.findByIdAndDelete(productId);
    } catch (error) {
      console.error('Erreur deleteProduct:', error);
      return null;
    }
  }

  async recordPriceChange(productId, newPrice) {
    try {
      return await Product.findByIdAndUpdate(
        productId,
        {
          price: newPrice,
          $push: { priceHistory: { price: newPrice, changedAt: new Date() } },
        },
        { new: true }
      );
    } catch (error) {
      console.error('Erreur recordPriceChange:', error);
      return null;
    }
  }

  // ==================== MESSAGES ====================

  async createMessage(messageData) {
    try {
      const message = new Message(messageData);
      await message.save();
      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getConversation(conversationId, limit = 50) {
    try {
      return await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender')
        .populate('recipient');
    } catch (error) {
      console.error('Erreur getConversation:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId) {
    try {
      return await Message.findByIdAndUpdate(
        messageId,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Erreur markMessageAsRead:', error);
      return null;
    }
  }

  async getUserConversations(userId) {
    try {
      return await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { recipient: userId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
          },
        },
      ]);
    } catch (error) {
      console.error('Erreur getUserConversations:', error);
      return [];
    }
  }

  // ==================== CATEGORIES ====================

  async createCategory(categoryData) {
    try {
      const category = new Category(categoryData);
      await category.save();
      return { success: true, category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllCategories() {
    try {
      return await Category.find().sort({ name: 1 });
    } catch (error) {
      console.error('Erreur getAllCategories:', error);
      return [];
    }
  }

  async getCategoryBySlug(slug) {
    try {
      return await Category.findOne({ slug });
    } catch (error) {
      console.error('Erreur getCategoryBySlug:', error);
      return null;
    }
  }

  async updateCategory(categoryId, updateData) {
    try {
      return await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
    } catch (error) {
      console.error('Erreur updateCategory:', error);
      return null;
    }
  }

  async deleteCategory(categoryId) {
    try {
      return await Category.findByIdAndDelete(categoryId);
    } catch (error) {
      console.error('Erreur deleteCategory:', error);
      return null;
    }
  }

  // ==================== FAVORITES ====================

  async addToFavorites(userId, productId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favorites: productId } },
        { new: true }
      ).populate('favorites');
    } catch (error) {
      console.error('Erreur addToFavorites:', error);
      return null;
    }
  }

  async removeFromFavorites(userId, productId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $pull: { favorites: productId } },
        { new: true }
      ).populate('favorites');
    } catch (error) {
      console.error('Erreur removeFromFavorites:', error);
      return null;
    }
  }

  async getFavorites(userId) {
    try {
      const user = await User.findById(userId).populate('favorites');
      return user.favorites || [];
    } catch (error) {
      console.error('Erreur getFavorites:', error);
      return [];
    }
  }

  // ==================== CART ====================

  async addToCart(userId, productId, quantity = 1) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $push: { cart: { productId, quantity } } },
        { new: true }
      ).populate('cart.productId');
    } catch (error) {
      console.error('Erreur addToCart:', error);
      return null;
    }
  }

  async removeFromCart(userId, productId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $pull: { cart: { productId } } },
        { new: true }
      ).populate('cart.productId');
    } catch (error) {
      console.error('Erreur removeFromCart:', error);
      return null;
    }
  }

  async getCart(userId) {
    try {
      const user = await User.findById(userId).populate('cart.productId');
      return user.cart || [];
    } catch (error) {
      console.error('Erreur getCart:', error);
      return [];
    }
  }

  async clearCart(userId) {
    try {
      return await User.findByIdAndUpdate(userId, { cart: [] }, { new: true });
    } catch (error) {
      console.error('Erreur clearCart:', error);
      return null;
    }
  }
}

module.exports = new MongoDBService();
