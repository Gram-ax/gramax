import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import useWatch from "@core-ui/hooks/useWatch";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { DiffEntries, DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import { useDiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/useDiffEntries";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useState } from "react";

export type ChangesProps = {
	targetRef: string;
	stage: DiffEntriesLoadStage;
	setStage: (stage: DiffEntriesLoadStage) => void;
};

export const Changes = ({ targetRef, stage, setStage }: ChangesProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const { changes, stage: newStage } = useDiffEntries();
	const mergeBase = changes?.mergeBase;

	const deleteScope = useMemo<TreeReadScope>(
		() => (mergeBase ? { commit: mergeBase } : { reference: targetRef }),
		[mergeBase, targetRef],
	);

	const setArticleDiffView = useSetArticleDiffView(false, null, deleteScope);

	useEffect(() => {
		if (!isCollapsed) setIsCollapsed(true);
	}, []);

	useWatch(() => {
		setStage(newStage);
	}, [newStage]);

	const DiffEntriesCached = useMemo(() => {
		return changes ? (
			<ScrollableDiffEntriesLayout>
				<DiffEntries changes={changes.tree} renderCommentsCount setArticleDiffView={setArticleDiffView} />
			</ScrollableDiffEntriesLayout>
		) : null;
	}, [changes]);

	return (
		<Section
			chevron={false}
			headerStyles="padding-left: 1rem; padding-right: 1rem;"
			isCollapsed={false}
			isLoading={stage === DiffEntriesLoadStage.Loading}
			isNotLoaded={!changes}
			right={changes && <Overview fontSize="12px" showTotal {...(changes?.overview || {})} />}
			title={t("git.merge-requests.diff")}
		>
			{DiffEntriesCached}
		</Section>
	);
};
