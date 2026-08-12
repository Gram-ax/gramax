import type { ApplyWorkspaceLfsMigrationResult } from "@app/commands/versionControl/lfs/applyWorkspaceLfsMigration";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type { WorkspaceLfsDivergence } from "@ext/enterprise/lfs/workspaceLfsMigration";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import type { LfsMigrationDialogProps } from "@ext/git/actions/Sync/components/LfsMigrationDialog";

const openLfsMigrationDialog = (
	apiUrlCreator: ApiUrlCreator,
	divergence: WorkspaceLfsDivergence,
): Promise<MergeData | undefined> =>
	new Promise<MergeData | undefined>((resolve) => {
		if (ModalToOpenService.hasValue()) {
			resolve(undefined);
			return;
		}

		ModalToOpenService.setValue<LfsMigrationDialogProps>(ModalToOpen.LfsMigration, {
			apiUrlCreator,
			fileDiff: divergence.fileDiff,
			added: divergence.added,
			removed: divergence.removed,
			onSettled: (_migrated, mergeData) => {
				resolve(mergeData);
				ModalToOpenService.resetValue();
			},
		});
	});

const runLfsMigrationFlow = async (apiUrlCreator: ApiUrlCreator): Promise<void> => {
	const res = await FetchService.fetch<WorkspaceLfsDivergence>(
		apiUrlCreator.checkWorkspaceLfsDivergence(),
		undefined,
		MimeTypes.text,
		Method.POST,
		false,
	);
	if (!res.ok) return;

	const divergence = await res.json();
	if (!divergence) return;

	const diverged = divergence.added.length > 0 || divergence.removed.length > 0;
	if (!diverged && !divergence.legacyStaged) return;

	if (diverged) {
		// The dialog owns the apply fetch itself — it resolves only after the migration has been
		// applied (or the user dismissed it). Apply pulls first, so it can come back with conflicts
		// instead of a migration; those go to the regular resolver, the modal slot is already free.
		tryOpenMergeConflict({ mergeData: await openLfsMigrationDialog(apiUrlCreator, divergence) });
		return;
	}

	// legacyStaged without divergence — silently absorbed, no modal. The user didn't ask for
	// this, so a transient backend error must not raise the global error dialog either.
	const applyRes = await FetchService.fetch<ApplyWorkspaceLfsMigrationResult>(
		apiUrlCreator.applyWorkspaceLfsMigration(),
		undefined,
		MimeTypes.text,
		Method.POST,
		false,
	);
	if (applyRes.ok) tryOpenMergeConflict({ mergeData: (await applyRes.json()).mergeData });
};

export default runLfsMigrationFlow;
