const router = require('express').Router();
const { Pago } = require('../models');

// GET con filtros: ?trabajadorId=xxx&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.trabajadorId) filtro.trabajadorId = req.query.trabajadorId;
    if (req.query.desde) filtro.desde = { $gte: new Date(req.query.desde) };
    if (req.query.hasta) filtro.hasta = { $lte: new Date(req.query.hasta) };
    res.json(await Pago.find(filtro).populate('trabajadorId', 'nombre cargo').sort({ fechaPago: -1 }));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const pago = await Pago.create(req.body);
    res.status(201).json(await pago.populate('trabajadorId', 'nombre cargo'));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Pago.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
