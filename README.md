# 🏍 MotoTech — Guía de Despliegue

## Estructura del proyecto

```
mototech/
├── backend/          ← Node.js + Express + MongoDB
│   ├── server.js
│   ├── models/
│   │   └── index.js  (Trabajador, Cliente, Producto, Servicio, Pago)
│   ├── routes/
│   │   ├── trabajadores.js
│   │   ├── clientes.js
│   │   ├── productos.js
│   │   ├── servicios.js
│   │   ├── pagos.js
│   │   └── reportes.js   ← endpoint de reporte con rango de fechas
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
└── frontend/
    ├── index.html    ← app completa, conectada a la API
    ├── vercel.json
    └── netlify.toml
```

---

## Paso 1 — Crear la base de datos en MongoDB Atlas (gratis)

1. Ve a https://cloud.mongodb.com y crea una cuenta
2. Crea un **Cluster gratuito** (M0 — 512MB)
3. En **Database Access** → agrega un usuario con contraseña
4. En **Network Access** → agrega `0.0.0.0/0` (permite acceso desde cualquier IP)
5. En tu cluster → **Connect** → **Compass / Drivers** → copia la URI:
   ```
   mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/mototech
   ```

---

## Paso 2 — Desplegar el backend en Render

1. Sube la carpeta `backend/` a un repo de GitHub
2. Ve a https://render.com → **New Web Service**
3. Conecta tu repo de GitHub
4. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. En **Environment Variables** agrega:
   | Variable | Valor |
   |---|---|
   | `MONGODB_URI` | tu URI de Atlas |
   | `ALLOWED_ORIGINS` | `https://tu-app.vercel.app` |
   | `PORT` | `3001` |
6. Haz clic en **Create Web Service**
7. Espera ~2 min. Verás en los logs: `✅ MongoDB Atlas conectado` y `🚀 API corriendo`
8. **Copia la URL de tu servicio**, ej: `https://mototech-api.onrender.com`

---

## Paso 3 — Conectar el frontend con el backend

1. Abre `frontend/index.html`
2. Busca esta línea (cerca del inicio del `<script>`):
   ```js
   : 'https://TU-BACKEND.onrender.com/api';
   ```
3. Reemplaza `TU-BACKEND` con el nombre real de tu servicio en Render:
   ```js
   : 'https://mototech-api.onrender.com/api';
   ```

---

## Paso 4 — Desplegar el frontend en Vercel (recomendado)

1. Sube la carpeta `frontend/` a otro repo de GitHub (o una subcarpeta del mismo)
2. Ve a https://vercel.com → **Add New Project**
3. Importa tu repo
4. Deja todo por defecto y haz clic en **Deploy**
5. Tu app estará en: `https://mototech-xxxx.vercel.app`

### Alternativa — Netlify
1. Ve a https://netlify.com → **Add new site** → **Import from Git**
2. Selecciona tu repo del frontend
3. **Publish directory:** `.` (punto — la raíz)
4. Haz clic en **Deploy**

---

## Paso 5 — Actualizar CORS en Render

Una vez tengas la URL de Vercel/Netlify, vuelve a Render:
- **Environment** → `ALLOWED_ORIGINS` → agrega la URL:
  ```
  https://mototech-xxxx.vercel.app,http://localhost:5500
  ```
- Render redesplegará automáticamente

---

## API Reference

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/trabajadores` | Lista todos |
| POST | `/api/trabajadores` | Crear nuevo |
| PUT | `/api/trabajadores/:id` | Editar |
| DELETE | `/api/trabajadores/:id` | Eliminar |
| GET | `/api/clientes` | Lista todos |
| GET | `/api/productos` | Lista inventario |
| POST | `/api/productos/:id/stock` | Ajustar stock |
| GET | `/api/servicios?desde=&hasta=&trabajadorId=` | Servicios filtrados |
| POST | `/api/servicios` | Registrar servicio (descuenta stock) |
| GET | `/api/pagos` | Lista pagos |
| POST | `/api/pagos` | Registrar pago de comisión |
| **GET** | **`/api/reportes?desde=&hasta=&trabajadorId=`** | **Reporte completo con comisiones** |
| GET | `/health` | Health check para Render |

### Ejemplo — Reporte
```
GET /api/reportes?desde=2026-03-01&hasta=2026-03-31

Respuesta:
{
  "periodo": { "desde": "2026-03-01", "hasta": "2026-03-31" },
  "resumenGeneral": {
    "totalServicios": 42,
    "totalIngresos": 8500000,
    "totalManoObra": 3200000,
    "totalComisiones": 640000
  },
  "resumenTrabajadores": [
    {
      "trabajador": { "nombre": "Carlos", "comisionPct": 20 },
      "totalServicios": 18,
      "manoObra": 1500000,
      "comision": 300000,
      "pagado": 0,
      "pendiente": 300000
    }
  ],
  "servicios": [...],
  "pagos": [...]
}
```

---

## Desarrollo local

```bash
# Backend
cd backend
cp .env.example .env
# Edita .env con tu MONGODB_URI
npm install
npm run dev    # corre en http://localhost:3001

# Frontend
# Abre frontend/index.html con Live Server (VS Code)
# o: python3 -m http.server 5500
```

> ⚠️ **Plan gratuito de Render:** el servicio "duerme" tras 15 minutos sin peticiones.
> La primera petición después de dormir tarda ~30 segundos en responder.
> Para producción real, considera el plan de $7/mes que mantiene el servicio activo.
