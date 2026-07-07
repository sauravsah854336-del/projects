const {
  createCategory: createCategoryInDB,
  getCategoryById,
  getCategoryBySlug,
  getCategoriesByParent,
  getAllCategories: getAllCategoriesFromDB,
  getRootCategories,
  updateCategory: updateCategoryInDB,
  deleteCategory: deleteCategoryFromDB,
  findCategoryBySlugAndParent,
} = require("../models/dynamodb/categoryModel");
const { getAllProducts } = require("../models/dynamodb/productModel");

const createCategory = async (req, res) => {
  try {
    const { name, description, parent, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const existCategory = await findCategoryBySlugAndParent(slug, parent || "");

    if (existCategory) {
      if (existCategory.isActive === false) {
        const restored = await updateCategoryInDB(existCategory._id, {
          isActive: true,
          name: trimmedName,
          description: description || existCategory.description,
          image: image || existCategory.image,
        });

        return res.status(200).json({
          success: true,
          message: "Category restored successfully",
          data: restored,
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
      const parentCategory = await getCategoryById(parent);
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: "Parent category not found" });
      }
      if (parentCategory.parent) {
        return res.status(400).json({ success: false, message: "Only 2-level hierarchy allowed" });
      }
    }

    const category = await createCategoryInDB({
      name: trimmedName,
      slug,
      description: description || "",
      image: image || "",
      parent: parent || "",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: parent ? "Subcategory created successfully" : "Category created successfully",
      data: category,
    });
  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const categories = await getAllCategoriesFromDB(includeInactive === "true");

    const populated = categories.map((cat) => {
      if (cat.parent) {
        const parentCat = categories.find((c) => c._id === cat.parent);
        if (parentCat) {
          return { ...cat, parent: { _id: parentCat._id, name: parentCat.name, slug: parentCat.slug } };
        }
      }
      return cat;
    });

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("getAllCategories error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCategoryTree = async (req, res) => {
  try {
    const rootCategories = await getRootCategories();
    const productResult = await getAllProducts({
      status: "approved",
      isActive: true,
      page: 1,
      limit: 10000,
    });

    const allProducts = productResult.items || [];
    const tree = [];

    for (const category of rootCategories) {
      const children = await getCategoriesByParent(category._id);
      const categoryIds = [String(category._id), ...children.map((c) => String(c._id))];

      const productCount = allProducts.filter((p) => {
        const catId = String(p.category?._id || p.category?.categoryId || p.category || p.categoryId || "");
        return categoryIds.includes(catId);
      }).length;

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
          productCount: allProducts.filter((p) => {
            const catId = String(p.category?._id || p.category?.categoryId || p.category || p.categoryId || "");
            return catId === String(c._id);
          }).length,
        })),
      });
    }

    return res.status(200).json({ success: true, data: tree });
  } catch (err) {
    console.error("getCategoryTree error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSingleCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await getCategoryBySlug(slug);

    if (!category || !category.isActive) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.parent) {
      const parentData = await getCategoryById(category.parent);
      if (parentData) {
        category.parent = { _id: parentData._id, name: parentData.name, slug: parentData.slug };
      }
    }

    const subcategories = await getCategoriesByParent(String(category._id));

    return res.status(200).json({
      success: true,
      data: { category, subcategories },
    });
  } catch (err) {
    console.error("getSingleCategory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent, image, isActive } = req.body;

    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const updates = {};

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const parentId = parent !== undefined ? (parent || "") : (category.parent || "");
      const existCategory = await findCategoryBySlugAndParent(slug, parentId);

      if (existCategory && existCategory._id !== id) {
        return res.status(409).json({ success: false, message: "Category with this name already exists" });
      }

      updates.name = trimmedName;
      updates.slug = slug;
    }

    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (isActive !== undefined) updates.isActive = isActive;

    if (parent !== undefined) {
      if (parent === id) {
        return res.status(400).json({ success: false, message: "Category cannot be its own parent" });
      }
      if (parent) {
        const parentCategory = await getCategoryById(parent);
        if (!parentCategory) {
          return res.status(404).json({ success: false, message: "Parent category not found" });
        }
        if (parentCategory.parent) {
          return res.status(400).json({ success: false, message: "Only 2-level hierarchy allowed" });
        }
      }
      updates.parent = parent || "";
    }

    const updated = await updateCategoryInDB(id, updates);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const children = await getCategoriesByParent(id);
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: This category has active subcategories.",
      });
    }

    const productResult = await getAllProducts({
      status: "approved",
      isActive: true,
      page: 1,
      limit: 10000,
    });

    const hasProducts = (productResult.items || []).some((p) => {
      const catId = String(p.category?._id || p.category?.categoryId || p.category || p.categoryId || "");
      return catId === String(id);
    });

    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: Products exist in this category.",
      });
    }

    await deleteCategoryFromDB(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted permanently",
    });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const updated = await updateCategoryInDB(id, { isActive: true });

    return res.status(200).json({
      success: true,
      message: "Category restored successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const allCategories = await getAllCategoriesFromDB(true);

    const totalMainCategories = allCategories.filter(
      (c) => (!c.parent || c.parent === "") && c.isActive
    ).length;

    const totalSubcategories = allCategories.filter(
      (c) => c.parent && c.parent !== "" && c.isActive
    ).length;

    const inactiveCategories = allCategories.filter((c) => !c.isActive).length;

    const productResult = await getAllProducts({
      status: "approved",
      isActive: true,
      page: 1,
      limit: 10000,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalMainCategories,
        totalSubcategories,
        inactiveCategories,
        totalProducts: productResult.total,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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