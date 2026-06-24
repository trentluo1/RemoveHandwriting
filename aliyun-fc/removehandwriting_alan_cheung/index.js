/**
 * Aliyun FC: removehandwriting_alan_cheung
 * Domain route: api.removehandwriting.com/alan/cleanup
 * Upstream:     https://sjccup.market.alicloudapi.com/sjccup
 *
 * Env:
 *   REQUEST_TIMEOUT_MS       upstream fetch timeout per attempt (default 60000)
 *   UPSTREAM_RETRY_COUNT     retries after timeout (default 1)
 *   UPSTREAM_RETRY_DELAY_MS  delay before retry (default 2000)
 *
 * FC function timeout should be >= (REQUEST_TIMEOUT_MS + UPSTREAM_RETRY_DELAY_MS) * (UPSTREAM_RETRY_COUNT + 1) + 10000
 */
const http = require('http');

const APPCODE = process.env.ALIYUN_APPCODE || '0cc2b31145ce4eca811b5cd341712db6';
const TARGET_ORIGIN = 'https://sjccup.market.alicloudapi.com';
const PUBLIC_PATH = '/alan/cleanup';
const UPSTREAM_PATH = '/sjccup';
const PORT = Number(process.env.PORT || 9000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60000);
const UPSTREAM_RETRY_COUNT = Number(process.env.UPSTREAM_RETRY_COUNT || 1);
const UPSTREAM_RETRY_DELAY_MS = Number(process.env.UPSTREAM_RETRY_DELAY_MS || 2000);
const MAX_BODY_SIZE = 8 * 1024 * 1024;
const SERVER_REQUEST_TIMEOUT_MS = Number(
  process.env.SERVER_REQUEST_TIMEOUT_MS ||
    (REQUEST_TIMEOUT_MS + UPSTREAM_RETRY_DELAY_MS) * (UPSTREAM_RETRY_COUNT + 1) + 15000
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    'Content-Length': '0',
  });
  res.end();
}

function getRequestPath(reqUrl) {
  try {
    const parsed = new URL(reqUrl || '/', 'http://localhost');
    return parsed.pathname || '/';
  } catch {
    return '/';
  }
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_SIZE) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(chunks.length ? Buffer.concat(chunks) : null);
    });

    req.on('error', reject);
    req.on('aborted', () => reject(new Error('CLIENT_ABORTED')));
  });
}

function buildUpstreamHeaders(req, hasBody) {
  const headers = {
    Authorization: `APPCODE ${APPCODE}`,
    Accept: req.headers.accept || 'application/json',
    'User-Agent': 'AliyunFC-Proxy/2.3',
  };

  if (hasBody) {
    headers['Content-Type'] = req.headers['content-type'] || 'application/json; charset=utf-8';
  }

  return headers;
}

async function fetchUpstreamOnce(method, headers, bodyBuffer, attempt) {
  const targetUrl = `${TARGET_ORIGIN}${UPSTREAM_PATH}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const attemptStart = Date.now();

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body: bodyBuffer || undefined,
      signal: controller.signal,
    });

    const upstreamMs = Date.now() - attemptStart;
    const responseStart = Date.now();
    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseReadMs = Date.now() - responseStart;

    return {
      upstreamResponse,
      responseBuffer,
      timings: { upstreamMs, responseReadMs, attempt },
    };
  } catch (error) {
    const upstreamMs = Date.now() - attemptStart;
    throw Object.assign(error, { upstreamMs, attempt });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUpstreamWithRetry(method, headers, bodyBuffer) {
  const maxAttempts = UPSTREAM_RETRY_COUNT + 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      console.log('Retrying upstream after timeout', {
        attempt,
        maxAttempts,
        delayMs: UPSTREAM_RETRY_DELAY_MS,
      });
      await sleep(UPSTREAM_RETRY_DELAY_MS);
    }

    try {
      return await fetchUpstreamOnce(method, headers, bodyBuffer, attempt);
    } catch (error) {
      lastError = error;
      const isTimeout = error && error.name === 'AbortError';
      const canRetry = isTimeout && attempt < maxAttempts;

      console.error('Upstream attempt failed', {
        attempt,
        maxAttempts,
        upstreamMs: error.upstreamMs,
        name: error?.name || 'Error',
        message: error?.message || 'Unknown error',
        willRetry: canRetry,
      });

      if (!canRetry) {
        throw error;
      }
    }
  }

  throw lastError || new Error('UPSTREAM_FAILED');
}

async function proxyRequest(req, res) {
  const startedAt = Date.now();
  const method = (req.method || 'GET').toUpperCase();
  const requestPath = getRequestPath(req.url);

  if (method === 'OPTIONS') {
    sendEmpty(res, 204);
    return;
  }

  // FC custom domain may strip /alan/cleanup and pass "/" to the function.
  if (requestPath !== PUBLIC_PATH && requestPath !== '/') {
    sendJson(res, 404, {
      error: 'NOT_FOUND',
      message: 'The requested path was not found.',
    });
    return;
  }

  let bodyBuffer = null;
  const bodyReadStart = Date.now();

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      bodyBuffer = await collectBody(req);
    } catch (error) {
      if (error.message === 'BODY_TOO_LARGE') {
        sendJson(res, 413, {
          error: 'BODY_TOO_LARGE',
          message: 'The request body is too large.',
        });
        return;
      }

      sendJson(res, 400, {
        error: 'INVALID_REQUEST',
        message: 'The request body could not be read.',
      });
      return;
    }
  }

  const bodyReadMs = Date.now() - bodyReadStart;

  try {
    const headers = buildUpstreamHeaders(req, !!bodyBuffer);
    const { upstreamResponse, responseBuffer, timings } = await fetchUpstreamWithRetry(
      method,
      headers,
      bodyBuffer
    );

    const contentType =
      upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';

    res.writeHead(upstreamResponse.status, {
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Content-Length': responseBuffer.length,
    });
    res.end(responseBuffer);

    console.log('Request completed', {
      method,
      publicPath: requestPath,
      upstreamPath: UPSTREAM_PATH,
      status: upstreamResponse.status,
      durationMs: Date.now() - startedAt,
      bodyReadMs,
      upstreamMs: timings.upstreamMs,
      responseReadMs: timings.responseReadMs,
      attempt: timings.attempt,
      requestBodyBytes: bodyBuffer?.length ?? 0,
      responseBytes: responseBuffer.length,
    });
  } catch (error) {
    const isTimeout = error && error.name === 'AbortError';

    console.error('Request failed', {
      method,
      path: requestPath,
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      durationMs: Date.now() - startedAt,
      bodyReadMs,
      upstreamMs: error.upstreamMs,
      attempt: error.attempt,
      requestBodyBytes: bodyBuffer?.length ?? 0,
      error: isTimeout ? 'UPSTREAM_TIMEOUT' : 'PROXY_ERROR',
    });

    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout ? 'UPSTREAM_TIMEOUT' : 'PROXY_ERROR',
      message: isTimeout
        ? 'The upstream request timed out.'
        : 'The proxy request failed.',
    });
  }
}

const server = http.createServer((req, res) => {
  proxyRequest(req, res).catch((error) => {
    console.error('Unhandled error', {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
    });

    if (!res.headersSent) {
      sendJson(res, 500, {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'The server encountered an internal error.',
      });
    } else {
      res.end();
    }
  });
});

server.keepAliveTimeout = 65000;
server.headersTimeout = SERVER_REQUEST_TIMEOUT_MS + 1000;
server.requestTimeout = SERVER_REQUEST_TIMEOUT_MS;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`removehandwriting_alan_cheung: ${PUBLIC_PATH} -> ${TARGET_ORIGIN}${UPSTREAM_PATH}`, {
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    upstreamRetryCount: UPSTREAM_RETRY_COUNT,
    upstreamRetryDelayMs: UPSTREAM_RETRY_DELAY_MS,
    serverRequestTimeoutMs: SERVER_REQUEST_TIMEOUT_MS,
  });
});
