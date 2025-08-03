import express from 'express';
import { LifeAreaController } from '../controllers/LifeAreaController.js';

const router = express.Router();

// GET /api/v1/life-areas
router.get('/', LifeAreaController.getLifeAreas);

// POST /api/v1/life-areas
router.post('/', LifeAreaController.createLifeArea);

// GET /api/v1/life-areas/:id
router.get('/:id', LifeAreaController.getLifeAreaById);

// PUT /api/v1/life-areas/:id
router.put('/:id', LifeAreaController.updateLifeArea);

// DELETE /api/v1/life-areas/:id
router.delete('/:id', LifeAreaController.deleteLifeArea);

// POST /api/v1/life-areas/reorder
router.post('/reorder', LifeAreaController.reorderLifeAreas);

export { router as lifeAreasRouter };