import { getAllPositions, getCandidatesByPosition, getInterviewFlowByPosition, addInterviewStep } from '../presentation/controllers/positionController';


const router = require('express').Router();

router.get('/', getAllPositions);
router.get('/:id/candidates', getCandidatesByPosition);
router.get('/:id/interviewflow', getInterviewFlowByPosition);
router.post('/:id/interviewflow/steps', addInterviewStep);

export default router;
