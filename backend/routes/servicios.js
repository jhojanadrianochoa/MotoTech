const router = require('express').Router();
const { Servicio, Producto } = require('../models');

// GET con filtros opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&trabajadorId=xxx&clienteId=xxx
router.get('/', async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.desde || req.query.hasta) {
      filtro.fecha = {};
      if (req.query.desde) filtro.fecha.$gte = new Date(req.query.desde);
      if (req.query.hasta) {
        // hasta es inclusivo: tomamos el fin del día
        const hasta = new Date(req.query.hasta);
        hasta.setHours(23, 59, 59, 999);
        filtro.fecha.$lte = hasta;
      }
    }
    if (req.query.trabajadorId) filtro.trabajadorId = req.query.trabajadorId;
    if (req.query.clienteId)    filtro.clienteId    = req.query.clienteId;

    const servicios = await Servicio.find(filtro)
      .populate('trabajadorId', 'nombre cargo comision')
      .populate('clienteId',    'nombre telefono vehiculo')
      .sort({ fecha: -1 });

    res.json(servicios);
  } catch (e) { next(e); }
});

// GET uno
router.get('/:id', async (req, res, next) => {
  try {
    const s = await Servicio.findById(req.params.id)
      .populate('trabajadorId', 'nombre cargo comision')
      .populate('clienteId',    'nombre telefono vehiculo');
    if (!s) return res.status(404).json({ error: 'No encontrado' });
    res.json(s);
  } catch (e) { next(e); }
});

// POST crear servicio — también descuenta stock de productos
router.post('/', async (req, res, next) => {
  try {
    const { repuestos = [], manoObra = 0, trabajadorId, clienteId, fecha, descripcion, motoCliente } = req.body;

    // Verificar y descontar stock
    for (const rep of repuestos) {
      const prod = await Producto.findById(rep.productoId);
      if (!prod) return res.status(400).json({ error: `Producto no encontrado: ${rep.productoId}` });
      if (prod.cantidad < rep.qty)
        return res.status(400).json({ error: `Stock insuficiente: ${prod.nombre} (tiene ${prod.cantidad}, pidió ${rep.qty})` });
    }

    let totalRepuestos = 0, totalCostoRepuestos = 0;
    const repuestosGuardados = [];

    for (const rep of repuestos) {
      const prod = await Producto.findById(rep.productoId);
      prod.cantidad -= rep.qty;
      await prod.save();
      totalRepuestos      += rep.qty * rep.precio;
      totalCostoRepuestos += rep.qty * prod.precioCompra;
      repuestosGuardados.push({
        productoId:  prod._id,
        nombre:      prod.nombre,
        qty:         rep.qty,
        precio:      rep.precio,
        costoCompra: prod.precioCompra,
      });
    }

    const total    = manoObra + totalRepuestos;
    const ganancia = manoObra + (totalRepuestos - totalCostoRepuestos);

    const servicio = await Servicio.create({
      trabajadorId, clienteId, fecha, descripcion, motoCliente,
      repuestos: repuestosGuardados,
      manoObra, totalRepuestos, totalCostoRepuestos, total, ganancia,
    });

    res.status(201).json(
      await servicio.populate(['trabajadorId', 'clienteId'])
    );
  } catch (e) { next(e); }
});

// DELETE (no revertimos stock — decisión de negocio, se puede ajustar manualmente)
router.delete('/:id', async (req, res, next) => {
  try {
    await Servicio.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
