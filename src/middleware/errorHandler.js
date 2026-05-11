module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL';
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    data: null,
    error: { code, message }
  });
};
