import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from './errors';

describe('AppError', () => {
  it('sets message and statusCode', () => {
    const err = new AppError('test error', 500);
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('uses default resource name', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
    expect(err.statusCode).toBe(404);
  });

  it('uses custom resource name', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
  });
});

describe('UnauthorizedError', () => {
  it('defaults to Unauthorized message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Invalid token');
    expect(err.message).toBe('Invalid token');
  });
});

describe('ForbiddenError', () => {
  it('returns 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });
});

describe('ValidationError', () => {
  it('returns 400 status', () => {
    const err = new ValidationError('Name is required');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Name is required');
  });
});

describe('ConflictError', () => {
  it('returns 409 status', () => {
    const err = new ConflictError('Username already taken');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Username already taken');
  });
});
