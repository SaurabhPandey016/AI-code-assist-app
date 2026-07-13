import express from 'express';
import { analyzeCode } from '../services/staticAnalysis.js';
import { generateAiReview } from '../services/aiReview.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { code = '', filename = 'snippet' } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: 'Code is required.' });
    }

    const staticAnalysis = analyzeCode({ code, filename });
    const aiReview = await generateAiReview({ code, staticAnalysis, filename });

    return res.status(200).json({
      success: true,
      staticAnalysis,
      aiReview,
    });
  } catch (error) {
    console.error('Review submission failed:', error);
    return res.status(500).json({ message: 'Failed to process review.' });
  }
});

export default router;
