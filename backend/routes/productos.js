const router = require('express').Router();
const { Producto } = require('../models');

router.get('/', async (_req, res, next) => {
  try {
    res.json(await Producto.find().sort({ nombre: 1 }));
  } catch (e) { next(e); }
});

// Productos con stock bajo
router.get('/stock-bajo', async (_req, res, next) => {
  try {
    const productos = await Producto.find({ $expr: { $lte: ['$cantidad', '$minimo'] } });
    res.json(productos);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await Producto.create(req.body));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const p = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: 'No encontrado' });
    res.json(p);
  } catch (e) { next(e); }
});

// Ajustar stock: POST /api/productos/:id/stock { operacion: 'entrada'|'salida', cantidad: N }
router.post('/:id/stock', async (req, res, next) => {
  try {
    const { operacion, cantidad } = req.body;
    const cant = parseInt(cantidad);
    if (!cant || cant <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
    const p = await Producto.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'No encontrado' });
    if (operacion === 'salida' && p.cantidad < cant)
      return res.status(400).json({ error: 'Stock insuficiente' });
    p.cantidad += operacion === 'entrada' ? cant : -cant;
    await p.save();
    res.json(p);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
