import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CaseStudy = sequelize.define(
  "CaseStudy",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    code: DataTypes.STRING(100),

    tag: DataTypes.STRING(100),

    title: DataTypes.STRING(500),

    challenge: DataTypes.TEXT,

    solution: DataTypes.TEXT,

    execution: DataTypes.TEXT,

    results: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
    },

    graphic: {
      type: DataTypes.STRING(50),
      defaultValue: "rings",
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "awes_case_studies",
    timestamps: true,
  },
);

export default CaseStudy;
