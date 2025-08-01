class ExpressError extends Error {
  status;
  constructor(message: string, status: number) {
    super();
    this.message = message;
    this.status = status;
  }
}

/** 404 NOT FOUND error. */

class NotFoundError extends ExpressError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

/** 401 UNAUTHORIZED error. */

class UnauthorizedError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/** 400 BAD REQUEST error. */

class BadRequestError extends ExpressError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/** 403 BAD REQUEST error. */

class ForbiddenError extends ExpressError {
  constructor(message = "Forbidden Request") {
    super(message, 403);
  }
}

class InternalServerError extends ExpressError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

export {
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ExpressError,
  InternalServerError,
};
