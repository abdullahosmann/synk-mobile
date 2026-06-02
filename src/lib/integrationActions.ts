import { UserProfile, ConnectedIntegration } from "../types";

// TODO: replace with native bridge / backend OAuth flow (Bakr to spec)
export async function connectIntegrationStub(
  id: ConnectedIntegration['id'],
  user: UserProfile,
  setUser: (u: UserProfile) => void
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // For now: optimistically flip status to 'connected' and stamp timestamps
  const existing = user.connectedIntegrations ?? [];
  const others = existing.filter(i => i.id !== id);
  const now = new Date().toISOString();
  setUser({
    ...user,
    connectedIntegrations: [
      ...others,
      { id, status: 'connected', connectedAt: now, lastSyncAt: now },
    ],
  });
  return { ok: true };
}

// TODO: replace with native bridge disconnect / backend revoke
export async function disconnectIntegrationStub(
  id: ConnectedIntegration['id'],
  user: UserProfile,
  setUser: (u: UserProfile) => void
): Promise<void> {
  const existing = user.connectedIntegrations ?? [];
  const others = existing.filter(i => i.id !== id);
  setUser({
    ...user,
    connectedIntegrations: [
      ...others,
      { id, status: 'available' },
    ],
  });
}
