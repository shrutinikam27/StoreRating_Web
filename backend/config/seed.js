const bcrypt = require('bcryptjs');
const { User, Rating } = require('../models');

const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has users. Skipping seeding.');
      return;
    }

    console.log('Seeding database with default users and stores...');

    const salt = await bcrypt.genSalt(10);
    const hash = async (pwd) => await bcrypt.hash(pwd, salt);

    // Create Admin
    const admin = await User.create({
      name: 'System Administrator Account',
      email: 'admin@storerating.com',
      password: await hash('AdminPwd@123'),
      address: 'Global Admin Headquarters, Tech Street, City',
      role: 'admin'
    });

    // Create Normal User 1
    const user1 = await User.create({
      name: 'Johnathan Smith Doe Senior',
      email: 'user@storerating.com',
      password: await hash('UserPwd@123'),
      address: '123 Residential Area Avenue, Block 4, Flat 10',
      role: 'user'
    });

    // Create Normal User 2
    const user2 = await User.create({
      name: 'Alice Elizabeth Vance Cooper',
      email: 'alice@storerating.com',
      password: await hash('UserPwd@123'),
      address: '789 Residential Gardens, Sector 45, City',
      role: 'user'
    });

    // Create Store Owners (Stores)
    const store1 = await User.create({
      name: 'Gourmet Bakery and Cafe Shop',
      email: 'bakery@storerating.com',
      password: await hash('StorePwd@123'),
      address: '456 Sweet Street, Baker Valley, Sector 12',
      role: 'store_owner'
    });

    const store2 = await User.create({
      name: 'Mega Electronics and Gadget Store',
      email: 'electronics@storerating.com',
      password: await hash('StorePwd@123'),
      address: '789 Tech Boulevard, Cyber City, Phase 2',
      role: 'store_owner'
    });

    const store3 = await User.create({
      name: 'Fashion Hub Apparel and Footwear',
      email: 'fashion@storerating.com',
      password: await hash('StorePwd@123'),
      address: '101 Style Road, Couture Lane, Sector 5',
      role: 'store_owner'
    });

    // Create some initial ratings
    // User 1 rates Bakery: 5
    await Rating.create({
      userId: user1.id,
      storeId: store1.id,
      rating: 5
    });

    // User 2 rates Bakery: 4
    await Rating.create({
      userId: user2.id,
      storeId: store1.id,
      rating: 4
    });

    // User 1 rates Electronics: 4
    await Rating.create({
      userId: user1.id,
      storeId: store2.id,
      rating: 4
    });

    // User 2 rates Electronics: 2
    await Rating.create({
      userId: user2.id,
      storeId: store2.id,
      rating: 2
    });

    // User 2 rates Fashion: 5
    await Rating.create({
      userId: user2.id,
      storeId: store3.id,
      rating: 5
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
