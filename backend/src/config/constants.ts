export const ROLES = {
  ADMIN: 'ADMIN',
  SUBADMIN: 'SUBADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
} as const;

export const TEAM_DEFAULTS = {
  MIN_SIZE: 3,
  MAX_SIZE: 4,
  ABSOLUTE_MAX: 4,
} as const;

export const PROPOSALS_PER_FACULTY = 4;
export const LOCK_COUNT = 3;
export const HOLD_COUNT = 1;

export const IMPORT_LIMITS = {
  MAX_ROWS: 500,
  MAX_FILE_SIZE_MB: 5,
  BATCH_SIZE: 50,
} as const;

export const EMAIL_TRIGGER_EVENTS = [
  'TEAM_INVITE',
  'PROPOSAL_APPROVED',
  'PROPOSAL_REJECTED',
  'TEAM_FROZEN',
  'IDEA_APPROVED',
  'IDEA_REJECTED',
  'DEADLINE_REMINDER',
] as const;