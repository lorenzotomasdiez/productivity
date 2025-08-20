import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { validateRequest } from '../middleware/validation.js';
import { authSchemas } from '../validation/schemas.js';

const router = express.Router();

// Apple Sign In
router.post('/apple-signin', validateRequest(authSchemas.appleSignIn), AuthController.appleSignIn);

// Token refresh
router.post('/refresh', validateRequest(authSchemas.refresh), AuthController.refreshToken);

// Logout current session
router.post('/logout', validateRequest(authSchemas.logout), AuthController.logout);

// Logout all devices
router.post('/logout-all', validateRequest(authSchemas.logoutAll), AuthController.logoutAllDevices);

// Get current user profile
router.get('/me', validateRequest(authSchemas.getProfile), AuthController.getProfile);

export default router;