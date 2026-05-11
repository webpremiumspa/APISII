function ok(data) {
  return { data, error: null };
}

function fail(code, message, status = 500) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

module.exports = { ok, fail };
