<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Boarding Pass - {{ $booking['pnr'] }}</title>
</head>

<body style="margin:0;padding:30px;font-family:Arial,Helvetica,sans-serif;background:#e5e7eb;">
    <div
        style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:20px 24px;color:#fff;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="vertical-align:middle;">
                        <div
                            style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;margin-right:12px;vertical-align:middle;font-size:18px;">
                            [AIR]
                        </div>
                        <div style="display:inline-block;vertical-align:middle;">
                            <div style="font-size:16px;font-weight:bold;">Boarding Pass</div>
                            <div style="font-size:12px;color:#94a3b8;margin-top:2px;">{{ $flight['airline'] }}</div>
                        </div>
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                        <span
                            style="background:#22c55e;color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">Confirmed</span>
                    </td>
                </tr>
            </table>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <tr>
                    <td>
                        <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Booking
                            Reference</div>
                        <div
                            style="font-size:24px;font-weight:bold;letter-spacing:3px;font-family:monospace;margin-top:4px;">
                            {{ $booking['pnr'] }}</div>
                    </td>
                    <td style="text-align:right;">
                        <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Class
                        </div>
                        <span
                            style="display:inline-block;background:#334155;padding:6px 12px;border-radius:6px;font-size:12px;margin-top:4px;">{{ $flight['cabin'] ?? 'Economy' }}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Route -->
        <div style="padding:28px 24px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="width:30%;vertical-align:top;">
                        <div style="font-size:42px;font-weight:bold;color:#1e293b;letter-spacing:2px;">
                            {{ $flight['origin']['airport'] }}</div>
                        <div style="font-size:13px;color:#64748b;margin-top:4px;">{{ $flight['origin']['city'] }}</div>
                        @if($flight['origin']['terminal'])
                            <div style="font-size:11px;color:#64748b;margin-top:2px;">Terminal
                                {{ $flight['origin']['terminal'] }}</div>
                        @endif
                        <div style="font-size:20px;font-weight:600;color:#dc2626;margin-top:10px;">
                            {{ $flight['departure_time'] }}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:2px;">{{ $flight['departure_date'] }}</div>
                    </td>
                    <td style="width:40%;text-align:center;vertical-align:middle;padding:0 10px;">
                        <div style="font-size:11px;color:#64748b;">{{ $flight['flight_number'] }}</div>
                        <div style="margin:12px 0;">
                            <span
                                style="display:inline-block;width:10px;height:10px;background:#dc2626;border-radius:50%;vertical-align:middle;"></span>
                            <span
                                style="display:inline-block;width:80px;height:2px;background:#ccc;vertical-align:middle;"></span>
                            <span
                                style="display:inline-block;vertical-align:middle;margin:0 4px;font-size:14px;color:#64748b;">&gt;</span>
                            <span
                                style="display:inline-block;width:80px;height:2px;background:#ccc;vertical-align:middle;"></span>
                            <span
                                style="display:inline-block;width:10px;height:10px;background:#3b82f6;border-radius:50%;vertical-align:middle;"></span>
                        </div>
                        <div style="font-size:11px;color:#64748b;">Duration: {{ $flight['duration'] }}</div>
                        @if($flight['aircraft'])
                            <div style="font-size:10px;color:#94a3b8;margin-top:4px;">{{ $flight['aircraft'] }}</div>
                        @endif
                    </td>
                    <td style="width:30%;text-align:right;vertical-align:top;">
                        <div style="font-size:42px;font-weight:bold;color:#1e293b;letter-spacing:2px;">
                            {{ $flight['destination']['airport'] }}</div>
                        <div style="font-size:13px;color:#64748b;margin-top:4px;">{{ $flight['destination']['city'] }}
                        </div>
                        @if($flight['destination']['terminal'])
                            <div style="font-size:11px;color:#64748b;margin-top:2px;">Terminal
                                {{ $flight['destination']['terminal'] }}</div>
                        @endif
                        <div style="font-size:20px;font-weight:600;color:#1e293b;margin-top:10px;">
                            {{ $flight['arrival_time'] }}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:2px;">{{ $flight['departure_date'] }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Info Cards -->
        <div style="padding:0 24px 24px;">
            <table style="width:100%;border-collapse:separate;border-spacing:8px 0;">
                <tr>
                    <td style="width:25%;background:#f8fafc;border-radius:8px;padding:14px;">
                        <div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">DATE</div>
                        <div style="font-size:14px;font-weight:600;color:#1e293b;">{{ $flight['departure_date'] }}</div>
                    </td>
                    <td style="width:25%;background:#f8fafc;border-radius:8px;padding:14px;">
                        <div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">FLIGHT
                        </div>
                        <div style="font-size:14px;font-weight:600;color:#1e293b;">{{ $flight['flight_number'] }}</div>
                    </td>
                    <td style="width:25%;background:#f8fafc;border-radius:8px;padding:14px;">
                        <div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">GATE</div>
                        <div style="font-size:14px;font-weight:600;color:#1e293b;">TBD</div>
                    </td>
                    <td style="width:25%;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;">
                        <div style="font-size:9px;color:#dc2626;text-transform:uppercase;margin-bottom:6px;">BOARDING
                        </div>
                        <div style="font-size:14px;font-weight:600;color:#dc2626;">{{ $boarding_time }}</div>
                    </td>
                </tr>
            </table>
        </div>

        @if($flight['luggage'])
            <!-- Baggage -->
            <div style="padding:0 24px 16px;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">
                    <span style="font-size:11px;color:#166534;font-weight:600;">BAGGAGE:</span>
                    <span style="font-size:11px;color:#166534;margin-left:8px;">{{ $flight['luggage'] }}</span>
                </div>
            </div>
        @endif

        <!-- Divider -->
        <div style="margin:0 24px;height:1px;background:#e2e8f0;"></div>

        <!-- Passengers -->
        <div style="padding:24px;">
            <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:14px;">PASSENGERS</div>
            @foreach($passengers as $passenger)
                <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-bottom:8px;">
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="vertical-align:middle;">
                                <span
                                    style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:50%;text-align:center;line-height:36px;color:#fff;font-size:14px;font-weight:600;margin-right:12px;vertical-align:middle;">{{ strtoupper(substr($passenger['first_name'] ?? $passenger['name'] ?? 'P', 0, 1)) }}</span>
                                <span style="display:inline-block;vertical-align:middle;">
                                    <div style="font-size:14px;font-weight:600;color:#1e293b;">
                                        {{ strtoupper($passenger['name'] ?? $passenger['first_name'] . ' ' . $passenger['last_name']) }}
                                    </div>
                                    <div style="font-size:11px;color:#64748b;margin-top:2px;">
                                        {{ ucfirst($passenger['type'] ?? 'Adult') }}
                                        @if(!empty($passenger['passport'])) - Passport: {{ $passenger['passport'] }}@endif
                                        @if(!empty($passenger['ticket_number']))<br>Ticket:
                                        {{ $passenger['ticket_number'] }}@endif
                                    </div>
                                </span>
                            </td>
                            <td style="text-align:right;vertical-align:middle;">
                                <div style="font-size:9px;color:#64748b;text-transform:uppercase;">Seat</div>
                                <span
                                    style="display:inline-block;background:#22c55e;color:#fff;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;margin-top:4px;">{{ $passenger['seat'] ?? 'TBA' }}</span>
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach
        </div>

        <!-- Footer -->
        <div style="background:#1e293b;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="vertical-align:middle;">
                        <span
                            style="display:inline-block;width:50px;height:50px;background:#fff;border-radius:6px;text-align:center;line-height:50px;font-size:10px;font-weight:bold;color:#1e293b;vertical-align:middle;">QR</span>
                        <span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#fff;">
                            <div style="font-size:12px;font-weight:600;">Scan for mobile check-in</div>
                            <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Present this code at the gate
                            </div>
                        </span>
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                        <div style="font-size:10px;color:#94a3b8;line-height:1.5;">
                            Please arrive at the airport at least <span style="color:#fff;font-weight:600;">2
                                hours</span> before departure.<br>
                            This is an electronic ticket.
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div style="text-align:center;margin-top:16px;font-size:10px;color:#64748b;">
        Generated on {{ date('F j, Y \a\t g:i A') }} - Booking ID: {{ $booking['id'] }}
    </div>
</body>

</html>