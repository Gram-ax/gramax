import type { SettingsContextType } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { AccessSnapshot } from "@ext/enterprise/components/admin/settings/members/model/applyAccessChanges";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export type AccessDraftMutators = Pick<
	SettingsContextType,
	"addResource" | "deleteResources" | "addGroup" | "deleteGroups" | "update" | "ensureLoaded"
>;

export const flushAccessDraft = async (base: AccessSnapshot, draft: AccessSnapshot, m: AccessDraftMutators) => {
	const { upserts, deletes } = diffResources(base.resources, draft.resources);
	let resourcesChanged = false;
	for (const resource of upserts) {
		await m.addResource(resource);
		resourcesChanged = true;
	}

	if (deletes.length) {
		await m.deleteResources(deletes);
		resourcesChanged = true;
	}

	const baseGroups = base.groups;
	const nextGroups = draft.groups;
	let groupsChanged = false;
	for (const [groupId, data] of Object.entries(nextGroups)) {
		if (!deepEqual(baseGroups[groupId], data)) {
			await m.addGroup({ groupId, groupValue: data.members ?? [], groupName: data.name });
			groupsChanged = true;
		}
	}
	const groupDeletes = Object.keys(baseGroups).filter((id) => !(id in nextGroups));
	if (groupDeletes.length) {
		await m.deleteGroups(groupDeletes);
		groupsChanged = true;
	}

	if (draft.editors && !deepEqual(base.editors, draft.editors)) await m.update("editors", draft.editors);
	if (draft.workspace && !deepEqual(base.workspace, draft.workspace)) await m.update("workspace", draft.workspace);
	if (groupsChanged) await m.ensureLoaded("groups", true);
	if (resourcesChanged) await m.ensureLoaded("resources", true);
};

const diffResources = (base: ResourcesSettings[], next: ResourcesSettings[]) => {
	const baseMap = new Map(base.map((x) => [x.id, x]));
	const nextMap = new Map(next.map((x) => [x.id, x]));
	const upserts = next.filter((x) => !deepEqual(baseMap.get(x.id), x));
	const deletes = base.filter((x) => !nextMap.has(x.id)).map((b) => b.id);
	return { upserts, deletes };
};
