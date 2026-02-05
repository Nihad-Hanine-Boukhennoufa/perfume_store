// Error handler middleware

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack); 
  
  let statusCode = 500;
  let message = err.message || "Something went wrong";


  
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size is too large";
  }
  if (err.message === "Only images are allowed") {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
