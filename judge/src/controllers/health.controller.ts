import { Request, Response } from 'express';
import { judgeService } from '../services/JudgeService.js';

export const getHealth = (_req: Request, res: Response): void => {
    const stats = judgeService.getHealthStats();
    res.status(200).json(stats);
};
