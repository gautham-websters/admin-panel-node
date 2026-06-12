import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Work = sequelize.define(
  "Work",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    client: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    year: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    image: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    imageAltText: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "draft",
    },
  },
  {
    tableName: "works",
    timestamps: true,
  },
);

export default Work;
