import { prisma } from '@/lib/prisma';

export async function createAuditLog(
  action: string,
  userId?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: { action, userId: userId ?? null, meta: (meta as any) ?? null },
    });
  } catch {
    // Non-critical, don't throw
    console.error('Failed to create audit log:', action);
  }
}
