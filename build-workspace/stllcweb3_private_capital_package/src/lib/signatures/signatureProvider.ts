export type SignatureProviderName = 'internal_stub' | 'docusign' | 'dropbox_sign' | 'pandadoc';

export type CreateSignatureRequestInput = {
  provider: SignatureProviderName;
  documentId: string;
  dealId: string;
  subscriptionId?: string;
  signerUserId: string;
  signerEmail?: string;
  signerName?: string;
};

export type SignatureProviderResult = {
  provider: SignatureProviderName;
  providerEnvelopeId?: string;
  signingUrl?: string;
  status: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export async function createSignatureEnvelope(input: CreateSignatureRequestInput): Promise<SignatureProviderResult> {
  switch (input.provider) {
    case 'internal_stub':
      return {
        provider: 'internal_stub',
        providerEnvelopeId: `stub_${crypto.randomUUID()}`,
        signingUrl: `/sign/internal/${input.documentId}`,
        status: 'created',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        metadata: { warning: 'Stub only. Replace before production capital raise.' }
      };
    default:
      throw new Error(`${input.provider} provider adapter not configured yet`);
  }
}
