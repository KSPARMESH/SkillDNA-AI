import { Router, Request, Response } from 'express';
const router = Router();

router.get('/jobs', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Job postings list.',
    data: [
      { id: 'job_1', title: 'Senior Full Stack Engineer', company: 'SkillDNA AI', location: 'Remote', status: 'ACTIVE' }
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
