export const getAllBlogs = async (req, res) => {
  res.json({
    success: true,
    message: "Admin Get All Blogs",
  });
};

export const getBlogById = async (req, res) => {
  res.json({
    success: true,
    id: req.params.id,
  });
};

export const createBlog = async (req, res) => {
  res.json({
    success: true,
    body: req.body,
  });
};

export const updateBlog = async (req, res) => {
  res.json({
    success: true,
  });
};

export const deleteBlog = async (req, res) => {
  res.json({
    success: true,
  });
};
