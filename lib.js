const {basename} = require('path');

const Ajv = require('ajv');

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

const TEXT_HEADER = {
  'Content-Type': 'text/plain',
};

const HTML_HEADER = {
  'Content-Type': 'text/html',
};

const CACHE_HEADER = {
  'Cache-Control': 'private, immutable',
};

const HTTP_ERR = {
  USER_ERR: 400,
  NOT_FOUND_ERR: 404,
};

class APIError extends Error {
  constructor(msg = 'something went wrong', code = HTTP_ERR.USER_ERR,...args) {
    super(msg, ...args);
    this.code = code;
  }
}

const logStart = (context) => {
  setTimeout(() => {
    fail(context, 'timeout', 500);
    process.exit(1);
  }, 0.5 * 60 * 1000);
  context.log('[Node.js HTTP %s FuncApp] %s %s', basename(__dirname), context.req.method, context.req.originalUrl);
  context.log('body %s', context.req.body ? JSON.stringify(context.req.body).substr(0, 200) : 'undefined');
  context.log('query %s', JSON.stringify(context.req.query).substr(0, 200));
};


const makeLogger = (context) => ({
  log(...xs) {
    return context.log(...xs);
  },
  warn(...xs) {
    return context.log(...xs);
  },
  error(...xs) {
    return context.log(...xs);
  }
});

/**
 * @param {*} body
 * @param {number} [status]
 * @param {Record<string, string>} [headers]
 * @return {{headers: Record<string, string>, body: *, status: number}}
 */
const succeed = (context, body, headers = { ...CACHE_HEADER, ...JSON_HEADER }, status = 200) => {
  return context.res = {
    body: (headers['Content-Type'] || '').indexOf('/json') >= 0 || headers['Content-Type'] === undefined
      ? JSON.stringify(body)
      : body,
    status,
    headers,
  };
};

/**
 * @param {*} msg
 * @param {number} [status]
 * @param {Record<string, string>} [headers]
 * @return {{headers: Record<string, string>, body: *, status: number}}
 */
const fail = (context, msg, status = 400, headers = { ...TEXT_HEADER }) => {
  return context.res = {
    status,
    headers,
    body: msg,
  };
};

/**
 * @param {*} context
 * @param {Record<string, *>} schema
 * @param {'body'|'query'} [what]
 * @returns {Promise<void>}
 */
const validateJSON = async (context, schema, what = 'body') => {
  if (context.req[what] === null || context.req[what] === undefined) {
    throw new APIError(`${what} is missing from the request`, HTTP_ERR.USER_ERR);
  }
  const validate = new Ajv({ messages: true, verbose: true, allErrors: true, unicode: false, logger: makeLogger(context) }).compile({
    $schema: "http://json-schema.org/draft-07/schema#",
    id: schema.id || schema.description,
    description: schema.description || schema.id,
    ...schema
  });
  const valid = validate(context.req[what]);
  if (!valid) {
    context.log(validate);
    context.log(validate.errors[0].params);
    throw new APIError(validate.errors.map(e => `${e.dataPath} ${e.message} ${e.params ? JSON.stringify(e.params) : ''}`).join(', '), HTTP_ERR.USER_ERR);
  }
};

module.exports = {
  HTTP_ERR,
  TEXT_HEADER,
  JSON_HEADER,
  HTML_HEADER,
  CACHE_HEADER,
  logStart,
  fail,
  succeed,
  validateJSON,
  APIError,
};
