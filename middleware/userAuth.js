const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

const userAuth = async (req, res, next) => {
  const token = req.header("x-access-token");
  if (!token) {
    return res.status(403).json({ message: "Authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = userAuth;
