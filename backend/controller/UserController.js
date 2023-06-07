const User = require("../models/UserModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const { constants } = require("../constants");

// RegisterUser
// eslint-disable-next-line no-unused-vars
exports.createUser = catchAsyncErrors(async (req,res,next)=>{
    const {name, email, password} = req.body;

    const user = await User.create({
        name,email,password,
        avatar:{
            public_id:"https://test.com",
            url:"https://test.com"
        }
    });
    sendToken(user, constants.SUCCESSFUL_REQUEST, res);
});

// login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return next(new ErrorHandler("Please enter the email & password", constants.VALIDATION_ERROR));
    }
  
    const user = await User.findOne({ email }).select("+password");
  
    if (!user) {
      return next(new ErrorHandler("User is not find with this email & password", constants.UNAUTHORIZED));
    }
    const isPasswordMatched = await user.comparePassword(password);
  
    if (!isPasswordMatched) {
      return next(
        new ErrorHandler("User is not find with this email & password", constants.UNAUTHORIZED)
      );
    }
  
    sendToken(user, constants.SUCCESSFUL_POST, res);
});

//  Log out user
// eslint-disable-next-line no-unused-vars
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  
    res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      message: "Log out success",
    });
});
  
