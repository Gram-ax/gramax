import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import useWatch from "@core-ui/hooks/useWatch";
import { DiffEntries, DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import { useDiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/useDiffEntries";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useState } from "react";

export type ChangesProps = {
	sourceRef: string;
	targetRef: string;
	stage: DiffEntriesLoadStage;
	setStage: (stage: DiffEntriesLoadStage) => void;
};

export const Changes = ({ targetRef, sourceRef, stage, setStage }: ChangesProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const setArticleDiffView = useSetArticleDiffView(true, { reference: sourceRef }, { reference: targetRef });
	const { changes, stage: newStage } = useDiffEntries();

	useEffect(() => {
		if (!isCollapsed) setIsCollapsed(true);
	}, []);

	useWatch(() => {
		setStage(newStage);
	}, [newStage]);

	const DiffEntriesCached = useMemo(() => {
		return changes ? (
			<ScrollableDiffEntriesLayout>
				<DiffEntries changes={changes.tree} setArticleDiffView={setArticleDiffView} renderCommentsCount />
			</ScrollableDiffEntriesLayout>
		) : null;
	}, [changes]);

	return (
		<Section
			chevron={false}
			title={t("git.merge-requests.diff")}
			isCollapsed={false}
			isNotLoaded={!changes}
			isLoading={stage === DiffEntriesLoadStage.Loading}
			right={stage === DiffEntriesLoadStage.Ready && <Overview showTotal fontSize="12px" {...changes.overview} />}
			headerStyles="padding-left: 1rem; padding-right: 1rem;"
		>
			{DiffEntriesCached}
		</Section>
	);
};
