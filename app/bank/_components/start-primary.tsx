import { setPrimaryBankAccount } from "@/lib/actions/bank-accounts";

export default function startPrimary(fd: FormData) {
  setPrimaryBankAccount({}, fd);
}