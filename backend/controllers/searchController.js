const { getAllProducts } = require("../models/dynamodb/productModel");
const { getAllCategories } = require("../models/dynamodb/categoryModel");
const { getAllVendors } = require("../models/dynamodb/vendorModel");

const search = async (req, res) => {
  try {
    const { q, type, category } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: { products: [], categories: [], vendors: [] },
      });
    }

    const query = q.trim().toLowerCase();
    let categoryContext = null;
    let categoryIds = [];

    if (category && category !== "all") {
      const allCategories = await getAllCategories();
      const foundCategory = allCategories.find(
        (c) => c._id === category || c.slug === category
      );

      if (foundCategory) {
        categoryContext = {
          _id: foundCategory._id,
          name: foundCategory.name,
          slug: foundCategory.slug,
        };

        const subcategories = allCategories.filter((c) => c.parent === foundCategory._id);
        categoryIds = [foundCategory._id, ...subcategories.map((s) => s._id)];
      }
    }

    if (type === "suggestions") {
      const productResult = await getAllProducts({
        status: "approved",
        isActive: true,
        search: query,
        page: 1,
        limit: 100,
      });

      let products = productResult.items;

      if (categoryIds.length > 0) {
        products = products.filter((p) => {
          const catId = p.category?._id || p.category;
          return categoryIds.includes(catId);
        });
      }

      const allCategories = await getAllCategories();
      let matchedCategories = allCategories.filter((c) =>
        c.name.toLowerCase().includes(query)
      );

      if (categoryContext) {
        matchedCategories = matchedCategories.filter(
          (c) => c._id === categoryContext._id || c.parent === categoryContext._id
        );
      }

      const vendorResult = await getAllVendors({ status: "approved" });
      let matchedVendors = (vendorResult.items || []).filter((v) =>
        v.storeName.toLowerCase().includes(query)
      );

      const sortByRelevance = (arr, field) => {
        return arr.sort((a, b) => {
          const aStarts = a[field]?.toLowerCase().startsWith(query);
          const bStarts = b[field]?.toLowerCase().startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        });
      };

      return res.status(200).json({
        success: true,
        data: {
          products: sortByRelevance(products, "name").slice(0, 6).map((p) => ({
            _id: p._id,
            name: p.name,
            slug: p.slug,
            images: p.images,
            price: p.price,
            comparePrice: p.comparePrice,
            brand: p.brand,
            category: p.category,
            vendorStore: p.vendorStore ? { storeName: p.vendorStore.storeName || p.vendorStore } : null,
          })),
          categories: sortByRelevance(matchedCategories, "name").slice(0, 6).map((c) => ({
            _id: c._id,
            name: c.name,
            slug: c.slug,
            parent: c.parent || null,
          })),
          vendors: sortByRelevance(matchedVendors, "storeName").slice(0, 4).map((v) => ({
            _id: v._id,
            storeName: v.storeName,
            storeLogo: v.storeLogo,
            userId: v.userId,
          })),
          context: categoryContext,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sort = req.query.sort || "newest";

    const filters = {
      status: "approved",
      isActive: true,
      search: query,
      sort,
      page,
      limit,
    };

    if (categoryIds.length > 0) {
      filters.categoryIds = categoryIds;
    }

    const result = await getAllProducts(filters);

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
      query: q.trim(),
      context: categoryContext,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { search };