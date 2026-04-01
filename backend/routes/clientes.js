const router = require('express').Router();
const { Cliente } = require('../models');

router.get('/', async (_req, res, next) => {
  try {
    res.json(await Cliente.find().sort({ nombre: 1 }));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await Cliente.create(req.body));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const c = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    res.json(c);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
