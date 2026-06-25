const otpEmailTemplate = ({ otp, firstName }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#D85A30,#FF8C5A);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-size:22px;font-weight:900;">E</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:900;margin:0;">Password Reset</h1>
      <p style="color:#64748B;font-size:13px;margin:6px 0 0;">E-Commerce Platform</p>
    </div>

    <div style="padding:40px;">
      <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 28px;">
        We received a request to reset your password. Use the OTP below to continue. 
        This OTP is valid for <strong style="color:#111;">10 minutes</strong> only.
      </p>

      <div style="background:linear-gradient(135deg,#FFF5F0,#FFF8F5);border:2px solid #FDBA74;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="font-size:12px;font-weight:700;color:#D85A30;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">Your OTP Code</p>
        <div style="letter-spacing:12px;font-size:40px;font-weight:900;color:#111;font-family:monospace;">${otp}</div>
        <p style="font-size:11px;color:#9CA3AF;margin:10px 0 0;">Expires in 10 minutes</p>
      </div>

      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:14px 18px;margin-bottom:28px;">
        <p style="font-size:12px;color:#DC2626;margin:0;font-weight:600;">
          🔐 Never share this OTP with anyone. Our team will never ask for it.
        </p>
      </div>

      <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;">
        If you didn't request this, you can safely ignore this email. 
        Your password will remain unchanged.
      </p>
    </div>

    <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#9CA3AF;margin:0;">
        © ${new Date().getFullYear()} E-Commerce. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { otpEmailTemplate };