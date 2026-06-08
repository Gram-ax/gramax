import ExactResourceViewWithContent, {
	type UseResourceArticleViewType,
} from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import resolveResourceTypeByExtension from "@ext/git/actions/Publish/logic/utils/resolveResourceTypeByExtension";
import LoadingWithDiffBottomBar from "@ext/git/core/Diff/components/LoadingWithDiffBottomBar";
import {
	setDiffEnabled,
	setDoublePanelLocked,
	setSideBarData,
	setSourceTextLocked,
	updateDiffViewMode,
	updateDisabledViewModes,
	useDiffViewMode,
} from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import useFetchDiffData from "@ext/git/core/Diff/logic/hooks/useFetchDiffData";
import { useResetArticleView } from "@ext/git/core/Diff/logic/hooks/useResetArticleView";
import type { DiffViewMode } from "@ext/git/core/Diff/logic/model/DiffView";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback, useEffect, useRef, useState } from "react";

const ExactResourceView = (props: Omit<UseResourceArticleViewType, "newContent" | "oldContent" | "type">) => {
	const { resourcePath, newScope, oldScope, status, oldResourcePath, filePath } = props;

	const isAdded = status === FileStatus.new;
	const isDeleted = status === FileStatus.delete;

	const ext = resourcePath.extension;
	const type = resolveResourceTypeByExtension(ext);

	const [isLoading, setIsLoading] = useState(type !== "image" && type !== "unknown");
	const [newContent, setNewContent] = useState<string>(null);
	const [oldContent, setOldContent] = useState<string>(null);

	const diffModeViewRef = useRef<DiffViewMode>(null);
	const diffModeView = useDiffViewMode();
	diffModeViewRef.current = diffModeView;

	const fetchDiffData = useFetchDiffData({
		isAdded,
		isDeleted,
		scope: newScope,
		oldScope,
		newPath: resourcePath.value,
		oldPath: oldResourcePath.value,
		isResource: true,
	});

	const getNewData = useCallback(async () => {
		setIsLoading(true);
		const { newData, oldData } = await fetchDiffData(null);
		setNewContent(newData?.content);
		setOldContent(oldData?.content);
		setIsLoading(false);
	}, [fetchDiffData]);

	useResetArticleView();

	useEffect(() => {
		if (type === "image" || type === "unknown") return;
		void getNewData();
	}, [getNewData, type]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const previousDiffViewMode = diffModeViewRef.current;
		const isWysiwyg = previousDiffViewMode === "wysiwyg-single" || previousDiffViewMode === "wysiwyg-double";

		setDiffEnabled(true);
		setSourceTextLocked(type === "text");
		setDoublePanelLocked(type !== "text" || isDeleted);
		setSideBarData({
			pathname: resourcePath.value,
			isResource: true,
			data: {
				title: resourcePath.value,
				filePath,
				status,
				isChanged: true,
				resources: [],
				isChecked: true,
				logicPath: undefined,
				added: undefined,
				deleted: undefined,
			},
		});
		updateDisabledViewModes(
			type === "text"
				? ["wysiwyg-double", "wysiwyg-single"]
				: ["double-panel", "wysiwyg-double", "wysiwyg-single", "single-panel"],
		);

		if (type === "text" && isWysiwyg) updateDiffViewMode("single-panel");
		if (type === "image") updateDiffViewMode("wysiwyg-single");

		if (type !== "image") void getNewData();

		return () => {
			setSourceTextLocked(false);
			setDoublePanelLocked(false);
			setDiffEnabled(false);
			updateDisabledViewModes([]);
			updateDiffViewMode(diffModeViewRef.current);
			setSideBarData(null);
		};
	}, []);

	if (isLoading) return <LoadingWithDiffBottomBar />;

	return <ExactResourceViewWithContent {...props} newContent={newContent} oldContent={oldContent} type={type} />;
};

export default ExactResourceView;
