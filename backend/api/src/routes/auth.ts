import express from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = express.Router();

// Apple Sign In
router.post('/apple-signin', AuthController.appleSignIn);

// Token refresh
router.post('/refresh', AuthController.refreshToken);

// Logout current session
router.post('/logout', AuthController.logout);

// Logout all devices
router.post('/logout-all', AuthController.logoutAllDevices);

// Get current user profile
router.get('/me', AuthController.getProfile);

export default router;