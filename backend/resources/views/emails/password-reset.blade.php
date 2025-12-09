<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo h1 {
            color: #e11d48;
            font-size: 28px;
            margin: 0;
        }

        h2 {
            color: #1e293b;
            font-size: 24px;
            margin-bottom: 20px;
        }

        p {
            color: #64748b;
            margin-bottom: 16px;
        }

        .button {
            display: inline-block;
            background: linear-gradient(135deg, #e11d48, #f97316);
            color: white !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }

        .button:hover {
            opacity: 0.9;
        }

        .warning {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .warning p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }

        .footer p {
            font-size: 12px;
            color: #94a3b8;
        }

        .link-fallback {
            word-break: break-all;
            font-size: 12px;
            color: #64748b;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="logo">
            <h1>✈️ {{ config('branding.name', 'Voyager') }}</h1>
        </div>

        <h2>Reset Your Password</h2>

        <p>Hello {{ $user->name ?? 'there' }},</p>

        <p>We received a request to reset your password for your {{ config('branding.name', 'Voyager') }} account. Click
            the button below to create a new password:</p>

        <div style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>

        <div class="warning">
            <p>⚠️ This link will expire in 1 hour for security reasons. If you didn't request a password reset, please
                ignore this email or contact support if you have concerns.</p>
        </div>

        <p class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            {{ $resetUrl }}
        </p>

        <div class="footer">
            <p>© {{ date('Y') }} {{ config('branding.name', 'Voyager') }} Travel. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>

</html>