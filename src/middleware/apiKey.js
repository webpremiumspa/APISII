module.exports = function apiKey(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'API_KEY no configurada en el servidor' }
    });
  }
  const provided = req.header('X-API-Key');
  if (!provided || provided !== expected) {
    return res.status(401).json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'API key inválida o ausente' }
    });
  }
  next();
};
