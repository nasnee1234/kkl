import { Router } from 'express';
import { checkAdmin } from '../middleware/checkAdmin';
import { verifyAdmin, sendWebPush } from '../controllers/admin.controller';

const router = Router();

router.get('/verify', checkAdmin, verifyAdmin);
router.post('/send-web-push', checkAdmin, sendWebPush);

export default router;
