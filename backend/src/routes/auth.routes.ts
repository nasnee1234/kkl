import { Router } from 'express';
import { exchangeLineCode } from '../controllers/lineAuth.controller';

const router = Router();

router.post('/line/exchange', exchangeLineCode);

export default router;
