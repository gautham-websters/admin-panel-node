export const getBlogs = async (req, res) => {
  res.json({
    success: true,
    message: "Public Blogs",
  });
};

export const getBlogBySlug = async (req, res) => {
  res.json({
    success: true,
    slug: req.params.slug,
  });
};
