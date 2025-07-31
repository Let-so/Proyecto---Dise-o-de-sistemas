// tests/medico.test.js
const request = require('supertest');
const app     = require('../index');

describe('Validar matrícula médica (GET)', () => {
  it('400 si falta parámetro', async () => {
    const res = await request(app).get('/api/auth/validar-matricula');
    expect(res.status).toBe(400);
  });
  it('422 si formato inválido', async () => {
    const res = await request(app)
      .get('/api/auth/validar-matricula')
      .query({ matricula: 'XX-123' });
    expect(res.status).toBe(422);
  });
  it('422 si fuera de rango', async () => {
    const res = await request(app)
      .get('/api/auth/validar-matricula')
      .query({ matricula: 'MP-99999' });
    expect(res.status).toBe(422);
  });
  it('200 si matrícula válida', async () => {
    const res = await request(app)
      .get('/api/auth/validar-matricula')
      .query({ matricula: 'MP-00010' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});


