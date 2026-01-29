// integration.test.js
const request = require('supertest');
const { app } = require('./server');
const db = require('./db');

describe('Integráció: Felhasználó regisztráció', () => {

  beforeEach((done) => {
    db.run('DELETE FROM user_stats WHERE user_id IN (SELECT id FROM users WHERE email = ?)', 
      ['test@test.com'], 
      (err) => {
        if (err) console.error('user_stats cleanup error:', err);
        
        db.run('DELETE FROM users WHERE email = ?', ['test@test.com'], (err) => {
          if (err) console.error('users cleanup error:', err);
          done();
        });
      }
    );
  });

  test('POST /api/users → success', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'testuser',
        email: 'test@test.com',
        location: 'Hungary',
        password: 'password123'
      });

    console.log('Status:', res.statusCode);
    console.log('Body:', res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  afterAll((done) => {
    db.close((err) => {
      if (err) console.error('DB close error:', err);
      done();
    });
  });
});
