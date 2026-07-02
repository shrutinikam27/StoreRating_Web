const { User, Rating } = require('../models');
const { Sequelize, Op } = require('sequelize');

// List stores for normal user (includes overall avg rating and current user's rating)
const listStores = async (req, res) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    const userId = req.user.id;

    const whereClause = { role: 'store_owner' };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const validSortFields = ['name', 'address', 'rating'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    const stores = await User.findAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'email', 'address',
        [
          Sequelize.literal(`(
            SELECT COALESCE(AVG(rating), 0)
            FROM Ratings AS rating
            WHERE rating.storeId = User.id
          )`),
          'rating'
        ],
        [
          Sequelize.literal(`(
            SELECT rating
            FROM Ratings AS rating
            WHERE rating.storeId = User.id AND rating.userId = ${userId}
            LIMIT 1
          )`),
          'userRating'
        ]
      ],
      order: actualSortBy === 'rating'
        ? [[Sequelize.literal('rating'), actualSortOrder]]
        : [[actualSortBy, actualSortOrder]]
    });

    res.json(stores);
  } catch (error) {
    console.error('List Stores Error:', error);
    res.status(500).json({ error: 'Server error listing stores.' });
  }
};

// Submit rating for a store (normal users only)
const submitRating = async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user.id;

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Check if store exists
    const store = await User.findOne({ where: { id: storeId, role: 'store_owner' } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ where: { userId, storeId } });
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this store. Please modify your rating instead.' });
    }

    const newRating = await Rating.create({
      userId,
      storeId,
      rating: ratingVal
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error('Submit Rating Error:', error);
    res.status(500).json({ error: 'Server error submitting rating.' });
  }
};

// Modify rating for a store (normal users only)
const modifyRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const existingRating = await Rating.findOne({ where: { userId, storeId } });
    if (!existingRating) {
      return res.status(404).json({ error: 'Rating not found. Please submit a rating first.' });
    }

    existingRating.rating = ratingVal;
    await existingRating.save();

    res.json(existingRating);
  } catch (error) {
    console.error('Modify Rating Error:', error);
    res.status(500).json({ error: 'Server error modifying rating.' });
  }
};

// Get Store Owner dashboard (stats + user ratings list)
const getOwnerDashboard = async (req, res) => {
  try {
    const storeId = req.user.id;
    const { sortBy = 'name', sortOrder = 'ASC' } = req.query;

    // Fetch average rating
    const avgRatingResult = await Rating.findOne({
      where: { storeId },
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating']],
      raw: true
    });
    
    const averageRating = avgRatingResult && avgRatingResult.averageRating
      ? parseFloat(parseFloat(avgRatingResult.averageRating).toFixed(2))
      : 0;

    // Sort configurations
    let orderClause = [];
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    if (sortBy === 'rating') {
      orderClause = [['rating', actualSortOrder]];
    } else if (sortBy === 'date') {
      orderClause = [['createdAt', actualSortOrder]];
    } else if (sortBy === 'name') {
      orderClause = [{ model: User, as: 'user' }, 'name', actualSortOrder];
    } else if (sortBy === 'email') {
      orderClause = [{ model: User, as: 'user' }, 'email', actualSortOrder];
    } else {
      orderClause = [{ model: User, as: 'user' }, 'name', 'ASC'];
    }

    // Fetch ratings list with user details
    const ratings = await Rating.findAll({
      where: { storeId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'address']
      }],
      order: orderClause
    });

    res.json({
      averageRating,
      ratings
    });
  } catch (error) {
    console.error('Owner Dashboard Error:', error);
    res.status(500).json({ error: 'Server error fetching owner dashboard details.' });
  }
};

module.exports = {
  listStores,
  submitRating,
  modifyRating,
  getOwnerDashboard
};
