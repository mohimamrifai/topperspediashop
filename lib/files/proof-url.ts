import "server-only";

export async function resolveProofUrl(
  proofUrl: string | null | undefined,
): Promise<string | null> {
  if (!proofUrl) return null;
  return proofUrl;
}
