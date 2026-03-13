const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

export const logger = {
  step: (msg: string) => console.log(`${BOLD}${CYAN}▶ ${msg}${RESET}`),
  success: (msg: string) => console.log(`${GREEN}✓ ${msg}${RESET}`),
  warn: (msg: string) => console.log(`${YELLOW}⚠ ${msg}${RESET}`),
  error: (msg: string) => console.error(`${RED}✗ ${msg}${RESET}`),
  info: (msg: string) => console.log(`${DIM}  ${msg}${RESET}`),
  skip: (msg: string) => console.log(`${DIM}  ↷ skipping: ${msg}${RESET}`),
};
