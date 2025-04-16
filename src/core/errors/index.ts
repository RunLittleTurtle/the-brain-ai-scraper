// Basic custom error classes for semantic error handling

export class BaseError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    // Ensure the prototype chain is correct
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

export class BadRequestError extends BaseError {
    constructor(message: string = 'Bad request') {
        super(message, 400);
    }
}

// Add more specific errors as needed
