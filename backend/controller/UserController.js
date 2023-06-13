const User = require("../models/UserModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const { constants } = require("../constants");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");

// RegisterUser
exports.createUser = catchAsyncErrors(async (req,res)=>{
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
exports.logoutUser = catchAsyncErrors(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  
  res.status(constants.SUCCESSFUL_REQUEST).json({
    success: true,
    message: "Log out success",
  });
});
  
// Forgot password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", constants.NOT_FOUND));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetToken();

  await user.save({
    validateBeforeSave: false,
  });

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl}`;

  try {
    await sendMail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(new ErrorHandler(error.message, constants.SERVER_ERROR));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Create Token hash

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTime: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Reset password url is invalid or has been expired", constants.VALIDATION_ERROR)
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password is not matched with the new password", constants.VALIDATION_ERROR)
    );
  }

  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordTime = undefined;

  await user.save();

  sendToken(user, constants.SUCCESSFUL_REQUEST, res);
});

//  Get user Details
exports.userDetails = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(constants.SUCCESSFUL_REQUEST).json({
    success: true,
    user,
  });
});

// Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
   
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(
        new ErrorHandler("Old Password is incorrect", constants.VALIDATION_ERROR)
      );
    }

    if(req.body.newPassword  !== req.body.confirmPassword){
        return next(
            new ErrorHandler("Password not matched with each other", constants.VALIDATION_ERROR)
          );
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user,constants.SUCCESSFUL_REQUEST,res);
});

// Update User Profile
exports.updateProfile = catchAsyncErrors(async(req,res) =>{
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  res.status(constants.SUCCESSFUL_REQUEST).json({
    success:true,
    user, 
  })

});

// Get All users ---Admin
exports.getAllUsers = catchAsyncErrors(async (req,res) =>{
    const users = await User.find();

    res.status(constants.SUCCESSFUL_REQUEST).json({
        success: true,
        users,
    });
});

// Get Single User Details ---Admin
exports.getSingleUser = catchAsyncErrors(async (req,res,next) =>{
    const user = await User.findById(req.params.id);
   
    if(!user){
        return next(new ErrorHandler("User is not found with this id",constants.VALIDATION_ERROR));
    }

    res.status(constants.SUCCESSFUL_REQUEST).json({
        success: true,
        user,
    });
});

// Change user Role --Admin
exports.updateUserRole = catchAsyncErrors(async(req,res) =>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };
    const user = await User.findByIdAndUpdate(req.params.id,newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(constants.SUCCESSFUL_REQUEST).json({
        success: true,
        user
    })
});

// Delete User ---Admin
exports.deleteUser = catchAsyncErrors(async(req,res,next) =>{
  const user = await User.findById(req.params.id);
  if(!user){
      return next(new ErrorHandler("User is not found with this id",constants.VALIDATION_ERROR));
  }

  await user.deleteOne();

  res.status(constants.SUCCESSFUL_REQUEST).json({
      success: true,
      message:"User deleted successfully"
  })
});