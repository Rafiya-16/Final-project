import { Request, Response, NextFunction } from 'express';
import { auditService } from '../modules/audit/audit.service';

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|rawdata|csv|file|credential/i;

function sanitize(value: any, depth = 0): any {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map(item => sanitize(item, depth + 1));
  if (typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 1000) : value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEYS.test(key))
      .slice(0, 50)
      .map(([key, item]) => [key, sanitize(item, depth + 1)])
  );
}

function getEntityType(path: string): string {
  if (/\/auth\//i.test(path)) return 'AUTH';
  if (/\/users?(\/|$)/i.test(path)) return 'USER';
  if (/\/pools?(\/|$)/i.test(path)) return 'POOL';
  if (/\/projects?(\/|$)/i.test(path)) return 'PROJECT';
  if (/\/teams?(\/|$)|\/team\//i.test(path)) return 'TEAM';
  if (/\/ideas?(\/|$)/i.test(path)) return 'IDEA';
  if (/\/notifications?(\/|$)/i.test(path)) return 'NOTIFICATION';
  return 'SYSTEM';
}

function getAction(method: string, path: string): string {
  const route = path.toLowerCase();
  if (route.includes('login')) return 'LOGIN';
  if (route.includes('logout')) return 'LOGOUT';
  if (route.includes('change-password')) return 'CHANGE_PASSWORD';
  if (route.includes('reset-password')) return 'RESET_PASSWORD';
  if (route.includes('bulk-import')) return 'BULK_IMPORT_USERS';
  if (route.includes('advance-phase')) return 'ADVANCE_POOL_PHASE';
  if (route.includes('activate')) return 'ACTIVATE_POOL';
  if (route.includes('archive')) return 'ARCHIVE_POOL';
  if (route.includes('freeze')) return 'FREEZE_POOL_OR_TEAM';
  if (route.includes('assign-users')) return 'ASSIGN_POOL_USERS';
  if (route.includes('approve-all')) return 'APPROVE_ALL_LOCKED_PROJECTS';
  if (route.includes('approve')) return 'APPROVE';
  if (route.includes('reject')) return 'REJECT';
  if (route.includes('lock')) return 'LOCK';
  if (route.includes('hold')) return 'HOLD';
  if (route.includes('invite') && route.includes('respond')) return 'RESPOND_TO_INVITE';
  if (route.includes('invite')) return 'SEND_TEAM_INVITE';
  if (route.includes('leave-request')) return method === 'PATCH' ? 'REVIEW_LEAVE_REQUEST' : 'CREATE_LEAVE_REQUEST';
  if (route.includes('dissolve')) return method === 'PATCH' ? 'REVIEW_DISSOLVE_REQUEST' : 'REQUEST_OR_DISSOLVE_TEAM';
  if (route.includes('select-project')) return 'SELECT_PROJECT';
  if (route.includes('submit')) return 'SUBMIT';
  if (route.includes('toggle-status')) return 'TOGGLE_USER_STATUS';
  if (route.includes('reset-password')) return 'RESET_PASSWORD';
  if (route.includes('members')) return 'MANAGE_TEAM_MEMBER';
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return method;
}

export const auditMutationLogger = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method) || /\/auth\/refresh\/?$/i.test(req.path)) {
    return next();
  }

  const originalJson = res.json.bind(res);
  let recorded = false;

  res.json = function (data: any) {
    if (!recorded && res.statusCode < 400) {
      recorded = true;
      const path = req.originalUrl.split('?')[0];
      const params = req.params || {};
      const actorId = req.user?.userId || data?.data?.user?.id || data?.data?.id;
      const entityId =
        params.id || params.projectId || params.teamId || params.poolId ||
        params.ideaId || params.requestId || params.inviteId || params.memberId ||
        data?.data?.id || data?.data?.user?.id;

      if (actorId) auditService.log(
        actorId,
        getAction(method, path),
        getEntityType(path),
        typeof entityId === 'string' ? entityId : undefined,
        undefined,
        sanitize(req.body),
        req.ip,
        req.get('User-Agent')
      ).catch(() => {
        // Audit persistence must not break the business operation response.
      });
    }
    return originalJson(data);
  };

  next();
};
