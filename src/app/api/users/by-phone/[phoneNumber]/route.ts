import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users, plans, roles, permissions } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const phoneNumber = params.phoneNumber;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // 1. Find the user by phone number
    const userResult = await db
      .select({
        id: users.id,
        roleId: users.roleId,
        planId: users.planId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.phone, phoneNumber))
      .limit(1);

    const user = userResult[0];

    if (!user || !user.isActive) {
      return NextResponse.json(
        { hasWhatsAppAccess: false, reason: 'User not found or is inactive' },
        { status: 404 }
      );
    }

    // 2. Get the user's plan details to check for WhatsApp permission
    if (!user.planId) {
        return NextResponse.json(
            { hasWhatsAppAccess: false, reason: 'User does not have an active plan' },
            { status: 403 }
        );
    }
    
    const planResult = await db
        .select({
            whatsAppIntegration: plans.whatsAppIntegration
        })
        .from(plans)
        .where(eq(plans.id, user.planId))
        .limit(1);

    const plan = planResult[0];

    if (!plan) {
        return NextResponse.json(
            { hasWhatsAppAccess: false, reason: 'Plan not found for user' },
            { status: 404 }
        );
    }

    const hasWhatsAppAccess = plan.whatsAppIntegration === true;

    return NextResponse.json({
      userId: user.id,
      roleId: user.roleId,
      planId: user.planId,
      hasWhatsAppAccess: hasWhatsAppAccess,
    });
    
  } catch (error) {
    console.error('[API_USER_BY_PHONE] Error fetching user by phone number:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 