import { PrismaClient } from '@prisma/client';
import { prisma } from './client';

export async function executeTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await fn(tx);
      }, {
        timeout: 10000,
        maxWait: 5000,
      });
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Transaction failed after ${maxRetries} attempts: ${error.message}`);
      }
      await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Transaction execution unhandled error');
}
