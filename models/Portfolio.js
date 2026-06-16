import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { deleteFileIfExists } from "../utils/deleteFile.js";

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

    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    // imageAltText: {
    //   type: DataTypes.STRING(500),
    //   allowNull: false,
    //   defaultValue: "",
    // },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "awes_portfolio_projects",
    timestamps: true,
  },
);

PortfolioProject.addHook("beforeDestroy", async (portfolio) => {
  await deleteFileIfExists(portfolio.image);
});

PortfolioProject.addHook("beforeUpdate", async (portfolio) => {
  if (portfolio.changed("image") && portfolio.previous("image")) {
    await deleteFileIfExists(portfolio.previous("image"));
  }
});

export default PortfolioProject;
