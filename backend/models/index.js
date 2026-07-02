const User = require('./User');
const Rating = require('./Rating');

// A Normal User submits many ratings
User.hasMany(Rating, { foreignKey: 'userId', as: 'submittedRatings', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// A Store (store owner user) receives many ratings
User.hasMany(Rating, { foreignKey: 'storeId', as: 'receivedRatings', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'storeId', as: 'store' });

module.exports = {
  User,
  Rating
};
