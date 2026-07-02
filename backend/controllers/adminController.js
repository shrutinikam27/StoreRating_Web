const { User, Rating } = require('../models');
const { Sequelize, Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStores = await User.count({ where: { role: 'store_owner' } });
    const totalNormalUsers = await User.count({ where: { role: 'user' } });
    const totalAdminUsers = await User.count({ where: { role: 'admin' } });
    const totalRatings = await Rating.count();

    res.json({
      totalUsers: totalNormalUsers + totalAdminUsers,
      totalStores,
      totalRatings,
      breakdown: {
        admin: totalAdminUsers,
        user: totalNormalUsers,
        store_owner: totalStores
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard stats.' });
  }
};

// Create a new user (admin, normal user, or store owner)
const createUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!role || !['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      role
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Admin Create User Error:', error);
    res.status(500).json({ error: 'Server error creating user.' });
  }
};

// List all stores
const getStores = async (req, res) => {
  try {
    const { name, email, address, search, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    const whereClause = { role: 'store_owner' };

    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    if (email) {
      whereClause.email = { [Op.like]: `%${email}%` };
    }
    if (address) {
      whereClause.address = { [Op.like]: `%${address}%` };
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const validSortFields = ['name', 'email', 'address', 'rating'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    // We fetch stores and calculate their average rating using a subquery
    const stores = await User.findAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'email', 'address', 'role', 'createdAt',
        [
          Sequelize.literal(`(
            SELECT COALESCE(AVG(rating), 0)
            FROM Ratings AS rating
            WHERE rating.storeId = User.id
          )`),
          'rating'
        ]
      ],
      order: actualSortBy === 'rating' 
        ? [[Sequelize.literal('rating'), actualSortOrder]]
        : [[actualSortBy, actualSortOrder]]
    });

    res.json(stores);
  } catch (error) {
    console.error('Get Stores Error:', error);
    res.status(500).json({ error: 'Server error listing stores.' });
  }
};

// List normal and admin users (can be filtered by Name, Email, Address, Role)
const getUsers = async (req, res) => {
  try {
    const { name, email, address, role, search, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    const whereClause = {};
    
    if (role) {
      whereClause.role = role;
    } else {
      whereClause.role = { [Op.in]: ['admin', 'user'] };
    }

    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    if (email) {
      whereClause.email = { [Op.like]: `%${email}%` };
    }
    if (address) {
      whereClause.address = { [Op.like]: `%${address}%` };
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const validSortFields = ['name', 'email', 'address', 'role', 'createdAt'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [[actualSortBy, actualSortOrder]]
    });

    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ error: 'Server error listing users.' });
  }
};

// Get details of a single user (includes rating if Store Owner)
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userJson = user.toJSON();

    if (user.role === 'store_owner') {
      const avgRatingResult = await Rating.findOne({
        where: { storeId: id },
        attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating']],
        raw: true
      });
      
      userJson.rating = avgRatingResult && avgRatingResult.averageRating 
        ? parseFloat(parseFloat(avgRatingResult.averageRating).toFixed(2)) 
        : 0;
        
      const ratings = await Rating.findAll({
        where: { storeId: id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'address']
        }],
        order: [['createdAt', 'DESC']]
      });
      userJson.submittedRatings = ratings;
    }

    res.json(userJson);
  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({ error: 'Server error retrieving user details.' });
  }
};

module.exports = {
  getDashboardStats,
  createUser,
  getStores,
  getUsers,
  getUserDetails
};
