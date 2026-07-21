import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import { EmailService } from '@/services/integrations/email.service';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    
    // Convert formData to simple object
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Verify the payment status
    if (data.payment_status === 'COMPLETE') {
      const paymentId = data.m_payment_id;
      if (paymentId) {
        if (paymentId.startsWith('JOB_')) {
          const jobId = parseInt(paymentId.split('_')[1], 10);
          
          // Update the job status
          if (!isNaN(jobId)) {
            const job = await db.job.update({
              where: { id: jobId },
              data: { status: 'ACTIVE' },
              include: { employer: true }
            });

            // Trigger email confirmation on successful Payfast webhook completion
            if (job.employer?.email) {
              try {
                const employerEmail = job.employer.email;
                const subject = `Payment Received & Role Activated: ${job.title} on LaunchPath`;
                const textCopy = `Your role "${job.title}" has been successfully activated on LaunchPath!\n\nWe have received your payment of R1,999 once-off.\n\nOur matching process has officially started. You can expect a curated shortlist of vetted candidates directly to your registered email within 5 working days.\n\nThank you for choosing LaunchPath.`;
                
                const htmlCopy = `
                  <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #5D3FD3; margin-top: 0; font-weight: 900; letter-spacing: 0.1em; font-size: 20px;">LAUNCHPATH</h2>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                    <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">Your role has been activated!</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                      Hi there,
                    </p>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                      Thank you for posting your vacancy on LaunchPath. We have successfully received your once-off payment of <strong>R1,999</strong> for the following role:
                    </p>
                    <div style="background-color: #f8fafc; padding: 18px; border-left: 4px solid #bdf500; margin: 18px 0; border-radius: 8px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="font-size: 16px; color: #0f172a;">${job.title}</strong><br/>
                      <span style="font-size: 13px; color: #64748b;">${job.company} &bull; ${job.location}</span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                      Our candidate screening and vetting pipelines have officially commenced. Our internal sourcing team is currently matching your hiring requirements with our vetted junior talent pool.
                    </p>
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 18px 0;">
                      <strong style="font-size: 13px; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">What happens next?</strong>
                      <p style="font-size: 13px; line-height: 1.5; color: #14532d; margin: 0;">
                        You will receive a curated shortlist of pre-screened candidate profiles delivered directly to <strong style="color: #0f172a;">${employerEmail}</strong> within <strong>5 working days</strong>. There is no need to scan through large volumes of irrelevant CVs—we deliver vetted talent straight to your inbox.
                      </p>
                    </div>
                    <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 24px;">
                      If you have any questions or would like to tweak your role criteria, please reply directly to this email or reach out to our team at support@launchpath.co.za.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
                      &copy; ${new Date().getFullYear()} LaunchPath. All rights reserved. <br/>
                      R1,999 flat-rate per role posted. Sourcing shortlist delivered by email.
                    </p>
                  </div>
                `;

                await EmailService.send(employerEmail, subject, textCopy, htmlCopy);
              } catch (emailErr) {
                console.error('Error sending webhook success email:', emailErr);
              }
            }
          }
        } else if (paymentId.startsWith('UNLOCK_JOB_')) {
          const jobId = parseInt(paymentId.split('_')[2], 10);
          if (!isNaN(jobId)) {
            const job = await db.job.findUnique({
              where: { id: jobId }
            });
            if (job && job.tenant_id) {
              const tenant = await db.tenant.findUnique({
                where: { id: job.tenant_id }
              });
              if (tenant) {
                let featuresObj: any = {};
                try {
                  featuresObj = JSON.parse(tenant.features || '{}');
                } catch (e) {
                  featuresObj = {};
                }
                if (!featuresObj.unlockedJobIds) {
                  featuresObj.unlockedJobIds = [];
                }
                if (!featuresObj.unlockedJobIds.includes(jobId)) {
                  featuresObj.unlockedJobIds.push(jobId);
                }
                await db.tenant.update({
                  where: { id: job.tenant_id },
                  data: {
                    features: JSON.stringify(featuresObj)
                  }
                });
              }
            }
          }
        } else if (paymentId.startsWith('UNLOCK_TENANT_')) {
          const tenantId = parseInt(paymentId.split('_')[2], 10);
          
          // Update the tenant plan to premium
          if (!isNaN(tenantId)) {
            await db.tenant.update({
              where: { id: tenantId },
              data: { plan: 'premium' }
            });
          }
        }
      }
    }

    // Always respond 200 OK so Payfast knows we received it
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Payfast Webhook ERror:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
