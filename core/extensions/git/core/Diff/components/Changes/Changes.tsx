import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import useWatch from "@core-ui/hooks/useWatch";
import { DiffEntries, DiffEntriesLoadStage } from "@ext/git/core/Diff/components/Changes/DiffEntries";
import { Overview } from "@ext/git/core/Diff/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/Diff/components/Changes/ScrollableDiffEntriesLayout";
import { useDiffEntries } from "@ext/git/core/Diff/logic/hooks/useDiffEntries";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type ChangesProps = {
	targetRef: string;
	stage: DiffEntriesLoadStage;
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	onPathnamesChange?: (pathnames: string[]) => void;
	setStage: (stage: DiffEntriesLoadStage) => void;
	setContentHeight: (height: number) => void;
};

export const Changes = ({
	targetRef,
	stage,
	setStage,
	show,
	tabWrapperRef,
	onPathnamesChange,
	setContentHeight,
}: ChangesProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const { changes, stage: newStage } = useDiffEntries();
	const mergeBase = changes?.mergeBase;
	const scrollbarRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const deleteScope = useMemo<TreeReadScope>(
		() => (mergeBase ? { commit: mergeBase } : { reference: targetRef }),
		[mergeBase, targetRef],
	);

	const setArticleDiffView = useSetArticleDiffView(null, deleteScope);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (!containerRef.current || !tabWrapperRef.current || !show) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = containerRef.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild?.dataset?.qa === "loader";

		if (!mainElement && !isSpinner) return;
		const height =
			calculateTabWrapperHeight(mainElement) - parseFloat(getComputedStyle(document.documentElement).fontSize);

		setContentHeight(height);
	}, [containerRef.current, tabWrapperRef.current, show, stage, changes?.data, scrollbarRef.current]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!isCollapsed) setIsCollapsed(true);
	}, []);

	useWatch(() => {
		setStage(newStage);
	}, [newStage]);

	useEffect(() => {
		if (!changes?.data) return;

		const pathnames = changes.data.reduce((acc, entry) => {
			if (entry.type === "item") acc.push(entry.pathname);
			return acc;
		}, [] as string[]);

		onPathnamesChange?.(pathnames);
	}, [changes?.data, onPathnamesChange]);

	return (
		<Section
			chevron={false}
			headerStyles="padding-left: 1rem; padding-right: 1rem;"
			isCollapsed={false}
			isLoading={changes && stage === DiffEntriesLoadStage.Loading}
			isNotLoaded={!changes}
			right={changes && <Overview fontSize="12px" showTotal {...(changes?.overview || {})} />}
			title={t("git.merge-requests.diff")}
		>
			<ScrollableDiffEntriesLayout maxHeight="15rem" ref={scrollbarRef}>
				{!changes && stage !== DiffEntriesLoadStage.Ready ? (
					<Loader className="py-6" ref={containerRef} size="3xl" />
				) : (
					<DiffEntries
						changes={changes.data}
						key={changes.data.length}
						onClick={setArticleDiffView}
						ref={containerRef}
						renderCommentsCount
						scrollableRef={scrollbarRef}
					/>
				)}
			</ScrollableDiffEntriesLayout>
		</Section>
	);
};
