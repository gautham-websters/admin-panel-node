import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BlogPost = sequelize.define(
  "BlogPost",
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

    link: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "blog_posts",
    timestamps: true,
  },
);

export default BlogPost;
