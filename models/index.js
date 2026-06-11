import sequelize from "../config/database.js";

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log("Database connected");
  } catch (error) {
    console.error(error);
  }
};

export default initializeDatabase;
