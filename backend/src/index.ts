import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Extender la interfaz Request para incluir prisma
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default app;

// Cabeceras de seguridad estándar (X-Content-Type-Options, evita MIME-sniffing;
// CSP/HSTS/X-Frame-Options por defecto, etc.). No hay vistas HTML servidas por
// este backend (API pura), por lo que la CSP por defecto de helmet no choca
// con nada existente.
app.use(helmet());

// Límite de peticiones por IP: sin esto, cualquier ruta (en particular
// POST /upload, que acepta hasta 10MB por petición, y POST /candidates)
// puede saturarse por fuerza bruta o denegación de servicio, ya que la API
// no requiere autenticación. 300 peticiones/15 min es holgado para un uso
// normal del formulario y del panel de reclutador.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Middleware para parsear JSON. Asegúrate de que esto esté antes de tus rutas.
app.use(express.json());

// Middleware para adjuntar prisma al objeto de solicitud
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Middleware para permitir CORS desde http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware de logging de peticiones. Debe ir antes de las rutas para
// registrar TODAS las peticiones entrantes (antes vivía después de las
// rutas y nunca llegaba a ejecutarse para /candidates, /upload o /position,
// ya que esos handlers ya habían respondido la petición).
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import and use candidateRoutes
app.use('/candidates', candidateRoutes);

// Route for file uploads
app.post('/upload', uploadFile);

// Route to get candidates by position
app.use('/position', positionRoutes);

const port = 3010;

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain');
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
