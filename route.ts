import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = await argon2.verify(user!.passwordHash, currentPassword);
    if (!valid) return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    updateData.passwordHash = await argon2.hash(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
