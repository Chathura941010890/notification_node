const jwt = require('jsonwebtoken');
const { checkAccess } = require('../controllers/auth.controller');
const { error } = require('winston');

async function authenticateToken(req, res, next) {

  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }


    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {

      if (req.body.pathname === "/unauthorized") {
        return res.status(200).json({ message: 'Success' });
      }

      if (user) {
        let accessOk = await checkAccess(user.userId, req.body.pathname)

        if (!accessOk) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      }

      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      else {
        return res.status(200).json({ message: 'Success' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error(`Authenticate function error: ${error}`);
  }
}



module.exports = authenticateToken;
