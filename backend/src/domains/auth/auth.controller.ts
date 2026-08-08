import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { validateRegistrationInput } from '@skilldna/shared';
import { ValidationError } from '@skilldna/shared';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateRegistrationInput(req.body);
      if (!validation.valid) {
        throw new ValidationError('Registration payload validation failed.', validation.errors);
      }
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, message: 'User registered successfully.', data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ success: true, message: 'Login successful.', data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}
