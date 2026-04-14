import { env } from "@utils/utils";

export type Creds = {
	email: string;
	password: string;
};

export default class EnterpriseCreds {
	get keycloakEndpointUrl(): string {
		return env("KEYCLOAK_SERVER_URL");
	}

	get catalogOwner(): Creds {
		return {
			email: env("E2E_KEYCLOAK_CATALOG_OWNER_MAIL"),
			password: env("E2E_KEYCLOAK_CATALOG_OWNER_PASSWORD"),
		};
	}

	get workspaceOwner(): Creds {
		return {
			email: env("E2E_KEYCLOAK_WORKSPACE_OWNER_MAIL"),
			password: env("E2E_KEYCLOAK_WORKSPACE_OWNER_PASSWORD"),
		};
	}

	get reviewer(): Creds {
		return {
			email: env("E2E_KEYCLOAK_REVIEWER_MAIL"),
			password: env("E2E_KEYCLOAK_REVIEWER_PASSWORD"),
		};
	}

	get reader(): Creds {
		return {
			email: env("E2E_KEYCLOAK_READER_MAIL"),
			password: env("E2E_KEYCLOAK_READER_PASSWORD"),
		};
	}

	get editor(): Creds {
		return {
			email: env("E2E_KEYCLOAK_EDITOR_MAIL"),
			password: env("E2E_KEYCLOAK_EDITOR_PASSWORD"),
		};
	}
}
