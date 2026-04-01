const router = require('express').Router();
const { Trabajador } = require('../models');

// GET todos
router.get('/', async (_req, res, next) => {
  try {
    const trabajadores = await Trabajador.find().sort({ nombre: 1 });
    res.json(trabajadores);
  } catch (e) { next(e); }
});

// POST nuevo
router.post('/', async (req, res, next) => {
  try {
    const t = await Trabajador.create(req.body);
    res.status(201).json(t);
  } catch (e) { next(e); }
});

// PUT actualizar
router.put('/:id', async (req, res, next) => {
  try {
    const t = await Trabajador.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return res.status(404).json({ error: 'No encontrado' });
    res.json(t);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    await Trabajador.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
