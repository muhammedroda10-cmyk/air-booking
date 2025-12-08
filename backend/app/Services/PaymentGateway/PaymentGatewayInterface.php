<?php

namespace App\Services\PaymentGateway;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Facades\Log;

interface PaymentGatewayInterface
{
    /**
     * Create a payment intent
     * 
     * @param float $amount Amount in the currency's smallest unit (e.g., cents)
     * @param string $currency ISO currency code (e.g., 'usd', 'eur')
     * @param array $metadata Additional metadata for the payment
     * @return array Payment intent data with client_secret
     */
    public function createPaymentIntent(float $amount, string $currency = 'usd', array $metadata = []): array;

    /**
     * Confirm a payment
     * 
     * @param string $paymentIntentId The payment intent ID
     * @return array Confirmation result
     */
    public function confirmPayment(string $paymentIntentId): array;

    /**
     * Cancel/refund a payment
     * 
     * @param string $paymentIntentId The payment intent ID
     * @param float|null $amount Amount to refund (null for full refund)
     * @return array Refund result
     */
    public function refundPayment(string $paymentIntentId, ?float $amount = null): array;

    /**
     * Get payment status
     * 
     * @param string $paymentIntentId The payment intent ID
     * @return array Payment status data
     */
    public function getPaymentStatus(string $paymentIntentId): array;

    /**
     * Handle webhook event
     * 
     * @param array $payload Webhook payload
     * @param string $signature Webhook signature
     * @return array Processing result
     */
    public function handleWebhook(array $payload, string $signature): array;

    /**
     * Create a customer for saved cards
     * 
     * @param User $user
     * @return string Customer ID
     */
    public function createCustomer(User $user): string;

    /**
     * Get saved payment methods for a customer
     * 
     * @param string $customerId
     * @return array List of payment methods
     */
    public function getPaymentMethods(string $customerId): array;

    /**
     * Delete a payment method
     * 
     * @param string $paymentMethodId
     * @return bool Success status
     */
    public function deletePaymentMethod(string $paymentMethodId): bool;
}
