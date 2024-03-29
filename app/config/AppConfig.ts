import Path from "@core/FileProvider/Path/Path";
import { env, getExecutingEnvironment } from "../resolveModule";

interface AppConfigPaths {
	base: Path;
	root: Path;
	local?: Path;
	userDataPath: Path;
}

export interface AppConfig {
	isReadOnly: boolean;
	isServerApp: boolean;
	isProduction: boolean;
	ssoServerUrl: string;
	ssoPublicKey: string;
	authServiceUrl: string;
	branch: string;
	enterpriseServerUrl: string;
	bugsnagApiKey: string;
	cookieSecret: string;
	adminLogin: string;
	adminPassword: string;
	gramaxVersion: string;

	tokens: {
		share: string;
	};

	paths: AppConfigPaths;

	mail: {
		user: string;
		password: string;
	};
}

export const getPaths = (): AppConfigPaths => {
	if (getExecutingEnvironment() == "browser") {
		return {
			base: Path.empty,
			root: new Path("docs"),
			userDataPath: new Path("cache"),
		};
	}

	if (!env("ROOT_PATH")) {
		throw new Error(
			`Корневой каталог (${env(
				"ROOT_PATH",
			)}) не указан.\nСледуйте инструкциям, указанным в документации (https://docs.ics-it.ru/ics-docs/documentation/local/dev).`,
		);
	}

	const root = new Path(env("ROOT_PATH"));
	const userData = (env("USER_DATA_PATH") && new Path(env("USER_DATA_PATH"))) ?? root;

	return {
		base: new Path(env("BASE_PATH")),
		root,
		local: env("LOCAL_DOC_PATH") && new Path(env("LOCAL_DOC_PATH")),
		userDataPath: userData,
	};
};
