import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/login - Verify credentials and return tenant info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountName, password } = body;

    if (!accountName || !password) {
      return NextResponse.json(
        { error: 'Account name and password are required' },
        { status: 400 }
      );
    }

    // Check for admin login
    if (accountName.toLowerCase() === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return NextResponse.json(
          { error: 'Admin login is not configured' },
          { status: 500 }
        );
      }

      if (password === adminPassword) {
        return NextResponse.json({
          tenantId: 'admin',
          tenantName: 'Admin',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Find tenant by name (case-insensitive)
    const tenant = await prisma.tenant.findFirst({
      where: {
        name: {
          equals: accountName.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, tenant.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return tenant info (not password)
    return NextResponse.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
