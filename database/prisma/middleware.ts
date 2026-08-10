import { Prisma } from '@prisma/client';

type PrismaMiddlewareParams = {
  model?: string;
  action: string;
  args: Record<string, any>;
};

type PrismaMiddlewareNext = (params: PrismaMiddlewareParams) => Promise<any>;

export function setupPrismaMiddleware(prisma: any) {
  // Soft Delete Middleware
  prisma.$use(async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
    if (params.model === 'User') {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = {
          deletedAt: new Date(),
        };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';

        if (params.args.data !== undefined) {
          params.args.data.deletedAt = new Date();
        } else {
          params.args.data = {
            deletedAt: new Date(),
          };
        }
      }

      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else {
          params.args.where = {
            deletedAt: null,
          };
        }
      }
    }

    return next(params);
  });

  // Query Logging & Performance Timing Middleware
  prisma.$use(async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
    const start = Date.now();

    const result = await next(params);

    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development' && duration > 200) {
      console.warn(`[Prisma Slow Query] ${params.model}.${params.action} took ${duration}ms`);
    }

    return result;
  });
}
