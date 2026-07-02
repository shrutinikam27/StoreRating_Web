const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 8 || password.length > 16) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  return hasUppercase && hasSpecial;
};

const validateName = (name) => {
  return name && name.trim().length >= 20 && name.trim().length <= 60;
};

const validateAddress = (address) => {
  return address !== undefined && address !== null && address.trim().length > 0 && address.trim().length <= 400;
};

const validateRegistration = (req, res, next) => {
  const { name, email, password, address } = req.body;

  if (!validateName(name)) {
    return res.status(400).json({ error: 'Name must be between 20 and 60 characters.' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email must follow standard email validation rules.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be 8-16 characters, must include at least one uppercase letter and one special character.' 
    });
  }

  if (!validateAddress(address)) {
    return res.status(400).json({ error: 'Address must be provided and cannot exceed 400 characters.' });
  }

  next();
};

const validatePasswordUpdate = (req, res, next) => {
  const { password } = req.body;

  if (!validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be 8-16 characters, must include at least one uppercase letter and one special character.' 
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateAddress,
  validateRegistration,
  validatePasswordUpdate
};
