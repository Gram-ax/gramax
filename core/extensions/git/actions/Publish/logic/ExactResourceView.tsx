import { useRouter } from "@core/Api/useRouter";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import ExactResourceViewWithContent, {
	type UseResourceArticleViewType,
} from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import resolveResourceTypeByExtension from "@ext/git/actions/Publish/logic/utils/resolveResourceTypeByExtension";
import LoadingWithDiffBottomBar from "@ext/git/core/Diff/components/LoadingWithDiffBottomBar";
import {
	setDiffEnabled,
	setDisabledDoublePanel,
	setDoublePanelLocked,
	setSideBarData,
	setSourceTextLocked,
} from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import useFetchDiffData from "@ext/git/core/Diff/logic/hooks/useFetchDiffData";
import { useResetArticleView } from "@ext/git/core/Diff/logic/hooks/useResetArticleView";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback, useEffect, useRef, useState } from "react";

const ExactResourceView = (props: Omit<UseResourceArticleViewType, "newContent" | "oldContent" | "type">) => {
	const { resourcePath, newScope, oldScope, status, oldResourcePath, filePath } = props;

	const isAdded = status === FileStatus.new;
	const isDeleted = status === FileStatus.delete;

	const ext = resourcePath.extension;
	const type = resolveResourceTypeByExtension(ext);

	const isMountedRef = useRef(false);
	const [isLoading, setIsLoading] = useState(type !== "image" && type !== "unknown");
	const [newContent, setNewContent] = useState<string>(null);
	const [oldContent, setOldContent] = useState<string>(null);

	const router = useRouter();

	useWatch(() => {
		if (!isMountedRef.current) return;
		ArticleViewService.setDefaultView();
		ArticleViewService.useArticleDefaultStyles = true;
	}, [router.path]);

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
		isMountedRef.current = true;
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
		setDisabledDoublePanel(type !== "text");

		if (type !== "image") void getNewData();

		return () => {
			setSourceTextLocked(false);
			setDoublePanelLocked(false);
			setDiffEnabled(false);
			setDisabledDoublePanel(false);
			setSideBarData(null);
		};
	}, []);

	if (isLoading) return <LoadingWithDiffBottomBar />;

	return <ExactResourceViewWithContent {...props} newContent={newContent} oldContent={oldContent} type={type} />;
};

export default ExactResourceView;
