import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Blog = sequelize.define(
  "Blog",
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
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    excerpt: {
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

    cover: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    tags: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },

    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    publishedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    readingMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    contentHtml: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "draft",
    },
  },
  {
    tableName: "blogs",
    timestamps: true,
  },
);

export default Blog;
