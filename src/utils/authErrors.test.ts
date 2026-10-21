import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authErrors';

describe('getAuthErrorMessage', () => {
  it('traduce códigos conocidos de Firebase', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toContain('Ya existe una cuenta');
  });
  it('devuelve un mensaje genérico para errores desconocidos', () => {
    expect(getAuthErrorMessage(new Error('x'))).toContain('error inesperado');
  });
});
