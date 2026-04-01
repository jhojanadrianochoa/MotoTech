const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── TRABAJADOR ────────────────────────────────────────────────────────────────
const TrabajadorSchema = new Schema({
  nombre:   { type: String, required: true, trim: true },
  cargo:    { type: String, default: 'Mecánico', trim: true },
  telefono: { type: String, default: '' },
  comision: { type: Number, default: 0, min: 0, max: 100 }, // % sobre mano de obra
  notas:    { type: String, default: '' },
}, { timestamps: true });

// ── CLIENTE ───────────────────────────────────────────────────────────────────
const ClienteSchema = new Schema({
  nombre:   { type: String, required: true, trim: true },
  telefono: { type: String, default: '' },
  email:    { type: String, default: '', lowercase: true },
  vehiculo: { type: String, default: '' }, // "Honda CB 150 / 2022 / ABC-123"
}, { timestamps: true });

// ── PRODUCTO (INVENTARIO) ─────────────────────────────────────────────────────
const ProductoSchema = new Schema({
  nombre:        { type: String, required: true, trim: true },
  categoria:     { type: String, default: 'Otros' },
  precioCompra:  { type: Number, required: true, min: 0 },
  precioVenta:   { type: Number, required: true, min: 0 },
  cantidad:      { type: Number, default: 0, min: 0 },
  minimo:        { type: Number, default: 5, min: 0 }, // alerta de stock bajo
  notas:         { type: String, default: '' },
}, { timestamps: true });

// ── REPUESTO (sub-documento dentro de Servicio) ───────────────────────────────
const RepuestoUsadoSchema = new Schema({
  productoId:  { type: Schema.Types.ObjectId, ref: 'Producto' },
  nombre:      String,
  qty:         { type: Number, min: 1 },
  precio:      Number, // precio de venta al momento del servicio
  costoCompra: Number, // costo de compra al momento del servicio
}, { _id: false });

// ── SERVICIO ──────────────────────────────────────────────────────────────────
const ServicioSchema = new Schema({
  trabajadorId: { type: Schema.Types.ObjectId, ref: 'Trabajador', required: true },
  clienteId:    { type: Schema.Types.ObjectId, ref: 'Cliente',    required: true },
  fecha:        { type: Date, required: true },
  descripcion:  { type: String, required: true, trim: true },
  motoCliente:  { type: String, default: '' },
  repuestos:    [RepuestoUsadoSchema],
  manoObra:            { type: Number, default: 0, min: 0 },
  totalRepuestos:      { type: Number, default: 0 },
  totalCostoRepuestos: { type: Number, default: 0 },
  total:               { type: Number, default: 0 },
  ganancia:            { type: Number, default: 0 },
}, { timestamps: true });

// Índices para consultas de reporte (rango de fechas + trabajador)
ServicioSchema.index({ fecha: 1 });
ServicioSchema.index({ trabajadorId: 1, fecha: 1 });

// ── PAGO DE COMISIÓN ──────────────────────────────────────────────────────────
const PagoSchema = new Schema({
  trabajadorId: { type: Schema.Types.ObjectId, ref: 'Trabajador', required: true },
  // Rango de fechas al que corresponde la comisión pagada
  desde:        { type: Date, required: true },
  hasta:        { type: Date, required: true },
  monto:        { type: Number, required: true, min: 0 },
  fechaPago:    { type: Date, default: Date.now },
  nota:         { type: String, default: '' },
}, { timestamps: true });

PagoSchema.index({ trabajadorId: 1, desde: 1, hasta: 1 });

// ── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = {
  Trabajador: mongoose.model('Trabajador', TrabajadorSchema),
  Cliente:    mongoose.model('Cliente',    ClienteSchema),
  Producto:   mongoose.model('Producto',   ProductoSchema),
  Servicio:   mongoose.model('Servicio',   ServicioSchema),
  Pago:       mongoose.model('Pago',       PagoSchema),
};
