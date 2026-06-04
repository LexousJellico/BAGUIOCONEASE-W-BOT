<?php

namespace App\Http\Requests;

use App\Support\WorkspaceAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Booking;
use App\Models\MiceRecord;

class StoreBookingPaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $amount = $this->input('amount');

        if (is_string($amount)) {
            $amount = str_replace([',', '₱', ' '], '', trim($amount));
        }

        $paymentMethod = strtolower(trim((string) $this->input('payment_method', 'online')));
        $paymentGateway = strtolower(trim((string) $this->input('payment_gateway', '')));
        $paymentType = strtolower(trim((string) $this->input('payment_type', 'down')));
        $status = strtolower(trim((string) $this->input('status', '')));

        $transactionReference = trim((string) $this->input('transaction_reference', ''));
        $remarks = trim((string) $this->input('remarks', ''));
        $payerName = trim((string) $this->input('payer_name', ''));
        $cardHolderName = trim((string) $this->input('card_holder_name', ''));
        $cardNumber = preg_replace('/\D+/', '', (string) $this->input('card_number', ''));
        $cardExpiration = trim((string) $this->input('card_expiration', ''));
        $cardCvc = preg_replace('/\D+/', '', (string) $this->input('card_cvc', ''));

        if ($paymentGateway === 'cash') {
            $paymentMethod = 'cash';
        } elseif ($paymentGateway === 'card') {
            $paymentMethod = 'card';
        } elseif ($paymentGateway === 'manual') {
            $paymentMethod = 'manual';
        } elseif ($paymentMethod === '') {
            $paymentMethod = 'online';
        }

        $this->merge([
            'payment_method' => $paymentMethod,
            'payment_gateway' => $paymentGateway !== '' ? $paymentGateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : 'down',
            'amount' => $amount,
            'transaction_reference' => $transactionReference !== '' ? $transactionReference : null,
            'remarks' => $remarks !== '' ? $remarks : null,
            'status' => $status !== '' ? $status : null,
            'payer_name' => $payerName !== '' ? $payerName : null,
            'card_holder_name' => $cardHolderName !== '' ? $cardHolderName : null,
            'card_number' => $cardNumber !== '' ? $cardNumber : null,
            'card_expiration' => $cardExpiration !== '' ? $cardExpiration : null,
            'card_cvc' => $cardCvc !== '' ? $cardCvc : null,
            'marketing_consent' => filter_var($this->input('marketing_consent', false), FILTER_VALIDATE_BOOL),
        ]);
    }

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $canManage = $this->canManagePayments();

        $rules = [
            'payment_method' => ['required', 'string', 'max:100'],
            'payment_gateway' => ['nullable', 'string', Rule::in([
                'card',
                'paypal',
                'gcash',
                'bank',
                'manual',
                'cash',
            ])],
            'payment_type' => ['nullable', 'string', Rule::in([
                'down',
                'full',
                'balance',
            ])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_reference' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('booking_payments', 'transaction_reference')->whereNotNull('transaction_reference'),
            ],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'payer_name' => ['nullable', 'string', 'max:255'],
            'card_holder_name' => ['nullable', 'string', 'max:255'],
            'card_number' => ['nullable', 'digits_between:12,19'],
            'card_expiration' => ['nullable', 'string', 'max:10'],
            'card_cvc' => ['nullable', 'digits_between:3,4'],
            'marketing_consent' => ['nullable', 'boolean'],
        ];

        if ($canManage) {
            $rules['status'] = ['nullable', 'string', Rule::in([
                'pending',
                'confirmed',
                'verified',
                'paid',
                'failed',
                'declined',
                'refunded',
            ])];
        } else {
            $rules['status'] = ['nullable', 'string'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Payment amount is required.',
            'amount.numeric' => 'Payment amount must be a valid number.',
            'amount.min' => 'Payment amount must be greater than zero.',
            'transaction_reference.unique' => 'This transaction reference has already been submitted.',
            'proof_image.image' => 'Payment proof must be an image file.',
            'proof_image.mimes' => 'Payment proof must be JPG, JPEG, PNG, or WEBP.',
            'proof_image.max' => 'Payment proof image must not exceed 5MB.',
            'payer_name.required' => 'Payer name is required.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $canManage = $this->canManagePayments();
            $gateway = strtolower((string) $this->input('payment_gateway', ''));
            $method = strtolower((string) $this->input('payment_method', ''));
            $status = strtolower((string) $this->input('status', ''));

            $referenceGateways = ['paypal', 'gcash', 'bank', 'card'];
            $proofGateways = ['paypal', 'gcash', 'bank'];

            if (! $this->filled('payer_name') && ! in_array($gateway, ['manual', 'cash'], true)) {
                $validator->errors()->add('payer_name', 'Payer name is required for online payment proof.');
            }

            if (! $canManage) {
                if (in_array($gateway, $referenceGateways, true) && ! $this->filled('transaction_reference')) {
                    $validator->errors()->add('transaction_reference', 'Transaction reference is required for this payment method.');
                }

                if (in_array($gateway, $proofGateways, true) && ! $this->hasFile('proof_image')) {
                    $validator->errors()->add('proof_image', 'Payment proof image is required for this payment method.');
                }

                if (in_array($gateway, ['manual', 'cash'], true) || in_array($method, ['manual', 'cash'], true)) {
                    $validator->errors()->add('payment_gateway', 'Cash or manual payments must be recorded by authorized staff.');
                }
                $booking = $this->route('booking');

                if (! $canManage && $booking instanceof Booking) {
    $hasMiceReport = MiceRecord::query()
        ->where('booking_id', $booking->id)
        ->where('status', 'submitted')
        ->whereNotNull('submitted_at')
        ->exists();

    if (! $hasMiceReport) {
        $validator->errors()->add(
            'payment_gateway',
            'Please complete the required MICE report before submitting payment proof.',
        );
    }
}

                return;
            }

            if (
                in_array($status, ['confirmed', 'verified', 'paid'], true)
                && in_array($gateway, $referenceGateways, true)
                && ! $this->filled('transaction_reference')
                && ! $this->hasFile('proof_image')
            ) {
                $validator->errors()->add(
                    'transaction_reference',
                    'Confirmed online payments should have either a transaction reference or proof image.',
                );
            }
        });
    }

    protected function canManagePayments(): bool
    {
        try {
            if (WorkspaceAccess::canManagePayments($this)) {
                return true;
            }
        } catch (\Throwable) {
            // Fall back to role checks below.
        }

        $user = $this->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'can') && $user->can('payments.manage')) {
            return true;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager', 'staff'])) {
            return true;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole(['admin', 'manager', 'staff'])) {
            return true;
        }

        $role = (string) ($user->role_name ?? $user->role ?? '');

        return in_array($role, ['admin', 'manager', 'staff'], true);
    }
}
