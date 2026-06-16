export const createCrudController = (Model) => ({
  async getAll(req, res, next) {
    try {
      const items = await Model.findAll({
        order: [["order", "ASC"]],
      });

      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const item = await Model.findByPk(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: "Not found",
        });
      }

      await item.update(req.body);

      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const item = await Model.findByPk(req.params.id);

      if (!item) {
        return res.sendStatus(404);
      }

      await item.destroy();

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },
});
