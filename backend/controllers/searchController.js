const Product = require("../models/product");
const Category = require("../models/category");
const Vendor = require("../models/vendors");

const search = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          categories: [],
          vendors: [],
        },
      });
    }

    const query = q.trim();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^${escapedQuery}`, "i");
    const containsRegex = new RegExp(escapedQuery, "i");

    if (type === "suggestions") {
      const [products, categories, vendors] = await Promise.all([
        Product.find({
          $or: [
            { name: prefixRegex },
            { name: containsRegex },
            { brand: containsRegex },
            { tags: containsRegex },
          ],
          status: "approved",
          isActive: true,
          isDeleted: false,
        })
          .select("name slug images price comparePrice brand")
          .populate("vendorStore", "storeName")
          .limit(10)
          .lean(),

        Category.find({
          $or: [
            { name: prefixRegex },
            { name: containsRegex },
          ],
        })
          .select("name slug _id")
          .limit(4)
          .lean(),

        Vendor.find({
          $or: [
            { storeName: prefixRegex },
            { storeName: containsRegex },
          ],
          approvalStatus: "approved",
          isDeleted: false,
        })
          .select("storeName storeLogo _id userId")
          .limit(4)
          .lean(),
      ]);

      const uniqueProducts = Array.from(
        new Map(products.map((p) => [p._id.toString(), p])).values()
      );

      const sortByRelevance = (arr, field) => {
        return arr.sort((a, b) => {
          const aStarts = a[field]?.toLowerCase().startsWith(query.toLowerCase());
          const bStarts = b[field]?.toLowerCase().startsWith(query.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        });
      };

      return res.status(200).json({
        success: true,
        data: {
          products: sortByRelevance(uniqueProducts, "name").slice(0, 6),
          categories: sortByRelevance(categories, "name"),
          vendors: sortByRelevance(vendors, "storeName"),
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "relevance";

    const filter = {
      $or: [
        { name: containsRegex },
        { description: containsRegex },
        { brand: containsRegex },
        { tags: containsRegex },
        { shortDescription: containsRegex },
      ],
      status: "approved",
      isActive: true,
      isDeleted: false,
    };

    const matchingCategories = await Category.find({
      name: containsRegex,
    }).select("_id");

    if (matchingCategories.length > 0) {
      filter.$or.push({
        category: { $in: matchingCategories.map((c) => c._id) },
      });
    }

    const matchingVendors = await Vendor.find({
      storeName: containsRegex,
      approvalStatus: "approved",
      isDeleted: false,
    }).select("userId");

    if (matchingVendors.length > 0) {
      filter.$or.push({
        vendor: { $in: matchingVendors.map((v) => v.userId) },
      });
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { averageRating: -1 };
    if (sort === "popular") sortOption = { totalSold: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("vendor", "firstName")
        .populate("vendorStore", "storeName")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query: query,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { search };