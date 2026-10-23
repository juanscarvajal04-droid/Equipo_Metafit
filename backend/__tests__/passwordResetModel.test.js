'use strict';

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const PasswordResetModel = require('../models/passwordResetModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('passwordResetModel', () => {
  test('ensureTable crea la tabla de tokens', async () => {
    pool.query.mockResolvedValueOnce([{}]);

    await PasswordResetModel.ensureTable();

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS PASSWORD_RESET')
    );
  });
});
