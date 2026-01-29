import { Router } from 'express';
import { getPrivacyPolicy, getSupport } from '../controllers/information';

const route = Router();

route.get('/privacy', getPrivacyPolicy);
route.get('/support', getSupport);

export default route;
