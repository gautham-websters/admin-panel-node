import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = {
      username,
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out",
  });
};

export const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
