import { Router } from 'express';
import { addCandidateController, getCandidateById, updateCandidateStageController } from '../presentation/controllers/candidateController';

const router = Router();

// Antes esta ruta llamaba directamente al servicio `addCandidate` y
// reimplementaba aquí su propio try/catch, mientras que
// `addCandidateController` (con el mismo propósito) quedaba definido y sin
// usar en candidateController.ts. Se unifica en un único controlador, igual
// que el resto de rutas de este fichero.
router.post('/', addCandidateController);

router.get('/:id', getCandidateById);

router.put('/:id', updateCandidateStageController);

export default router;
