const { verifyToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/errorHandler');
const UserModel = require('../models/userModel');

const protect = (req, res, next) => {
  try {
    // Get token from header
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized to access this route', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = UserModel.findById(decoded.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach user to request object (without password)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

const optionalProtect = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = UserModel.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

module.exports = { protect, optionalProtect, authorize };
