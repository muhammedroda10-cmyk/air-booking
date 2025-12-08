<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Booking Confirmation</title>
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
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header .pnr {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #fbbf24;
        }
        .content {
            padding: 30px 40px;
        }
        .success-badge {
            display: inline-block;
            background: #dcfce7;
            color: #16a34a;
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
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .flight-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .flight-route {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .airport {
            text-align: center;
        }
        .airport-code {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
        }
        .airport-city {
            font-size: 12px;
            color: #64748b;
        }
        .flight-line {
            flex: 1;
            height: 2px;
            background: #e2e8f0;
            margin: 0 20px;
            position: relative;
        }
        .flight-line::after {
            content: "✈️";
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
        }
        .flight-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 14px;
        }
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        .detail-label {
            color: #64748b;
            font-size: 12px;
        }
        .detail-value {
            color: #1e293b;
            font-weight: 600;
        }
        .passenger-list {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
        }
        .passenger-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .passenger-item:last-child {
            border-bottom: none;
        }
        .price-summary {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .price-total {
            font-size: 24px;
            font-weight: bold;
            border-top: 1px solid rgba(255,255,255,0.2);
            padding-top: 10px;
            margin-top: 10px;
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
        .info-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .info-box p {
            color: #1e40af;
            margin: 0;
            font-size: 14px;
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
            <h1>✈️ Voyager</h1>
            <p style="margin: 0; opacity: 0.8;">Booking Confirmation</p>
            <div class="pnr">{{ $booking->pnr }}</div>
        </div>

        <div class="content">
            <span class="success-badge">✓ Booking Confirmed</span>

            <p>Dear {{ $user->name ?? 'Traveler' }},</p>
            <p>Your booking has been confirmed. Please find your flight details below.</p>

            <h2>Flight Details</h2>
            <div class="flight-card">
                @if($flight)
                <div class="flight-route">
                    <div class="airport">
                        <div class="airport-code">{{ $flight->originAirport->code ?? 'XXX' }}</div>
                        <div class="airport-city">{{ $flight->originAirport->city ?? 'Origin' }}</div>
                    </div>
                    <div class="flight-line"></div>
                    <div class="airport">
                        <div class="airport-code">{{ $flight->destinationAirport->code ?? 'YYY' }}</div>
                        <div class="airport-city">{{ $flight->destinationAirport->city ?? 'Destination' }}</div>
                    </div>
                </div>
                <div class="flight-details">
                    <div class="detail-item">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">{{ \Carbon\Carbon::parse($flight->departure_time)->format('D, M d, Y') }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Departure</span>
                        <span class="detail-value">{{ \Carbon\Carbon::parse($flight->departure_time)->format('H:i') }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Airline</span>
                        <span class="detail-value">{{ $flight->airline->name ?? 'Airline' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Flight</span>
                        <span class="detail-value">{{ $flight->flight_number }}</span>
                    </div>
                </div>
                @else
                <p>Flight details are included in your booking confirmation.</p>
                @endif
            </div>

            <h2>Passengers</h2>
            <div class="passenger-list">
                @foreach($booking->passengers as $index => $passenger)
                <div class="passenger-item">
                    <span>{{ $index + 1 }}. {{ $passenger->first_name ?? '' }} {{ $passenger->last_name ?? $passenger->name }}</span>
                    <span style="color: #64748b;">{{ ucfirst($passenger->passenger_type ?? 'adult') }}</span>
                </div>
                @endforeach
            </div>

            <h2>Payment Summary</h2>
            <div class="price-summary">
                <div class="price-row">
                    <span>Subtotal</span>
                    <span>${{ number_format($booking->total_price, 2) }}</span>
                </div>
                @if(isset($discount) && $discount > 0)
                <div class="price-row">
                    <span>Discount</span>
                    <span style="color: #4ade80;">-${{ number_format($discount, 2) }}</span>
                </div>
                @endif
                <div class="price-row price-total">
                    <span>Total Paid</span>
                    <span>${{ number_format($booking->total_price, 2) }}</span>
                </div>
            </div>

            <div class="info-box">
                <p>📋 <strong>Important:</strong> Please arrive at the airport at least 2 hours before your domestic flight or 3 hours for international flights. Don't forget to bring a valid ID/passport.</p>
            </div>

            <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/dashboard/tickets?booking={{ $booking->id }}" class="button">
                View Your Ticket
            </a>
        </div>

        <div class="footer">
            <p>Need help? Contact us at support@voyager.com</p>
            <p>© {{ date('Y') }} Voyager Travel. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
