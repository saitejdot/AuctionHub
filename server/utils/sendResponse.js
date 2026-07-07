/**
 * Standard API response helper.
 * All controllers must use this function — no exceptions.
 */
const sendResponse = (res, statusCode, message, data = null, pagination = null) => {
  const payload = {
    success: statusCode < 400,
    message,
  };

  if (data !== null) {
    payload.data = data;
  }

  if (pagination !== null) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

module.exports = sendResponse;
