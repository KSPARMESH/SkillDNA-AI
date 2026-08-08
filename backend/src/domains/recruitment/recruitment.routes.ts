import { Router, Request, Response } from 'express';
const router = Router();

router.get('/candidates', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Candidate directory retrieved.',
    data: [
      { id: 'usr_1', name: 'Parmesh KS', skillDnaScore: 88.5, readinessScore: 92.0, targetRole: 'Full Stack Engineer' }
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
