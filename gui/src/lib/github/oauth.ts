const SCOPES = 'repo';
const CLIENT_ID = 'Ov23li6wLOuYnl5pweQB';

export function getClientId(): string {
  return CLIENT_ID;
}

export function setClientId(_id: string): void {
  // no-op — client ID is hardcoded
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export type OAuthPollStatus = 'pending' | 'success' | 'expired' | 'error';

export interface OAuthPollResult {
  status: OAuthPollStatus;
  token?: string;
  error?: string;
}

export async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
  const res = await fetch('/api/github/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, scope: SCOPES }),
  });
  if (!res.ok) {
    throw new Error(`Failed to request device code: ${res.status}`);
  }
  return res.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function* pollForToken(
  clientId: string,
  deviceCode: string,
  interval: number
): AsyncGenerator<OAuthPollResult> {
  const pollInterval = Math.max(interval, 5) * 1000;

  while (true) {
    await sleep(pollInterval);

    try {
      const res = await fetch('/api/github/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      if (!res.ok) {
        yield { status: 'error', error: `HTTP ${res.status}` };
        return;
      }

      const data = await res.json();

      if (data.access_token) {
        yield { status: 'success', token: data.access_token };
        return;
      }

      if (data.error === 'authorization_pending') {
        yield { status: 'pending' };
        continue;
      }

      if (data.error === 'slow_down') {
        // GitHub asked us to slow down — increase interval by 5s
        await sleep(5000);
        yield { status: 'pending' };
        continue;
      }

      if (data.error === 'expired_token') {
        yield { status: 'expired', error: 'Device code expired. Please try again.' };
        return;
      }

      // access_denied or other error
      yield { status: 'error', error: data.error_description || data.error || 'Unknown error' };
      return;
    } catch (e: any) {
      yield { status: 'error', error: e.message || 'Network error' };
      return;
    }
  }
}
