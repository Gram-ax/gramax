import type { StateStorage } from "zustand/middleware";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readCookie = (cookieString: string, name: string): string | null => {
	const match = cookieString.match(new RegExp(`(?:^|; )${escapeRegex(name)}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
};

/**
 * zustand-persist storage adapter that writes to `document.cookie`.
 * Used in Next.js so SSR can read the same value from `req.headers.cookie`
 * and render the user's effective settings on first paint — localStorage
 * is invisible to the server.
 */
export const cookieStorage: StateStorage = {
	getItem: (name) => {
		if (typeof document === "undefined") return null;
		return readCookie(document.cookie, name);
	},
	setItem: (name, value) => {
		if (typeof document === "undefined") return;
		// biome-ignore lint/suspicious/noDocumentCookie: deliberate cookie storage adapter
		document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
	},
	removeItem: (name) => {
		if (typeof document === "undefined") return;
		// biome-ignore lint/suspicious/noDocumentCookie: deliberate cookie storage adapter
		document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
	},
};

/**
 * Parse the settings cookie from a raw `Cookie:` header and unwrap the
 * zustand-persist envelope `{ state: { values: {...} }, version }`.
 */
export const parseSettingsCookie = (
	cookieHeader: string | undefined,
	name: string,
): Record<string, unknown> | undefined => {
	if (!cookieHeader) return undefined;
	const raw = readCookie(cookieHeader, name);
	if (!raw) return undefined;
	try {
		const parsed = JSON.parse(raw) as { state?: { values?: unknown } };
		const values = parsed?.state?.values;
		return values && typeof values === "object" ? (values as Record<string, unknown>) : undefined;
	} catch {
		return undefined;
	}
};
