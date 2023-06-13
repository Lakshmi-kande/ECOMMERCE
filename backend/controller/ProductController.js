const Product = require("../models/ProductModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Features = require("../utils/Features");
const {constants} = require  ("../constants")

// create product
exports.createProduct = catchAsyncErrors(async(req,res)=>{
    const product = await Product.create(req.body);
    
    res.status(constants.SUCCESSFUL_POST).json({
        success: true,
        product
        
    });
});

// get All Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
    const resultPerPage = 8;
  
    const productsCount = await Product.countDocuments();
  
    const feature = new Features(Product.find(), req.query)
      .search()
      .filter()
      .pagination(resultPerPage);
    const products = await feature.query;
    res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      products,
      productsCount,
      resultPerPage,
    });
  });

// update Product
exports.updateProduct = async(req,res) => {
    let product = await Product.findById(req.params.id);
    if(!product){
        return res.status(constants.SERVER_ERROR).json({
            success: false,
            message: "Product is not found with this id"
        });
    }
    product = await Product.findById(req.params.id,req.body,{
        new: true,
        runValidators: true,
        useUnified: false
    });
    res.status(constants.SUCCESSFUL_REQUEST).json({
        success: true,
        product
    });
};

// delete Product
exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
  
    if (!product) {
        return next(new ErrorHandler("Product is not found with this id",  constants.NOT_FOUND));
    }
  
    await product.deleteOne();
  
    res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      message: "Product deleted successfully",
    });
};
  
// single Product details
exports.getSingleProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("Product is not found with this id", constants.NOT_FOUND));
    }
    res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      product,
    });
});
  
// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All reviews of a single product
exports.getSingleProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product is not found with this id", constants.NOT_FOUND));
  }

  res.status(constants.SUCCESSFUL_REQUEST).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review --Admin
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found with this id", constants.NOT_FOUND));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(constants.SUCCESSFUL_REQUEST).json({
    success: true,
  });
});



