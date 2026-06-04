<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Registration Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f5ef; padding: 40px 0; margin: 0; color: #201a12;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #eadcc2; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #201a12; font-size: 24px;">Confirm Your Email</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #4a4a4a; margin-bottom: 30px;">
            Thank you for registering! Please use the following 6-digit code to complete your registration. This code will expire in 10 minutes.
        </p>
        <div style="background-color: #f8f5ef; padding: 20px; text-align: center; border-radius: 6px; border: 1px dashed #d9c7a6; margin-bottom: 30px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2f2517;">{{ $code }}</span>
        </div>
        <p style="font-size: 14px; color: #6b6b6b; margin-top: 40px;">
            If you did not request this code, you can safely ignore this email.
        </p>
    </div>
</body>
</html>