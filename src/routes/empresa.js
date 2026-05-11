const express = require('express');
const pool = require('../db');
const { parseRut } = require('../utils/rut');
const { ok, fail } = require('../utils/response');

const router = express.Router();

const COLS_ACTIVIDADES = 'id, rut, dv, codigo_actividad, desc_actividad_economica, fecha, afecta_a_iva, categoria_tributaria';
const COLS_DIRECCION = 'id, rut, dv, vigencia, fecha, tipo_direccion, calle, numero, bloque, departamento, villa_poblacion, ciudad, comuna, region';
const COLS_NOMBRES = 'rut, dv, cod_subtipo, razon_social, fecha_inicio_vig, fecha_tg_vig';

function getRutOrFail(req) {
  const parsed = parseRut(req.params.rut);
  if (!parsed) {
    throw fail('INVALID_RUT', 'Formato de RUT inválido', 400);
  }
  return parsed.rut;
}

router.get('/:rut/resumen', async (req, res, next) => {
  try {
    const rut = getRutOrFail(req);
    const [rows] = await pool.query(
      'SELECT * FROM vw_contribuyentes_resumen WHERE rut = ?',
      [rut]
    );
    if (!rows.length) throw fail('NOT_FOUND', 'Empresa no encontrada', 404);
    res.json(ok(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.get('/:rut/actividades', async (req, res, next) => {
  try {
    const rut = getRutOrFail(req);
    const [rows] = await pool.query(
      `SELECT ${COLS_ACTIVIDADES} FROM actividades WHERE rut = ? ORDER BY id`,
      [rut]
    );
    res.json(ok(rows));
  } catch (err) {
    next(err);
  }
});

router.get('/:rut/domicilios', async (req, res, next) => {
  try {
    const rut = getRutOrFail(req);
    const params = [rut];
    let sql = `SELECT ${COLS_DIRECCION} FROM domicilios WHERE rut = ?`;
    if (req.query.vigencia) {
      sql += ' AND vigencia = ?';
      params.push(String(req.query.vigencia).toUpperCase());
    }
    sql += ' ORDER BY id';
    const [rows] = await pool.query(sql, params);
    res.json(ok(rows));
  } catch (err) {
    next(err);
  }
});

router.get('/:rut/sucursales', async (req, res, next) => {
  try {
    const rut = getRutOrFail(req);
    const params = [rut];
    let sql = `SELECT ${COLS_DIRECCION} FROM sucursales WHERE rut = ?`;
    if (req.query.vigencia) {
      sql += ' AND vigencia = ?';
      params.push(String(req.query.vigencia).toUpperCase());
    }
    sql += ' ORDER BY id';
    const [rows] = await pool.query(sql, params);
    res.json(ok(rows));
  } catch (err) {
    next(err);
  }
});

router.get('/:rut', async (req, res, next) => {
  try {
    const rut = getRutOrFail(req);

    const [nombreRes, actividadesRes, domiciliosRes, sucursalesRes] = await Promise.all([
      pool.query(`SELECT ${COLS_NOMBRES} FROM nombres_pj WHERE rut = ?`, [rut]),
      pool.query(`SELECT ${COLS_ACTIVIDADES} FROM actividades WHERE rut = ? ORDER BY id`, [rut]),
      pool.query(`SELECT ${COLS_DIRECCION} FROM domicilios WHERE rut = ? ORDER BY id`, [rut]),
      pool.query(`SELECT ${COLS_DIRECCION} FROM sucursales WHERE rut = ? ORDER BY id`, [rut]),
    ]);

    const nombre = nombreRes[0][0] || null;
    const actividades = actividadesRes[0];
    const domicilios = domiciliosRes[0];
    const sucursales = sucursalesRes[0];

    if (!nombre && actividades.length === 0 && domicilios.length === 0 && sucursales.length === 0) {
      throw fail('NOT_FOUND', 'Empresa no encontrada', 404);
    }

    const dv =
      (nombre && nombre.dv) ||
      (actividades[0] && actividades[0].dv) ||
      (domicilios[0] && domicilios[0].dv) ||
      (sucursales[0] && sucursales[0].dv) ||
      null;

    const rut_completo = dv ? `${rut}-${dv}` : rut;

    res.json(ok({
      rut,
      dv,
      rut_completo,
      razon_social: nombre ? nombre.razon_social : null,
      cod_subtipo: nombre ? nombre.cod_subtipo : null,
      fecha_inicio_vig: nombre ? nombre.fecha_inicio_vig : null,
      fecha_tg_vig: nombre ? nombre.fecha_tg_vig : null,
      actividades,
      domicilios,
      sucursales,
    }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
