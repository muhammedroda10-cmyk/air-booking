<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flight Reminder</title>
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
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9, #2563eb);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .countdown {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        .countdown-label {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 40px;
        }
        .reminder-badge {
            display: inline-block;
            background: #fef3c7;
            color: #d97706;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 20px;
        }
        h2 {
            color: #1e293b;
            font-size: 20px;
            margin: 25px 0 15px 0;
        }
        .flight-summary {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            text-align: center;
        }
        .route {
            font-size: 32px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        .route-arrow {
            color: #e11d48;
            margin: 0 10px;
        }
        .flight-time {
            font-size: 18px;
            color: #64748b;
        }
        .checklist {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
        }
        .checklist h3 {
            color: #16a34a;
            margin: 0 0 15px 0;
            font-size: 16px;
        }
        .checklist ul {
            margin: 0;
            padding-left: 20px;
        }
        .checklist li {
            color: #166534;
            margin-bottom: 8px;
        }
        .important-info {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
        }
        .important-info h3 {
            color: #dc2626;
            margin: 0 0 15px 0;
            font-size: 16px;
        }
        .important-info ul {
            margin: 0;
            padding-left: 20px;
            color: #991b1b;
        }
        .important-info li {
            margin-bottom: 8px;
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
            text-align: center;
            width: 100%;
            box-sizing: border-box;
        }
        .footer {
            text-align: center;
            padding: 20px 40px 30px;
            background: #f8fafc;
        }
        .footer p {
            font-size: 12px;
            color: #94a3b8;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ Flight Reminder</h1>
            <div class="countdown">24h</div>
            <div class="countdown-label">until your flight!</div>
        </div>

        <div class="content">
            <span class="reminder-badge">⏰ Don't forget!</span>

            <p>Dear {{ $user->name ?? 'Traveler' }},</p>
            <p>This is a friendly reminder that your flight is departing tomorrow. Please make sure you're prepared for your journey!</p>

            <div class="flight-summary">
                @if($flight)
                <div class="route">
                    {{ $flight->originAirport->code ?? 'XXX' }}
                    <span class="route-arrow">→</span>
                    {{ $flight->destinationAirport->code ?? 'YYY' }}
                </div>
                <div class="flight-time">
                    {{ \Carbon\Carbon::parse($flight->departure_time)->format('l, F d, Y') }}<br>
                    <strong>{{ \Carbon\Carbon::parse($flight->departure_time)->format('H:i') }}</strong>
                </div>
                @endif
            </div>

            <div class="checklist">
                <h3>✓ Pre-Flight Checklist</h3>
                <ul>
                    <li>Valid passport/ID (check expiry date!)</li>
                    <li>Printed or mobile boarding pass</li>
                    <li>Booking confirmation (PNR: {{ $booking->pnr }})</li>
                    <li>Check baggage allowance</li>
                    <li>Phone charger and essentials in carry-on</li>
                </ul>
            </div>

            <div class="important-info">
                <h3>⚠️ Important Reminders</h3>
                <ul>
                    <li>Arrive at least <strong>2-3 hours</strong> before departure</li>
                    <li>Check-in online to save time at the airport</li>
                    <li>Review COVID-19 or health requirements if applicable</li>
                    <li>Note your terminal and gate information</li>
                </ul>
            </div>

            <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/dashboard/tickets?booking={{ $booking->id }}" class="button">
                View Your Ticket
            </a>
        </div>

        <div class="footer">
            <p>Have a safe and pleasant flight! ✈️</p>
            <p>© {{ date('Y') }} Voyager Travel. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
