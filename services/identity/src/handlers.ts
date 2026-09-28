import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '@edunet/validation';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './auth';
import { findUserByEmail, findUserById, findOrganizationByCode, createUser } from './db';

export async function registerHandler(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const organization = await findOrganizationByCode(data.organizationCode);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await createUser({
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      organizationId: organization.id,
    });

    const token = generateAccessToken({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await findUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateAccessToken({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.json({ 
      token, 
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    res.json({ token: newToken });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
