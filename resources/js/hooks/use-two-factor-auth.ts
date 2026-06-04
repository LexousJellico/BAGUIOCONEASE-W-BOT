import { useCallback, useMemo, useState } from 'react';

export const OTP_MAX_LENGTH = 6;

type TwoFactorSetupData = {
    svg: string;
};

type TwoFactorSecretKey = {
    secretKey: string;
};

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }

    return response.json() as Promise<T>;
};

export const useTwoFactorAuth = () => {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const hasSetupData = useMemo(
        () => qrCodeSvg !== null && manualSetupKey !== null,
        [qrCodeSvg, manualSetupKey],
    );

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const fetchQrCode = useCallback(async () => {
        try {
            const { svg } = await fetchJson<TwoFactorSetupData>(
                '/user/two-factor-qr-code',
            );
            setQrCodeSvg(svg);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch QR code']);
            setQrCodeSvg(null);
        }
    }, []);

    const fetchSetupKey = useCallback(async () => {
        try {
            const { secretKey } = await fetchJson<TwoFactorSecretKey>(
                '/user/two-factor-secret-key',
            );
            setManualSetupKey(secretKey);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch a setup key']);
            setManualSetupKey(null);
        }
    }, []);

    const clearSetupData = useCallback(() => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        clearErrors();
    }, [clearErrors]);

    const fetchRecoveryCodes = useCallback(async () => {
        try {
            clearErrors();
            const codes = await fetchJson<string[]>(
                '/user/two-factor-recovery-codes',
            );
            setRecoveryCodesList(codes);
        } catch {
            setErrors((prev) => [...prev, 'Failed to fetch recovery codes']);
            setRecoveryCodesList([]);
        }
    }, [clearErrors]);

    const fetchSetupData = useCallback(async () => {
        try {
            clearErrors();
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [clearErrors, fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
