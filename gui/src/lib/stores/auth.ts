import { writable, derived } from 'svelte/store';

const TOKEN_KEY = 'ccpm-gui-token';
const USERNAME_KEY = 'ccpm-gui-username';

function createAuthStore() {
  const stored = localStorage.getItem(TOKEN_KEY) || '';
  const storedUser = localStorage.getItem(USERNAME_KEY) || '';
  const token = writable(stored);
  const username = writable(storedUser);
  const isAuthenticated = derived(token, ($token) => $token.length > 0);

  return {
    token,
    username,
    isAuthenticated,
    setToken(t: string) {
      localStorage.setItem(TOKEN_KEY, t);
      token.set(t);
    },
    setUsername(u: string) {
      localStorage.setItem(USERNAME_KEY, u);
      username.set(u);
    },
    clearToken() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
      token.set('');
      username.set('');
    },
  };
}

export const auth = createAuthStore();
