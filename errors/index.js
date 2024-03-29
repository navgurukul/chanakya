const {
  ValidationError,
  NotFoundError,
  DBError,
  ConstraintViolationError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError,
} = require('objection');

module.exports = {
  errorHandler: (err) => {
    console.log('errorHandler', err.message);
    if (err instanceof ValidationError) {
      switch (err.type) {
        case 'ModelValidation': {
          return {
            error: true,
            message: err.message,
            type: err.type,
            data: err.data,
            code: 422,
          };
        }
        case 'RelationExpression': {
          return {
            error: true,
            message: err.message,
            type: 'RelationExpression',
            data: {},
            code: 422,
          };
        }
        case 'UnallowedRelation': {
          return {
            error: true,
            message: err.message,
            type: 'UnallowedRelation',
            data: {},
            code: 422,
          };
        }
        case 'InvalidGraph': {
          return {
            error: true,
            message: err.message,
            type: err.type,
            data: {},
            code: 422,
          };
        }
        default: {
          return {
            error: true,
            message: err.message,
            type: 'UnknownValidationError',
            data: {},
            code: 422,
          };
        }
      }
    } else if (err instanceof NotFoundError) {
      return {
        error: true,
        message: err.message,
        type: 'NotFound',
        data: {},
        code: 404,
      };
    } else if (err instanceof UniqueViolationError) {
      return {
        error: true,
        message: 'Unique Key Violation',
        detail: err.nativeError.detail,
        type: err.name,
        code: 422,
      };
    } else if (err instanceof ForeignKeyViolationError) {
      return {
        error: true,
        message: err.message,
        detail: err.nativeError.detail,
        type: err.name,
        code: 422,
      };
    } else if (err instanceof ConstraintViolationError) {
      return {
        error: true,
        message: err.message,
        type: err.type,
        code: 422,
      };
    } else if (err instanceof DBError) {
      return {
        error: true,
        message: err.message,
        type: 'UnknownDatabaseError',
        data: {},
        code: 422,
      };
    } else if (err instanceof NotNullViolationError) {
      return {
        error: true,
        message: err.message,
        type: err.name,
        data: {
          column: err.column,
          table: err.table,
        },
        code: 422,
      };
    } else if (err instanceof DataError) {
      return {
        error: true,
        message: err.message,
        type: 'InvalidData',
        data: {},
        code: 422,
      };
    } else if (err instanceof CheckViolationError) {
      return {
        message: err.message,
        type: 'CheckViolation',
        data: {
          table: err.table,
          constraint: err.constraint,
        },
        code: 422,
      };
    } else {
      return {
        message: err.message,
        type: err.type,
        code: err.code,
      };
    }
  },
};
