import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name || '',
      professional_title: user.professional_title || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
        features: user.tenant.features ? JSON.parse(user.tenant.features) : {}
      } : null
    });
  } catch (error) {
    console.error('Employer profile GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      professional_title,
      phone,
      companyName,
      website,
      description,
      location,
      logo
    } = await req.json();

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update User details
    await db.user.update({
      where: { id: session.userId },
      data: {
        name: name !== undefined ? name : user.name,
        professional_title: professional_title !== undefined ? professional_title : user.professional_title,
        phone: phone !== undefined ? phone : user.phone,
      }
    });

    // Update Tenant details if exists
    if (user.tenant_id) {
      const currentFeatures = user.tenant?.features ? JSON.parse(user.tenant.features) : {};
      
      const updatedFeatures = {
        ...currentFeatures,
        website: website !== undefined ? website : currentFeatures.website,
        description: description !== undefined ? description : currentFeatures.description,
        location: location !== undefined ? location : currentFeatures.location,
        logo: logo !== undefined ? logo : currentFeatures.logo
      };

      await db.tenant.update({
        where: { id: user.tenant_id },
        data: {
          name: companyName || user.tenant?.name || 'My Company',
          features: JSON.stringify(updatedFeatures)
        }
      });

      // Update all jobs of this employer with the updated company name to keep things perfectly synchronized in existing records!
      if (companyName) {
        await db.job.updateMany({
          where: { employer_id: session.userId },
          data: {
            company: companyName
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employer profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
