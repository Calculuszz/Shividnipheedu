import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import { sendEmail } from '@/lib/email';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 3; // Max 3 registrations per minute per IP

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];

  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registration request received:', {
      studentId: body.studentId,
      email: body.email,
      fullName: body.fullName
    });

    const {
      studentId,
      fullName,
      faculty,
      gender,
      year,
      referralSource,
      interestedActivities,
      transportation,
      email,
    } = body;

    // Validate required fields
    if (!studentId || !email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const identifier = studentId; // Use student ID as unique identifier
    if (!checkRateLimit(identifier)) {
      console.log('⏱️ Rate limit exceeded for:', identifier);
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    // 1. Generate QR code
    const qrData = `SHIVIDNIPHEEDU-${studentId}-${Date.now()}`;
    let qrCodeDataUrl = '';

    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#24033a',
          light: '#f5eee6',
        },
      });
      console.log('✅ QR Code generated');
    } catch (qrError) {
      console.error('❌ QR Code error:', qrError);
    }

    // 2. Insert into Supabase (the only copy of the data, so a failure must stop the registration)
    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert([
          {
            student_id: studentId,
            full_name: fullName,
            email: email,
            department: faculty,
            gender: gender,
            year: year,
            referral_source: referralSource,
            interested_activities: Array.isArray(interestedActivities) ? interestedActivities.join(', ') : '',
            transportation: transportation,
            qr_code: qrData,
            attended: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        // 23505 = unique violation (student already registered)
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'รหัสนี้ลงทะเบียนไว้แล้ว ผีจำคุณได้! กลับไปเข้าสู่ระบบได้เลย' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'ผีทำข้อมูลหล่นหาย ลองกดยืนยันอีกครั้งนะ' },
          { status: 500 }
        );
      }
      console.log('✅ Supabase insert successful', data);
    } catch (supabaseError) {
      console.error('❌ Supabase exception:', supabaseError);
      return NextResponse.json(
        { error: 'ผีทำข้อมูลหล่นหาย ลองกดยืนยันอีกครั้งนะ' },
        { status: 500 }
      );
    }

    // Login link for the email: explicit setting > this Vercel project's production domain > local dev
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000');

    // 3. Send confirmation email
    // Note: Sends in background. Email errors are logged but don't block registration.
    const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;
                background-color: #f5f5f5;
                color: #2d2d2d;
                padding: 20px;
                margin: 0;
                line-height: 1.6;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                text-align: center;
                background-color: #24033a;
                color: #bbd03c;
                font-size: 28px;
                font-weight: bold;
                padding: 30px 20px;
                margin: 0;
              }
              .content {
                background-color: #ffffff;
                padding: 40px 30px;
              }
              .content h2 {
                color: #ea7b29;
                margin-top: 0;
                font-size: 24px;
              }
              .content p {
                color: #2d2d2d;
                font-size: 16px;
                margin: 15px 0;
              }
              .qr-code {
                text-align: center;
                margin: 30px 0;
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 8px;
                border: 2px solid #4a3167;
              }
              .qr-code p {
                margin: 10px 0;
              }
              .qr-code img {
                max-width: 300px;
                width: 100%;
                height: auto;
                display: block;
                margin: 20px auto;
                border-radius: 8px;
              }
              .info-box {
                background-color: #f5eee6;
                border-left: 4px solid #ea7b29;
                border-radius: 5px;
                padding: 20px;
                margin: 25px 0;
                color: #2d2d2d;
              }
              .info-box strong {
                color: #4a3167;
                font-size: 16px;
              }
              .login-link {
                display: inline-block;
                background-color: #ea7b29;
                color: #24033a !important;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
                font-size: 16px;
              }
              .footer {
                text-align: center;
                color: #666666;
                padding: 20px 30px;
                font-size: 14px;
                background-color: #f9f9f9;
                border-top: 1px solid #e0e0e0;
              }
              .footer a {
                color: #ea7b29;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">🎃 SHIVIDNI PHEEDU 🎃</div>
              <div class="content">
                <h2>สวัสดีคุณ ${fullName}!</h2>
                <p>ขอบคุณที่ลงทะเบียนเข้าร่วมงาน SHIVIDNI PHEEDU 🎉</p>
                <p>การลงทะเบียนของคุณเสร็จสมบูรณ์แล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสนิสิตของคุณได้แล้ว!</p>

                <div class="info-box">
                  <strong>รหัสนิสิตของคุณ:</strong> ${studentId}<br/><br/>
                  <a href="${siteUrl}" class="login-link">เข้าสู่ระบบที่นี่</a>
                </div>

                ${qrCodeDataUrl ? `
                  <div class="qr-code">
                    <p><strong style="color: #ea7b29; font-size: 18px;">QR Code สำหรับเช็คอิน</strong></p>
                    <p style="color: #666666; font-size: 14px;">กรุณาแสดง QR Code นี้เมื่อเข้างาน</p>
                    <img src="cid:qrcode" alt="QR Code สำหรับเช็คอิน" />
                  </div>
                ` : ''}

                <p style="color: #2d2d2d; font-size: 16px;">เราหวังว่าจะได้พบคุณในงาน! 👻</p>
              </div>
              <div class="footer">
                <p>ติดตามข่าวสารเพิ่มเติมได้ที่<br/>
                Instagram: <a href="https://instagram.com/shividni.pheedu" target="_blank">@shividni.pheedu</a></p>
                <p style="font-size: 12px; color: #999999; margin-top: 15px;">
                  คณะพาณิชยศาสตร์และการบัญชี X คณะวิศวกรรมศาสตร์ X คณะนิเทศศาสตร์
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

    // Send email in background (don't block the response)
    sendEmail({
      to: email,
      subject: 'ยืนยันการลงทะเบียน SHIVIDNI PHEEDU',
      html: emailHtml,
      attachments: qrCodeDataUrl ? [{
        filename: 'qrcode.png',
        content: qrCodeDataUrl.split(',')[1],
        cid: 'qrcode',
        encoding: 'base64'
      }] : undefined,
    }).then(result => {
      if (result.success) {
        console.log('✅ Email sent successfully');
      } else {
        console.error('❌ Email failed to send:', result.error);
      }
    }).catch(err => {
      console.error('❌ Email exception:', err);
    });

    console.log('✅ Registration completed successfully (email sending in background)');
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      qr_code: qrData
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
