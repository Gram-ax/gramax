import type { ClientAccess } from "../components/admin/settings/resources/types/ResourcesComponent";

export interface ResourceConfig {
	id: string;
	mainBranch: string;
	access: ClientAccess;
}

export async function getResourceConfig(gesUrl: string, resourceId: string): Promise<ResourceConfig | null> {
	try {
		const response = await fetch(
			`${gesUrl}/enterprise/config/resources/getOne?resourceId=${encodeURIComponent(resourceId)}`,
		);

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch {
		return null;
	}
}
