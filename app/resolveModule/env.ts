/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
import "@core/utils/asyncUtils";
import assert from "assert";
import { defaultVariables, type EnvironmentVariable } from "../config/env";
import viteEnv from "../config/viteenv";

export type Environment = "next" | "tauri" | "web" | "test" | "static" | "cli" | "docportal";

let Env: (name: keyof EnvironmentVariable) => string;

const getEnv = (): string => {
	let env = global.VITE_ENVIRONMENT || process.env.VITE_ENVIRONMENT;
	if (env === "test") env = "next";
	assert(env, "env not set");
	return env;
};

const executing = getEnv() as Environment;

const initEnv = () => {
	if (executing === "web") {
		Env = typeof window !== "undefined" ? ((window as any)?.getEnv ?? (() => undefined)) : () => undefined;
	}

	if (executing === "tauri") {
		Env = (name: string) => {
			return typeof window !== "undefined" ? window.process?.env?.[name] : undefined;
		};
	}

	if (executing === "next") {
		Env = (name: string) => {
			return process.env?.[name];
		};
	}

	if (executing === "docportal") {
		Env = (name: string) => {
			return process.env?.[name];
		};
	}

	if (executing === "test") {
		Env = (name: string) => {
			return process.env?.[name];
		};
	}

	if (executing === "static") {
		Env = typeof window !== "undefined" ? ((window as any)?.getEnv ?? (() => undefined)) : () => undefined;
	}

	if (executing === "cli") {
		Env = (name: string) => {
			return process.env?.[name];
		};
	}
};

initEnv();

const builtIn = { ...(process as any).builtIn, ...viteEnv };

export const env = <T extends keyof EnvironmentVariable>(name: T): EnvironmentVariable[T] =>
	builtIn?.[name] || Env(name) || defaultVariables[name] || "";

export const getExecutingEnvironment = (): Environment => {
	return executing === "docportal" ? "next" : executing;
};

export const isTauriMobile = () => {
	return executing === "tauri" && !!Env("IS_MOBILE");
};
