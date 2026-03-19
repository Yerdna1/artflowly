import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Internal endpoint called by the webhook bridge to set a user's
 * per-user New API token after subscription provisioning.
 *
 * POST { email, newapiApiKey, secret }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newapiApiKey, secret } = body;

    // Validate shared secret
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!email || !newapiApiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: email, newapiApiKey' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 404 }
      );
    }

    // Upsert ApiKeys with the newapi key
    await prisma.apiKeys.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        newapiApiKey,
      },
      update: {
        newapiApiKey,
      },
    });

    console.log(`[set-newapi-key] Set New API key for user ${email} (${user.id})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[set-newapi-key] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
