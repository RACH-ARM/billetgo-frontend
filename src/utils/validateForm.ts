import { z } from 'zod';
import { isValidGabonPhone } from './phone';

const gabonPhone = z
  .string()
  .min(1, 'Numéro requis')
  .refine(isValidGabonPhone, 'Numéro invalide — ex : 62 55 76 55 (8 chiffres après +241)');

const gabonPhoneOptional = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().refine(isValidGabonPhone, 'Numéro invalide — ex : 62 55 76 55').optional()
);

export const loginSchema = z.object({
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().min(8, 'Numéro invalide').optional().or(z.literal('')),
  password: z.string().min(6, 'Mot de passe trop court'),
}).refine((data) => data.email || data.phone, {
  message: 'Email ou téléphone requis',
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: gabonPhoneOptional,
  password: z.string().min(8, 'Mot de passe trop court (8 caractères minimum)'),
  confirmPassword: z.string().min(1, 'Confirmation requise'),
  role: z.enum(['BUYER', 'ORGANIZER']).default('BUYER'),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const checkoutSchema = z.object({
  buyerName: z.string().min(2, 'Nom requis'),
  buyerEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  buyerPhone: gabonPhone,
  provider: z.enum(['AIRTEL_MONEY', 'MOOV_MONEY']),
  paymentPhone: z.string().min(8, 'Numéro de paiement requis'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
