import Blog from "../../models/Blog.js";

export const getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.findAll({
      where: {
        status: "published",
      },
      order: [["publishedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      where: {
        slug: req.params.slug,
        status: "published",
      },
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};