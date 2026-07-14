const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const error = (res, message = 'An error occurred', statusCode = 500, data = null) => {
  const response = {
    success: false,
    message,
  };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  error
};
