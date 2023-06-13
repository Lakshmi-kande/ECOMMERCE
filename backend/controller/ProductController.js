const Product = require("../models/ProductModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Features = require("../utils/Features");
const {constants} = require  ("../constants")

// create product
// eslint-disable-next-line no-unused-vars
exports.createProduct = catchAsyncErrors(async(req,res, next)=>{
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
  


