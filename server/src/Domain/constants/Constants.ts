export const HEALTH_CHECK_TIMEOUT     = 2000;
export const HEALTH_CHECK_INTERVAL_MS = 10000;
export const DEGRADED_THRESHOLD_MS    = 500;

export const TEAM_NAME_MIN    = 2;
export const TEAM_NAME_MAX    = 80;
export const PROJECT_NAME_MIN = 2;
export const PROJECT_NAME_MAX = 120;
export const TASK_TITLE_MIN   = 2;
export const TASK_TITLE_MAX   = 200;

export const ESTIMATED_HOURS_MIN = 0.5;
export const ESTIMATED_HOURS_MAX = 500;
export const COMMENT_MAX_LENGTH  = 2000;

export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS ?? "10", 10);
