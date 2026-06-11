const User = require('../models/User');

const createInitialAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const email = process.env.INITIAL_ADMIN_EMAIL || 'spectrumgujranwala@gmail.com';
      const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin@123';

      const adminUser = await User.create({
        email: email,
        password: password,
        role: 'admin',
        designation: 'Senior Admin'
      });
      console.log(`Initial admin user created with email: ${email}`);
    }
  } catch (error) {
    console.error(`Error creating initial admin: ${error.message}`);
  }
};

module.exports = { createInitialAdmin };
