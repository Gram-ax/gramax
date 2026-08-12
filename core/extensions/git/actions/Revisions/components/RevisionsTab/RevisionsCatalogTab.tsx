import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import { RevisionsCompare } from "@ext/git/actions/Revisions/components/RevisionsTab/Compare/RevisionsCompare";
import { RevisionCatalogFilters } from "@ext/git/actions/Revisions/components/RevisionsTab/Filters/RevisionCatalogFilters";
import RevisionCommitsList from "@ext/git/actions/Revisions/components/RevisionsTab/Helpers/RevisionCommitsList";
import { useRevisionsCatalogTab } from "@ext/git/actions/Revisions/logic/hooks/useRevisionsCatalogTab";
import t from "@ext/localization/locale/translate";
import { memo, type RefObject, useCallback, useRef, useState } from "react";

interface RevisionsCatalogTabProps {
	show: boolean;
	setShow: (show: boolean) => void;
}

const RightExtensions = memo(({ tabWrapperRef }: { tabWrapperRef: RefObject<HTMLDivElement> }) => {
	return (
		<>
			<RevisionsCompare tabWrapperRef={tabWrapperRef} />
			<RevisionCatalogFilters tabWrapperRef={tabWrapperRef} />
		</>
	);
});

const RevisionsCatalogTab = memo((props: RevisionsCatalogTabProps) => {
	const { show, setShow } = props;

	const tabWrapperRef = useRef<HTMLDivElement>(null);

	const [tabHeight, setTabHeight] = useState<number>(0);
	const [contentHeight, setContentHeight] = useState<number>(() => tabHeight);
	const bottomTab = NavigationTabsService.value.bottomTab;

	const {
		revisions,
		reachedFirstCommit,
		requestMore,
		diffTree,
		isDiffTreeLoading,
		onRevisionClick,
		selectedCommitOid,
	} = useRevisionsCatalogTab({
		show,
		setShow,
		navigationBottomTab: bottomTab,
	});

	const onSetContentHeight = useCallback((height: number) => {
		setContentHeight(height);
		setTabHeight(height);
	}, []);

	return (
		<TabWrapper
			className="max-h-[50dvh] flex flex-col"
			contentHeight={contentHeight}
			onClose={() => setShow(false)}
			ref={tabWrapperRef}
			show={show}
			title={t("git.history.name")}
			titleRightExtension={<RightExtensions tabWrapperRef={tabWrapperRef} />}
		>
			<RevisionCommitsList
				currentRevision={selectedCommitOid}
				diffTree={diffTree}
				isDiffTreeLoading={isDiffTreeLoading}
				onClick={onRevisionClick}
				requestMore={requestMore}
				revisions={revisions}
				setContentHeight={onSetContentHeight}
				shouldLoadMoreAtScrollEnd={!reachedFirstCommit}
				show={show}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
});

export default RevisionsCatalogTab;
