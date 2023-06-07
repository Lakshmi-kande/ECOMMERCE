const { constants } = require("../constants");
const ErrorHandler = require("../utils/ErrorHandler");

// eslint-disable-next-line no-unused-vars
module.exports = (err,req,res,next) =>{
    err.statusCode = err.statusCode || constants.SERVER_ERROR
    err.message = err.message || "Interval server error"

    // wrong mongodb id error
    if(err.name === "CastError"){
        const message = `Resources not found with this id..Invalid ${err.path}`;
        err = new ErrorHandler(message, constants.VALIDATION_ERROR);
    }
  

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}
