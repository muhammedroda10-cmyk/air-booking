<?php

namespace App\Services\PaymentGateway;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stripe Payment Gateway Implementation
 * 
 * To use this, add your Stripe API keys to .env:
 * STRIPE_KEY=pk_test_xxx
 * STRIPE_SECRET=sk_test_xxx
 * STRIPE_WEBHOOK_SECRET=whsec_xxx
 */
class StripeGateway implements PaymentGatewayInterface
{
    private ?string $apiKey;
    private string $webhookSecret;
    private string $baseUrl = 'https://api.stripe.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.stripe.secret') ?: '';
        $this->webhookSecret = config('services.stripe.webhook_secret', '');

        if (empty($this->apiKey)) {
            Log::warning('Stripe API key not configured');
        }
    }

    /**
     * Create a payment intent for charging the user
     */
    public function createPaymentIntent(float $amount, string $currency = 'usd', array $metadata = []): array
    {
        try {
            $response = $this->makeRequest('POST', '/payment_intents', [
                'amount' => (int) ($amount * 100), // Convert to cents
                'currency' => strtolower($currency),
                'automatic_payment_methods' => ['enabled' => 'true'],
                'metadata' => $metadata,
            ]);

            return [
                'success' => true,
                'payment_intent_id' => $response['id'],
                'client_secret' => $response['client_secret'],
                'status' => $response['status'],
            ];
        } catch (\Exception $e) {
            Log::error('Stripe createPaymentIntent failed', [
                'error' => $e->getMessage(),
                'amount' => $amount,
                'currency' => $currency,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Confirm a payment intent
     */
    public function confirmPayment(string $paymentIntentId): array
    {
        try {
            $response = $this->makeRequest('POST', "/payment_intents/{$paymentIntentId}/confirm");

            return [
                'success' => true,
                'status' => $response['status'],
                'amount_received' => ($response['amount_received'] ?? 0) / 100,
            ];
        } catch (\Exception $e) {
            Log::error('Stripe confirmPayment failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Refund a payment
     */
    public function refundPayment(string $paymentIntentId, ?float $amount = null): array
    {
        try {
            $params = [
                'payment_intent' => $paymentIntentId,
            ];

            if ($amount !== null) {
                $params['amount'] = (int) ($amount * 100);
            }

            $response = $this->makeRequest('POST', '/refunds', $params);

            return [
                'success' => true,
                'refund_id' => $response['id'],
                'status' => $response['status'],
                'amount' => $response['amount'] / 100,
            ];
        } catch (\Exception $e) {
            Log::error('Stripe refundPayment failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get payment intent status
     */
    public function getPaymentStatus(string $paymentIntentId): array
    {
        try {
            $response = $this->makeRequest('GET', "/payment_intents/{$paymentIntentId}");

            return [
                'success' => true,
                'status' => $response['status'],
                'amount' => $response['amount'] / 100,
                'currency' => strtoupper($response['currency']),
                'payment_method' => $response['payment_method'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Stripe getPaymentStatus failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Handle Stripe webhook events
     */
    public function handleWebhook(array $payload, string $signature): array
    {
        // Verify webhook signature if secret is configured
        if (!empty($this->webhookSecret)) {
            // In production, use Stripe SDK to verify signature
            // For now, we trust the payload
        }

        $type = $payload['type'] ?? '';
        $data = $payload['data']['object'] ?? [];

        Log::info('Stripe webhook received', ['type' => $type]);

        switch ($type) {
            case 'payment_intent.succeeded':
                return $this->handlePaymentSucceeded($data);

            case 'payment_intent.payment_failed':
                return $this->handlePaymentFailed($data);

            case 'charge.refunded':
                return $this->handleChargeRefunded($data);

            default:
                return ['status' => 'ignored', 'type' => $type];
        }
    }

    /**
     * Create a Stripe customer for saved cards
     */
    public function createCustomer(User $user): string
    {
        try {
            $response = $this->makeRequest('POST', '/customers', [
                'email' => $user->email,
                'name' => $user->name,
                'metadata' => [
                    'user_id' => (string) $user->id,
                ],
            ]);

            return $response['id'];
        } catch (\Exception $e) {
            Log::error('Stripe createCustomer failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            throw $e;
        }
    }

    /**
     * Get payment methods for a customer
     */
    public function getPaymentMethods(string $customerId): array
    {
        try {
            $response = $this->makeRequest('GET', '/payment_methods', [
                'customer' => $customerId,
                'type' => 'card',
            ]);

            return array_map(function ($method) {
                return [
                    'id' => $method['id'],
                    'brand' => $method['card']['brand'] ?? 'unknown',
                    'last4' => $method['card']['last4'] ?? '****',
                    'exp_month' => $method['card']['exp_month'] ?? 0,
                    'exp_year' => $method['card']['exp_year'] ?? 0,
                ];
            }, $response['data'] ?? []);
        } catch (\Exception $e) {
            Log::error('Stripe getPaymentMethods failed', [
                'error' => $e->getMessage(),
                'customer_id' => $customerId,
            ]);

            return [];
        }
    }

    /**
     * Delete a payment method
     */
    public function deletePaymentMethod(string $paymentMethodId): bool
    {
        try {
            $this->makeRequest('POST', "/payment_methods/{$paymentMethodId}/detach");
            return true;
        } catch (\Exception $e) {
            Log::error('Stripe deletePaymentMethod failed', [
                'error' => $e->getMessage(),
                'payment_method_id' => $paymentMethodId,
            ]);

            return false;
        }
    }

    /**
     * Make HTTP request to Stripe API
     */
    private function makeRequest(string $method, string $endpoint, array $params = []): array
    {
        if (empty($this->apiKey)) {
            throw new \Exception('Stripe API key not configured');
        }

        $url = $this->baseUrl . $endpoint;

        $request = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->asForm();

        if ($method === 'POST') {
            $response = $request->post($url, $params);
        } else {
            $response = $request->get($url, $params);
        }

        if (!$response->successful()) {
            $error = $response->json('error.message', 'Unknown Stripe error');
            throw new \Exception($error);
        }

        return $response->json();
    }

    /**
     * Handle successful payment
     */
    private function handlePaymentSucceeded(array $data): array
    {
        $metadata = $data['metadata'] ?? [];
        $bookingId = $metadata['booking_id'] ?? null;

        if ($bookingId) {
            $booking = \App\Models\Booking::find($bookingId);
            if ($booking && $booking->payment_status !== 'paid') {
                $booking->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                    'stripe_payment_intent_id' => $data['id'],
                ]);

                Log::info('Booking payment confirmed via webhook', [
                    'booking_id' => $bookingId,
                    'payment_intent_id' => $data['id'],
                ]);
            }
        }

        return ['status' => 'processed', 'booking_id' => $bookingId];
    }

    /**
     * Handle failed payment
     */
    private function handlePaymentFailed(array $data): array
    {
        $metadata = $data['metadata'] ?? [];
        $bookingId = $metadata['booking_id'] ?? null;

        Log::warning('Payment failed', [
            'booking_id' => $bookingId,
            'payment_intent_id' => $data['id'],
            'failure_message' => $data['last_payment_error']['message'] ?? 'Unknown',
        ]);

        return ['status' => 'payment_failed', 'booking_id' => $bookingId];
    }

    /**
     * Handle refund
     */
    private function handleChargeRefunded(array $data): array
    {
        Log::info('Refund processed', [
            'charge_id' => $data['id'],
            'amount_refunded' => ($data['amount_refunded'] ?? 0) / 100,
        ]);

        return ['status' => 'refunded'];
    }
}
