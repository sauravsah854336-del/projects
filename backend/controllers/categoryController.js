const Product = require("../models/product");
const Category = require("../models/category");

const createCategory = async (req, res) => {
  try {
    const { name, description, parent, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existCategory = await Category.findOne({
      slug,
      parent: parent || null,
    });

    if (existCategory) {
      if (existCategory.isActive === false) {
        existCategory.isActive = true;
        existCategory.name = trimmedName;
        existCategory.description = description || existCategory.description;
        existCategory.image = image || existCategory.image;
        await existCategory.save();

        return res.status(200).json({
          success: true,
          message: "Category restored successfully",
          data: existCategory,
        });
      }

      return res.status(409).json({
        success: false,
        message: parent
          ? "Subcategory with this name already exists in this parent"
          : "Category with this name already exists",
      });
    }

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
      if (parentCategory.parent) {
        return res.status(400).json({
          success: false,
          message: "Only 2-level hierarchy allowed (max: category > subcategory)",
        });
      }
    }

    const category = await Category.create({
      name: trimmedName,
      slug,
      description: description || "",
      image: image || "",
      parent: parent || null,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: parent
        ? "Subcategory created successfully"
        : "Category created successfully",
      data: category,
    });
  } catch (err) {
    console.error("createCategory error:", err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .populate("parent", "name slug")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      parent: null,
    }).sort({ createdAt: 1 });

    const tree = [];

    for (const category of categories) {
      const children = await Category.find({
        parent: category._id,
        isActive: true,
      }).sort({ createdAt: 1 });

      const productCount = await Product.countDocuments({
        category: {
          $in: [category._id, ...children.map((c) => c._id)],
        },
        isActive: true,
        isDeleted: { $ne: true },
      });

      tree.push({
        _id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        createdAt: category.createdAt,
        productCount,
        children: children.map((c) => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          createdAt: c.createdAt,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      data: tree,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getSingleCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true }).populate(
      "parent",
      "name slug"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories = await Category.find({
      parent: category._id,
      isActive: true,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: { category, subcategories },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent, image, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existCategory = await Category.findOne({
        slug,
        parent: parent !== undefined ? parent || null : category.parent,
        _id: { $ne: id },
      });

      if (existCategory) {
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      category.name = trimmedName;
      category.slug = slug;
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    if (parent !== undefined) {
      if (parent === id) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent",
        });
      }
      if (parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message: "Parent category not found",
          });
        }
        if (parentCategory.parent) {
          return res.status(400).json({
            success: false,
            message: "Only 2-level hierarchy allowed",
          });
        }
      }
      category.parent = parent || null;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const activeChildren = await Category.findOne({
      parent: id,
      isActive: true,
    });
    if (activeChildren) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete: This category has active subcategories. Delete subcategories first.",
      });
    }

    const hasProducts = await Product.findOne({
      category: id,
      isDeleted: { $ne: true },
    });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete: Products exist in this category. Delete or move products first.",
      });
    }

    await Category.deleteMany({ parent: id });
    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted permanently",
    });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = true;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category restored successfully",
      data: category,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const [
      totalMainCategories,
      totalSubcategories,
      inactiveCategories,
      totalProducts,
    ] = await Promise.all([
      Category.countDocuments({ parent: null, isActive: true }),
      Category.countDocuments({ parent: { $ne: null }, isActive: true }),
      Category.countDocuments({ isActive: false }),
      Product.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalMainCategories,
        totalSubcategories,
        inactiveCategories,
        totalProducts,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  getCategoryStats,
};