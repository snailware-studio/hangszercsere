const server = require('./unit_test');


test('adds 1 + 2 to equal 3', () => {
  expect(server.sum(1, 2)).toBe(3);
});

describe('Bejelentkezés', () => {
  test('returns 400 if missing name or password', async () => {
    const req = { body: {} };
    const res = { 
      status: jest.fn().mockReturnValue({ json: jest.fn() }) 
    };

    await server.login(req, res, {
      db: { get: () => {} },       // mock db
      bcrypt: { compare: () => {} }, // mock bcrypt
      crypto: { randomUUID: () => 'uuid' }
    });

    expect(res.status).toHaveBeenCalledWith(400);
  });
});


describe('Regisztráció', () => {

  test('should return 400 if any field is missing', async () => {
    const req = { body: {} };
    const res = { 
      status: jest.fn().mockReturnValue({ json: jest.fn() }),
      json: jest.fn()
    };

    // fake dependencies (won’t be called)
    await server.register(req, res, { db: {}, bcryptLib: { hash: async () => '' }, emailService: {}, AddToken: () => '', TokenType: {} });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(
      { error: 'Name, email, location, and password are required!' }
    );
  });

  test('successful register and email', async () => {
    const req = { body: { name: 'Marcell', email: 'a@b.com', location: 'Hungary', password: 'pw' } };

    // fake response
    const resJson = jest.fn();
    const res = { 
      status: jest.fn().mockReturnValue({ json: resJson }), 
      json: resJson
    };

    const db = {
      run: jest.fn((sql, params, cb) => cb.call({ lastID: 123 }, null)) // lastID = 123
    };

    const bcryptLib = { hash: async () => 'hashedpw' };

    const emailService = { sendWelcomeEmail: jest.fn().mockResolvedValue(true) };

    const AddToken = (id, type) => `fake-token-${id}`;
    const TokenType = { EMAIL_VERIFICATION: 'email' };

    await server.register(req, res, { db, bcryptLib, emailService, AddToken, TokenType });

    expect(resJson).toHaveBeenCalledWith({ success: true, userId: 123 });

    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('a@b.com', 'Marcell', 'fake-token-123');
  });
});

describe('Felhasználó törlése', () => {
  test('sends delete confirmation email and responds with success', async () => {
    const req = { body: { userId: 123 } };

    const resJson = jest.fn();
    const res = { 
      status: jest.fn().mockReturnValue({ json: resJson }), 
      json: resJson 
    };

    const db = {
      get: jest.fn((sql, params, callback) => callback(null, { email: 'a@b.com', name: 'Marcell', id: 123 }))
    };

    const emailService = { sendProfileDeleteEmail: jest.fn().mockResolvedValue(true) };

    const AddToken = (id, type) => `fake-token-${id}`;
    const TokenType = { DELETE_PROFILE: 'delete' };

    await server.deleteUser(req, res, { db, emailService, AddToken, TokenType });

    expect(emailService.sendProfileDeleteEmail).toHaveBeenCalledWith(
      'a@b.com', 
      'Marcell', 
      'fake-token-123'
    );

    expect(resJson).toHaveBeenCalledWith({ success: true });
  });

});
