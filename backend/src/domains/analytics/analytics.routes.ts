import { Router, Request, Response } from 'express';
const router = Router();

router.get('/user', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'User analytics dashboard data.',
    data: { activityScore: 94, weeklyCommits: 42, verifiedSkillsCount: 8 },
    timestamp: new Date().toISOString()
  });
});

export default router;
