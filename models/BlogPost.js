import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { deleteFileIfExists } from "../utils/deleteFile.js";

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

    shortDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    publishedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "awes_blog_posts",
    timestamps: true,
  },
);

BlogPost.addHook("beforeDestroy", async (blog) => {
  await deleteFileIfExists(blog.image);
});

BlogPost.addHook("beforeUpdate", async (blog) => {
  if (blog.changed("image") && blog.previous("image")) {
    await deleteFileIfExists(blog.previous("image"));
  }
});

export default BlogPost;
