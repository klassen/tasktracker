import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/tenants/[id]/pin - Check if a PIN is required
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(id) },
      select: { adminPin: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const required = tenant.adminPin !== null || !!process.env.ADMIN_PIN;
    return NextResponse.json({ required });
  } catch (error) {
    console.error('Error checking PIN:', error);
    return NextResponse.json({ error: 'Failed to check PIN' }, { status: 500 });
  }
}

// POST /api/tenants/[id]/pin - Verify the admin PIN
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(id) },
      select: { adminPin: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.adminPin) {
      // No PIN set — check server-side fallback env var
      const fallbackPin = process.env.ADMIN_PIN;
      const valid = fallbackPin ? pin === fallbackPin : true;
      return NextResponse.json({ valid });
    }

    const valid = await bcrypt.compare(pin, tenant.adminPin);
    return NextResponse.json({ valid });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
  }
}

// PATCH /api/tenants/[id]/pin - Set or clear the admin PIN
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pin } = body;

    // pin: string to set, null/empty to clear
    let hashedPin: string | null = null;
    if (pin && typeof pin === 'string' && pin.length > 0) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    await prisma.tenant.update({
      where: { id: parseInt(id) },
      data: { adminPin: hashedPin },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting PIN:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }
}
