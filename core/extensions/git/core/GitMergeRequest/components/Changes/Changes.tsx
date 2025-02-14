import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import { DiffEntries, DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import { useDiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/useDiffEntries";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ChangesProps = {
	sourceRef: string;
	targetRef: string;
};

export const Changes = ({ targetRef, sourceRef }: ChangesProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const setArticleDiffView = useSetArticleDiffView({ reference: sourceRef }, { reference: targetRef });
	const { changes, stage, requestChanges } = useDiffEntries(targetRef, sourceRef);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const toggleChanges = useCallback(async () => {
		if (!isCollapsed) {
			setIsCollapsed(true);
			await FetchService.fetch(apiUrlCreator.cleanupReferencesDiff(sourceRef, targetRef));
			return;
		}

		setIsCollapsed(false);
		if (stage === DiffEntriesLoadStage.NotLoaded) requestChanges();
		else if (stage === DiffEntriesLoadStage.Ready) {
			await FetchService.fetch(apiUrlCreator.mountReferencesDiff(sourceRef, targetRef));
		}
	}, [requestChanges, isCollapsed, stage]);

	useEffect(() => {
		toggleChanges();
	}, []);

	const DiffEntriesCached = useMemo(() => {
		return changes ? (
			<ScrollableDiffEntriesLayout>
				<DiffEntries changes={changes.tree} setArticleDiffView={setArticleDiffView} />
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
