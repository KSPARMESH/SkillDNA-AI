import { Prisma } from '@prisma/client';

export const userExtensions = Prisma.defineExtension({
  name: 'userExtensions',
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`.trim();
        },
      },
    },
  },
});
