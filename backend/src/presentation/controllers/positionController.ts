import { Request, Response } from 'express';
import { getAllPositionsService, getCandidatesByPositionService, getInterviewFlowByPositionService, addInterviewStepService } from '../../application/services/positionService';

const MAX_STEP_NAME_LENGTH = 100;

export const getAllPositions = async (req: Request, res: Response) => {
    try {
        const positions = await getAllPositionsService(req.employee!.companyId);
        res.status(200).json(positions);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: 'Error retrieving positions', error: error.message });
        } else {
            res.status(500).json({ message: 'Error retrieving positions', error: String(error) });
        }
    }
};

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        if (isNaN(positionId)) {
            return res.status(400).json({ message: 'Invalid position ID format' });
        }
        const candidates = await getCandidatesByPositionService(positionId, req.employee!.companyId);
        res.status(200).json(candidates);
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            res.status(404).json({ message: 'Position not found', error: error.message });
        } else if (error instanceof Error) {
            res.status(500).json({ message: 'Error retrieving candidates', error: error.message });
        } else {
            res.status(500).json({ message: 'Error retrieving candidates', error: String(error) });
        }
    }
};

export const getInterviewFlowByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        if (isNaN(positionId)) {
            return res.status(400).json({ message: 'Invalid position ID format' });
        }
        const interviewFlow = await getInterviewFlowByPositionService(positionId, req.employee!.companyId);
        res.status(200).json({ interviewFlow });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: 'Position not found', error: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: String(error) });
        }
    }
};

export const addInterviewStep = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        if (isNaN(positionId)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Phase name is required' });
        }
        if (name.length > MAX_STEP_NAME_LENGTH) {
            return res.status(400).json({ error: `Phase name must be ${MAX_STEP_NAME_LENGTH} characters or fewer` });
        }

        const interviewStep = await addInterviewStepService(positionId, name, req.employee!.companyId);
        res.status(201).json({ message: 'Interview step added successfully', data: interviewStep });
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            res.status(404).json({ message: 'Position not found', error: error.message });
        } else if (error instanceof Error) {
            res.status(500).json({ message: 'Error adding interview step', error: error.message });
        } else {
            res.status(500).json({ message: 'Error adding interview step', error: String(error) });
        }
    }
};