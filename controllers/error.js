
exports.error = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "404 - Not Found",
  });
};
