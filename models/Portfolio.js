import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PortfolioProject = sequelize.define(
  "PortfolioProject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "portfolio_projects",
    timestamps: true,
  },
);

export default PortfolioProject;
