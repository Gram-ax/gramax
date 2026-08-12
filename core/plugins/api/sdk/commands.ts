import type { HttpCommandExecutor } from "./core";

export const pluginCommandExecutor: HttpCommandExecutor = {
	async execute<TResult = unknown>(path: string, args?: unknown): Promise<TResult> {
		const normalizedPath = path.replace(/^\/+/, "");

		const response = await fetch(`/api/${normalizedPath}`, {
			method: args !== undefined ? "POST" : "GET",
			body: args !== undefined ? JSON.stringify(args) : undefined,
			headers: args !== undefined ? { "Content-Type": "application/json" } : undefined,
		});

		if (!response.ok) throw await response.json();

		return response.json() as Promise<TResult>;
	},
};
