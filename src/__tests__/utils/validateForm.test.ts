import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, checkoutSchema } from '../../utils/validateForm';

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepte email + password valides', () => {
    const result = loginSchema.safeParse({ email: 'user@billetgab.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('accepte phone + password valides', () => {
    const result = loginSchema.safeParse({ phone: '074000000', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejette un email mal formé', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: 'secret123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Email invalide');
    }
  });

  it('rejette un password trop court (< 6 caractères)', () => {
    const result = loginSchema.safeParse({ email: 'user@billetgab.com', password: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Mot de passe trop court');
    }
  });

  it('rejette un phone trop court (< 8 caractères)', () => {
    const result = loginSchema.safeParse({ phone: '074', password: 'secret123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Numéro invalide');
    }
  });

  it('rejette si ni email ni phone ne sont fournis', () => {
    const result = loginSchema.safeParse({ password: 'secret123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Email ou téléphone requis');
    }
  });

  it('accepte les champs email/phone vides (string vide) à condition que l\'autre soit rempli', () => {
    // email = '' est équivalent à absent grâce au .or(z.literal(''))
    const result = loginSchema.safeParse({ email: '', phone: '074000000', password: 'secret123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const validPayload = {
    firstName: 'Tiamiyou',
    lastName: 'Arèmou',
    email: 'tiami@billetgab.com',
    password: 'MotDePasse8!',
    confirmPassword: 'MotDePasse8!',
  };

  it('accepte un payload complet et valide', () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejette si firstName trop court (< 2 caractères)', () => {
    const result = registerSchema.safeParse({ ...validPayload, firstName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Prénom requis');
    }
  });

  it('rejette si lastName trop court (< 2 caractères)', () => {
    const result = registerSchema.safeParse({ ...validPayload, lastName: 'B' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Nom requis');
    }
  });

  it('rejette si password trop court (< 8 caractères)', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'short', confirmPassword: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain(
        'Mot de passe trop court (8 caractères minimum)'
      );
    }
  });

  it('rejette si confirmPassword ne correspond pas au password', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: 'MotDePasse8!',
      confirmPassword: 'AutreMotDePasse',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmIssue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(confirmIssue?.message).toBe('Les mots de passe ne correspondent pas');
    }
  });

  it('accepte le rôle ORGANIZER', () => {
    const result = registerSchema.safeParse({ ...validPayload, role: 'ORGANIZER', companyName: 'MonEvent' });
    expect(result.success).toBe(true);
  });

  it('rejette un rôle inconnu', () => {
    const result = registerSchema.safeParse({ ...validPayload, role: 'SUPERADMIN' });
    expect(result.success).toBe(false);
  });

  it('utilise BUYER comme rôle par défaut', () => {
    const result = registerSchema.safeParse(validPayload);
    if (result.success) {
      expect(result.data.role).toBe('BUYER');
    }
  });
});

// ---------------------------------------------------------------------------
// checkoutSchema
// ---------------------------------------------------------------------------
describe('checkoutSchema', () => {
  const validPayload = {
    buyerName: 'Jean Dupont',
    buyerPhone: '074000001',
    provider: 'AIRTEL_MONEY' as const,
    paymentPhone: '074000001',
  };

  it('accepte un payload complet et valide', () => {
    expect(checkoutSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepte MOOV_MONEY comme provider', () => {
    expect(checkoutSchema.safeParse({ ...validPayload, provider: 'MOOV_MONEY' }).success).toBe(true);
  });

  it('rejette un provider inconnu', () => {
    const result = checkoutSchema.safeParse({ ...validPayload, provider: 'WAVE' });
    expect(result.success).toBe(false);
  });

  it('rejette si buyerName trop court (< 2 caractères)', () => {
    const result = checkoutSchema.safeParse({ ...validPayload, buyerName: 'X' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Nom requis');
    }
  });

  it('rejette si buyerPhone trop court (< 8 caractères)', () => {
    const result = checkoutSchema.safeParse({ ...validPayload, buyerPhone: '074' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Numéro de téléphone requis');
    }
  });

  it('rejette si paymentPhone trop court (< 8 caractères)', () => {
    const result = checkoutSchema.safeParse({ ...validPayload, paymentPhone: '077' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Numéro de paiement requis');
    }
  });

  it('rejette un buyerEmail mal formé s\'il est fourni', () => {
    const result = checkoutSchema.safeParse({ ...validPayload, buyerEmail: 'pas-un-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Email invalide');
    }
  });

  it('accepte un buyerEmail vide (champ optionnel)', () => {
    expect(checkoutSchema.safeParse({ ...validPayload, buyerEmail: '' }).success).toBe(true);
  });
});
