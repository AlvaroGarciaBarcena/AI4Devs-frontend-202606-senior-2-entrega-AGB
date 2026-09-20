import { Router } from 'express';
import { addCandidateController, getCandidateById, getUnassignedCandidates, updateCandidateProfileController, updateCandidateStageController } from '../presentation/controllers/candidateController';

const router = Router();

// Antes esta ruta llamaba directamente al servicio `addCandidate` y
// reimplementaba aquí su propio try/catch, mientras que
// `addCandidateController` (con el mismo propósito) quedaba definido y sin
// usar en candidateController.ts. Se unifica en un único controlador, igual
// que el resto de rutas de este fichero.
router.post('/', addCandidateController);

// Antes de `/:id`: si fuera después, Express probaría primero `/:id` con
// id="unassigned", y `parseInt('unassigned')` fallaría con un 400 en vez de
// llegar aquí.
router.get('/unassigned', getUnassignedCandidates);

router.get('/:id', getCandidateById);

router.put('/:id', updateCandidateStageController);

// PATCH, no PUT: PUT /:id ya está tomado por el cambio de fase de la
// candidatura (updateCandidateStageController), un payload y un
// propósito totalmente distintos -- reutilizar el mismo verbo+ruta para
// dos cosas habría exigido inspeccionar el cuerpo de la petición para
// saber cuál de los dos se quería, en vez de que la propia ruta lo diga.
router.patch('/:id', updateCandidateProfileController);

export default router;
