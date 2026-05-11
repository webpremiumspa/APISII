function parseRut(input) {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim().replace(/\./g, '').replace(/\s/g, '');
  if (!raw) return null;

  let body;
  let dv = null;
  if (raw.includes('-')) {
    const parts = raw.split('-');
    if (parts.length !== 2) return null;
    body = parts[0];
    dv = parts[1].toUpperCase();
  } else {
    body = raw;
  }

  if (!/^\d+$/.test(body)) return null;
  if (dv !== null && !/^[0-9K]$/.test(dv)) return null;

  return { rut: body, dv };
}

module.exports = { parseRut };
