import BlogPost from "../../models/BlogPost.js";
import { createCrudController } from "../../utils/crudController.js";

export default createCrudController(BlogPost);
