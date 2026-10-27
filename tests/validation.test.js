import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  validateLogin,
  validateResetPassword,
  validateSignup,
  validateProduct,
  validateImageFile,
  isValid,
} from '../src/lib/validation.js';
import { UPLOAD_LIMITS } from '../src/lib/constants.js';

/** Build a fake File without touching the filesystem. */
function fakeFile(type, sizeBytes, name = 'photo.jpg') {
  return { name, type, size: sizeBytes };
}

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('kwame@knust.edu.gh')).toBe(true);
    expect(isValidEmail('a.b+tag@example.co.uk')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nolocal.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts Ghanaian local and international formats', () => {
    expect(isValidPhone('0244123456')).toBe(true);
    expect(isValidPhone('+233 24 412 3456')).toBe(true);
    expect(isValidPhone('024-412-3456')).toBe(true);
  });

  it('rejects numbers that are too short', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('requires at least six characters', () => {
    expect(isValidPassword('secret')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('validateLogin', () => {
  it('passes a well-formed login', () => {
    expect(isValid(validateLogin({ email: 'a@b.com', password: 'secret' }))).toBe(true);
  });

  it('flags a missing email and short password', () => {
    const errors = validateLogin({ email: '', password: '123' });
    expect(errors.email).toBe('Email is required');
    expect(errors.password).toMatch(/at least 6/);
  });

  it('flags a malformed email', () => {
    expect(validateLogin({ email: 'nope', password: 'secret' }).email).toMatch(/valid email/);
  });
});

describe('validateSignup', () => {
  const good = {
    fullName: 'Kwame Mensah',
    email: 'kwame@knust.edu.gh',
    phone: '0244123456',
    whatsapp: '',
    roomNumber: 'B204',
    password: 'secret1',
    confirmPassword: 'secret1',
  };

  it('passes a complete form', () => {
    expect(isValid(validateSignup(good))).toBe(true);
  });

  it('treats an empty WhatsApp number as valid (it defaults to phone)', () => {
    expect(validateSignup({ ...good, whatsapp: '' }).whatsapp).toBeUndefined();
  });

  it('rejects an invalid WhatsApp number when one is supplied', () => {
    expect(validateSignup({ ...good, whatsapp: '123' }).whatsapp).toMatch(/valid WhatsApp/);
  });

  it('rejects mismatched passwords', () => {
    const errors = validateSignup({ ...good, confirmPassword: 'different' });
    expect(errors.confirmPassword).toBe('Passwords do not match');
  });

  it('requires a room number', () => {
    expect(validateSignup({ ...good, roomNumber: '' }).roomNumber).toBe('Room number is required');
  });

  it('collects every problem at once rather than stopping at the first', () => {
    const errors = validateSignup({
      fullName: '',
      email: 'bad',
      phone: '1',
      roomNumber: '',
      password: '1',
      confirmPassword: '2',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'confirmPassword',
      'email',
      'fullName',
      'password',
      'phone',
      'roomNumber',
    ]);
  });
});

describe('validateProduct', () => {
  const good = {
    title: 'HP Pavilion Laptop',
    description: 'Good condition, 8GB RAM',
    price: '2500',
    category: 'electronics',
    condition: 'fairly-used',
  };

  it('passes a complete listing with one image', () => {
    expect(isValid(validateProduct(good, 1))).toBe(true);
  });

  it('requires at least one image', () => {
    expect(validateProduct(good, 0).images).toBe('Add at least 1 image');
  });

  it('caps images at the configured maximum', () => {
    const errors = validateProduct(good, UPLOAD_LIMITS.MAX_IMAGES + 1);
    expect(errors.images).toMatch(/Maximum 5 images/);
  });

  it('accepts a price of zero (free giveaways)', () => {
    expect(validateProduct({ ...good, price: '0' }, 1).price).toBeUndefined();
  });

  it('rejects a negative price', () => {
    expect(validateProduct({ ...good, price: '-5' }, 1).price).toBe('Price cannot be negative');
  });

  it('rejects a non-numeric price', () => {
    expect(validateProduct({ ...good, price: 'free' }, 1).price).toBe('Enter a valid price');
  });

  it('rejects a category outside the fixed list', () => {
    expect(validateProduct({ ...good, category: 'weapons' }, 1).category).toMatch(/valid category/);
  });

  it('rejects a condition outside the fixed list', () => {
    expect(validateProduct({ ...good, condition: 'broken' }, 1).condition).toMatch(/valid condition/);
  });

  it('enforces the database title and description length limits', () => {
    expect(validateProduct({ ...good, title: 'x'.repeat(101) }, 1).title).toMatch(/100 characters/);
    expect(
      validateProduct({ ...good, description: 'x'.repeat(1001) }, 1).description
    ).toMatch(/1000 characters/);
  });
});

describe('validateImageFile', () => {
  it('accepts a normal JPEG', () => {
    expect(validateImageFile(fakeFile('image/jpeg', 2 * 1024 * 1024)).valid).toBe(true);
  });

  it('rejects a file over the size limit', () => {
    const result = validateImageFile(fakeFile('image/jpeg', 21 * 1024 * 1024));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/under 20MB/);
  });

  it('rejects a disallowed type', () => {
    const result = validateImageFile(fakeFile('image/gif', 1000));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/JPEG, PNG and WebP/);
  });

  it('accepts a file exactly at the size limit', () => {
    expect(validateImageFile(fakeFile('image/png', 20 * 1024 * 1024)).valid).toBe(true);
  });
});

describe('validateResetPassword', () => {
  it('accepts matching valid passwords', () => {
    const errors = validateResetPassword({ password: 'secretpassword', confirmPassword: 'secretpassword' });
    expect(isValid(errors)).toBe(true);
  });

  it('rejects passwords shorter than 6 characters', () => {
    const errors = validateResetPassword({ password: '123', confirmPassword: '123' });
    expect(errors.password).toMatch(/at least 6 characters/);
  });

  it('rejects mismatched passwords', () => {
    const errors = validateResetPassword({ password: 'secret123', confirmPassword: 'different123' });
    expect(errors.confirmPassword).toMatch(/do not match/);
  });

  it('requires confirmation password', () => {
    const errors = validateResetPassword({ password: 'secret123', confirmPassword: '' });
    expect(errors.confirmPassword).toMatch(/confirm your password/);
  });
});
