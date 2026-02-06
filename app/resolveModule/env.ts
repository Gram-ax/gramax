import "@core/utils/asyncUtils";
import assert from "assert";
import { defaultVariables, type EnvironmentVariable } from "../config/env";
import viteEnv from "../config/viteenv";

export type Environment = "next" | "tauri" | "browser" | "test" | "static" | "cli";

let _env: (name: keyof EnvironmentVariable) => string;

const getEnv = (): string => {
	let env = global.VITE_ENVIRONMENT || process.env.VITE_ENVIRONMENT;
	if (env === "test") env = "next";
	assert(env, "env not set");
	return env;
};

const executing = getEnv() as Environment;

const initEnv = () => {
	if (executing === "browser") {
		_env = typeof window !== "undefined" ? ((window as any)?.getEnv ?? (() => undefined)) : () => undefined;
	}

	if (executing === "tauri") {
		_env = (name: string) => {
			return typeof window !== "undefined" ? window.process?.env?.[name] : undefined;
		};
	}

	if (executing === "next") {
		_env = (name: string) => {
			return process.env?.[name];
		};
	}

	if (executing === "test") {
		_env = (name: string) => {
			return process.env?.[name];
		};
	}

	if (executing === "static") {
		_env = typeof window !== "undefined" ? ((window as any)?.getEnv ?? (() => undefined)) : () => undefined;
	}

	if (executing === "cli") {
		_env = (name: string) => {
			return process.env?.[name];
		};
	}
};

initEnv();

const builtIn = { ...(process as any).builtIn, ...viteEnv };

export const env = <T extends keyof EnvironmentVariable>(name: T): EnvironmentVariable[T] =>
	builtIn?.[name] || _env(name) || defaultVariables[name] || "";

export const getExecutingEnvironment = (): Environment => executing;

export const isTauriMobile = () => {
	return executing === "tauri" && !!_env("IS_MOBILE");
};
