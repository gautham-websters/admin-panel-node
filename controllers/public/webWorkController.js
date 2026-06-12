import Work from "../../models/Work.js";

export const getWorks = async (req, res, next) => {
  try {
    const works = await Work.findAll({
      where: {
        status: "published",
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: works,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkBySlug = async (req, res, next) => {
  try {
    const work = await Work.findOne({
      where: {
        slug: req.params.slug,
        status: "published",
      },
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    res.status(200).json({
      success: true,
      data: work,
    });
  } catch (error) {
    next(error);
  }
};