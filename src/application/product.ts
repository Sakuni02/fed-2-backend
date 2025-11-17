import Product from "../infrastructure/db/entities/Product";
import Category from "../infrastructure/db/entities/Category";

import Color from "../infrastructure/db/entities/Color";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";

import { Request, Response, NextFunction } from "express";
import { CreateProductDTO } from "../domain/dto/product";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import S3 from "../infrastructure/s3";

const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.query.categoryId;
    if (categoryId) {
      const products = await Product.find({ categoryId });
      res.json(products);
    } else {
      const products = await Product.find();
      res.json(products);
    }
  } catch (error) {
    next(error);
  }
};

const getProductsForSearchQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;
    const results = await Product.aggregate([
      {
        $search: {
          index: "default",
          autocomplete: {
            path: "name",
            query: search,
            tokenOrder: "any",
            fuzzy: {
              maxEdits: 1,
              prefixLength: 2,
              maxExpansions: 256,
            },
          },
          highlight: {
            path: "name",
          },
        },
      },
    ]);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = CreateProductDTO.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.message);
    }

    await Product.create(result.data);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
};

const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findById(req.params.id).populate("reviews");
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const updateProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;
    const { fileType } = body;

    const id = randomUUID();

    const url = await getSignedUrl(
      S3,
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: id,
        ContentType: fileType,
      }),
      {
        expiresIn: 60,
      }
    );

    res.status(200).json({
      url,
      publicURL: `${process.env.CLOUDFLARE_PUBLIC_DOMAIN}/${id}`,
    });
  } catch (error) {
    next(error);
  }
};

const getShopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get category slug from URL params
    const categorySlugRaw = req.params.slug;
    let categorySlug: string | undefined;
    if (typeof categorySlugRaw === "string") {
      categorySlug = categorySlugRaw.toLowerCase();
    }

    const { color, sort, page = "1", limit = "24" } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit as string, 10) || 24, 1), 100);
    const skip = (pageNum - 1) * perPage;

    // Build filter
    const filter: any = {};


    // Fix: find category by slug → get _id
    if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug.toString().toLowerCase() });
      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      } else {
        return res.json({ products: [], pagination: { total: 0, page: 1, perPage: 24, totalPages: 0 } });
      }
    }

    // Fix: resolve color slug → _id
    if (color) {
      const colorDoc = await Color.findOne({ slug: color.toString().toLowerCase() });
      if (colorDoc) {
        filter.colorId = colorDoc._id;
      }
    }

    // Sorting
    let sortOption: any = {};
    if (sort === "price_asc") sortOption.price = 1;
    else if (sort === "price_desc") sortOption.price = -1;
    else sortOption.createdAt = -1; // default newest first

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("colorId")
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
};


export {
  createProduct,
  deleteProductById,
  getAllProducts,
  getProductById,
  updateProductById,
  getProductsForSearchQuery,
  uploadProductImage,
  getShopProducts,
};