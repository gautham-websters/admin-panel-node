import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { deleteFileIfExists } from "../utils/deleteFile.js";

BlogPost.addHook(
  "beforeDestroy",
  async (blog) => {
    await deleteFileIfExists(blog.image);
  }
);

BlogPost.addHook(
  "beforeUpdate",
  async (blog) => {
    if (
      blog.changed("image") &&
      blog.previous("image")
    ) {
      await deleteFileIfExists(
        blog.previous("image")
      );
    }
  }
);

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

    imageAltText: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
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
    tableName: "awes_blog_posts",
    timestamps: true,
  },
);

export default BlogPost;
