import { BankAccountState } from "@/lib/actions/bank-accounts";
import Field from "./field";
import { Bank } from "./bank-content";


export default function BankFormFields({
  state,
  initial,
}: {
  state: BankAccountState;
  initial?: Bank;
}) {
  return (
    <div className="space-y-3">
      <Field
        label="Nama Bank"
        name="bankName"
        defaultValue={initial?.bankName}
        placeholder="cth: BCA, BNI, BRI"
        error={state.fieldErrors?.bankName?.[0]}
      />
      <Field
        label="Nama Pemilik"
        name="accountName"
        defaultValue={initial?.accountName}
        placeholder="Sesuai buku tabungan"
        error={state.fieldErrors?.accountName?.[0]}
      />
      <Field
        label="Nomor Rekening"
        name="accountNumber"
        defaultValue={initial?.accountNumber}
        placeholder="cth: 1234567890"
        inputMode="numeric"
        error={state.fieldErrors?.accountNumber?.[0]}
      />
      <Field
        label={
          <>
            Nomor Ponsel Cadangan{" "}
            <span className="font-normal text-zinc-500">(opsional)</span>
          </>
        }
        name="backupPhone"
        defaultValue={initial?.backupPhone ?? ""}
        placeholder="cth: 081234567890"
        inputMode="tel"
        error={state.fieldErrors?.backupPhone?.[0]}
      />
      {state.error && (
        <p className="text-xs font-medium text-rose-600 sm:text-sm">
          {state.error}
        </p>
      )}
    </div>
  );
}