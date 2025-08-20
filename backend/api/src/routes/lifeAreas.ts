import express from 'express';
import { LifeAreaController } from '../controllers/LifeAreaController';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { lifeAreaSchemas } from '../validation/schemas.js';

const router = express.Router();

// Protect all life area routes
router.use(authenticateToken);

// GET /api/v1/life-areas
router.get('/', validateRequest(lifeAreaSchemas.list), LifeAreaController.getLifeAreas);

// POST /api/v1/life-areas
router.post('/', validateRequest(lifeAreaSchemas.create), LifeAreaController.createLifeArea);

// GET /api/v1/life-areas/:id
router.get('/:id', validateRequest(lifeAreaSchemas.getById), LifeAreaController.getLifeAreaById);

// PUT /api/v1/life-areas/:id
router.put('/:id', validateRequest(lifeAreaSchemas.update), LifeAreaController.updateLifeArea);

// DELETE /api/v1/life-areas/:id
router.delete('/:id', validateRequest(lifeAreaSchemas.getById), LifeAreaController.deleteLifeArea);

// POST /api/v1/life-areas/reorder
router.post('/reorder', validateRequest(lifeAreaSchemas.reorder), LifeAreaController.reorderLifeAreas);

export { router as lifeAreasRouter };