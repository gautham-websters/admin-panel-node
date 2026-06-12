import Work from "../../models/Work.js";

export const getAllWorks = async (req, res, next) => {
  try {
    const works = await Work.findAll({
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

export const getWorkById = async (req, res, next) => {
  try {
    const work = await Work.findByPk(req.params.id);

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

export const createWork = async (req, res, next) => {
  try {
    const work = await Work.create(req.body);

    res.status(201).json({
      success: true,
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWork = async (req, res, next) => {
  try {
    const work = await Work.findByPk(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    await work.update(req.body);

    res.status(200).json({
      success: true,
      data: work,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWork = async (req, res, next) => {
  try {
    const work = await Work.findByPk(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    await work.destroy();

    res.status(200).json({
      success: true,
      message: "Work deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};