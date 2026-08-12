import type { ResourcesSettings } from "../components/admin/settings/resources/types/ResourcesComponent";

export async function getResourceConfig(gesUrl: string, resourceId: string): Promise<ResourcesSettings | null> {
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
