/**
 * Types dan initial state untuk server actions deposit bank accounts.
 * Dipisah dari file "use server" agar tidak melanggar constraint Next.js
 * yang hanya memperbolehkan export async functions di server-action files.
 */

export type DepositBankAccountState = {
  error?: string;
  fieldErrors?: {
    bankName?: string[];
    accountName?: string[];
    accountNumber?: string[];
  };
  success?: boolean;
};

export const initialDepositAccountState: DepositBankAccountState = {};
