const router = require('express').Router();
const { Servicio, Pago, Trabajador } = require('../models');

/**
 * GET /api/reportes
 * Query params:
 *   desde        YYYY-MM-DD (requerido)
 *   hasta        YYYY-MM-DD (requerido)
 *   trabajadorId ObjectId   (opcional — filtra por uno)
 *
 * Devuelve:
 *   {
 *     periodo: { desde, hasta },
 *     resumenGeneral: { totalServicios, totalIngresos, totalManoObra, totalRepuestos, totalComisiones },
 *     resumenTrabajadores: [{ trabajador, servicios, manoObra, comision, pagado, pendiente }],
 *     servicios: [...],
 *     pagos: [...]
 *   }
 */
router.get('/', async (req, res, next) => {
  try {
    const { desde, hasta, trabajadorId } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta son requeridos' });

    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);
    fechaHasta.setHours(23, 59, 59, 999);

    if (isNaN(fechaDesde) || isNaN(fechaHasta))
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });

    if (fechaDesde > fechaHasta)
      return res.status(400).json({ error: '"desde" no puede ser mayor que "hasta"' });

    // ── Filtro base ──────────────────────────────────────────────────────────
    const filtroServ = { fecha: { $gte: fechaDesde, $lte: fechaHasta } };
    if (trabajadorId) filtroServ.trabajadorId = trabajadorId;

    // ── Consultas en paralelo ────────────────────────────────────────────────
    const [servicios, pagos, trabajadores] = await Promise.all([
      Servicio.find(filtroServ)
        .populate('trabajadorId', 'nombre cargo comision')
        .populate('clienteId',    'nombre vehiculo')
        .sort({ fecha: -1 }),

      Pago.find({
        ...(trabajadorId ? { trabajadorId } : {}),
        desde: { $gte: fechaDesde },
        hasta: { $lte: fechaHasta },
      }).populate('trabajadorId', 'nombre cargo'),

      Trabajador.find().sort({ nombre: 1 }),
    ]);

    // ── Resumen general ──────────────────────────────────────────────────────
    const resumenGeneral = {
      totalServicios:   servicios.length,
      totalIngresos:    servicios.reduce((s, x) => s + (x.total || 0), 0),
      totalManoObra:    servicios.reduce((s, x) => s + (x.manoObra || 0), 0),
      totalRepuestos:   servicios.reduce((s, x) => s + (x.totalRepuestos || 0), 0),
      totalComisiones:  0, // se calcula abajo
    };

    // ── Resumen por trabajador ───────────────────────────────────────────────
    const resumenTrabajadores = trabajadores.map(t => {
      const svsTrab = servicios.filter(s => s.trabajadorId?._id?.toString() === t._id.toString());
      if (!svsTrab.length && !trabajadorId) return null; // omitir trabajadores sin servicios

      const manoObra  = svsTrab.reduce((a, s) => a + (s.manoObra || 0), 0);
      const comision  = manoObra * ((t.comision || 0) / 100);

      // Pagos del trabajador en este rango
      const pagosTrab = pagos.filter(p => p.trabajadorId?._id?.toString() === t._id.toString());
      const pagado    = pagosTrab.reduce((a, p) => a + (p.monto || 0), 0);

      resumenGeneral.totalComisiones += comision;

      return {
        trabajador:     { _id: t._id, nombre: t.nombre, cargo: t.cargo, comisionPct: t.comision },
        totalServicios: svsTrab.length,
        totalGenerado:  svsTrab.reduce((a, s) => a + (s.total || 0), 0),
        manoObra,
        comision,
        pagado,
        pendiente:      Math.max(0, comision - pagado),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalGenerado - a.totalGenerado);

    res.json({
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      resumenGeneral,
      resumenTrabajadores,
      servicios,
      pagos,
    });
  } catch (e) { next(e); }
});

module.exports = router;
