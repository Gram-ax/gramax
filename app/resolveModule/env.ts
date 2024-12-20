import { EnvironmentVariable, defaultVariables } from "../config/env";
import viteEnv from "../config/viteenv";

type Environment = "next" | "tauri" | "browser";

let executing: Environment;
let _env: (name: keyof EnvironmentVariable) => string;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT='browser'

executing = "browser";

_env = (window as any)?.getEnv ?? (() => undefined);

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT='next'

executing = "next";

_env = (name: string) => {
	return process.env[name];
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT='jest'

executing = "next";

_env = (name: string) => {
	return process.env[name];
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT='tauri'

executing = "tauri";

_env = (name: string) => {
	return window.process?.env?.[name];
};

// #v-endif;
/// #endif

const builtIn = { ...(process as any).builtIn, ...viteEnv };

export const env = <T extends keyof EnvironmentVariable>(name: T): EnvironmentVariable[T] =>
	builtIn?.[name] ?? _env(name) ?? defaultVariables[name];

export const getExecutingEnvironment = (): Environment => executing;
