const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Foreground colors
const WHITE = '\x1b[37m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';

// Background colors for method badge
const BG_GREEN = '\x1b[42m';
const BG_BLUE = '\x1b[44m';
const BG_YELLOW = '\x1b[43m';
const BG_RED = '\x1b[41m';
const BG_MAGENTA = '\x1b[45m';
const BG_CYAN = '\x1b[46m';

const methodColor = (method) => {
  switch (method) {
    case 'GET':    return `${BG_GREEN}${BOLD} GET    ${RESET}`;
    case 'POST':   return `${BG_BLUE}${BOLD} POST   ${RESET}`;
    case 'PUT':    return `${BG_YELLOW}${BOLD} PUT    ${RESET}`;
    case 'PATCH':  return `${BG_CYAN}${BOLD} PATCH  ${RESET}`;
    case 'DELETE': return `${BG_RED}${BOLD} DELETE ${RESET}`;
    default:       return `${BG_MAGENTA}${BOLD} ${method.padEnd(6)} ${RESET}`;
  }
};

const statusColor = (status) => {
  if (status >= 500) return `${RED}${BOLD}${status}${RESET}`;
  if (status >= 400) return `${YELLOW}${BOLD}${status}${RESET}`;
  if (status >= 300) return `${CYAN}${BOLD}${status}${RESET}`;
  if (status >= 200) return `${GREEN}${BOLD}${status}${RESET}`;
  return `${WHITE}${status}${RESET}`;
};

const durationColor = (ms) => {
  if (ms >= 1000) return `${RED}${ms}ms${RESET}`;
  if (ms >= 300)  return `${YELLOW}${ms}ms${RESET}`;
  return `${GREEN}${ms}ms${RESET}`;
};

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture the original end to hook into response finish
  const originalEnd = res.end;
  res.end = function (...args) {
    res.end = originalEnd;
    res.end(...args);

    const ms = Date.now() - start;
    const status = res.statusCode;
    const contentLength = res.getHeader('content-length');
    const size = contentLength ? `${DIM} ${contentLength}b${RESET}` : '';

    function getTimestamp() {
      const now = new Date();

      return (
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0') + '.' +
        String(now.getMilliseconds()).padStart(3, '0')
      );
    }

    const timestamp = getTimestamp();

    let bodyStr = '';
    if (req.body && Object.keys(req.body).length > 0) {
      // Mask sensitive fields
      const masked = { ...req.body };
      for (const key of ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken']) {
        if (masked[key]) masked[key] = '***';
      }
      bodyStr = `\n         ${DIM}body  ${RESET}${YELLOW}${JSON.stringify(masked)}${RESET}`;
    }

    console.log(
      `${DIM}${timestamp}${RESET}  ` +
      `${methodColor(req.method)}  ` +
      `${CYAN}${req.originalUrl}${RESET}  ` +
      `${statusColor(status)}  ` +
      `${durationColor(ms)}` +
      `${size}` +
      `${bodyStr}`
    );
  };

  next();
};

module.exports = requestLogger;
