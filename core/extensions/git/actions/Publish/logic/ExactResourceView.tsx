import ExactResourceViewWithContent, {
	type UseResourceArticleViewType,
} from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import resolveResourceTypeByExtension from "@ext/git/actions/Publish/logic/utils/resolveResourceTypeByExtension";
import LoadingWithDiffBottomBar from "@ext/markdown/elements/diff/components/LoadingWithDiffBottomBar";
import useFetchDiffData from "@ext/markdown/elements/diff/logic/hooks/useFetchDiffData";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useCallback, useEffect, useState } from "react";

const ExactResourceView = (props: Omit<UseResourceArticleViewType, "newContent" | "oldContent" | "type">) => {
	const { resourcePath, newScope, oldScope, status, oldResourcePath, filePath } = props;

	const isAdded = status === FileStatus.new;
	const isDeleted = status === FileStatus.delete;

	const ext = resourcePath.extension;
	const type = resolveResourceTypeByExtension(ext);

	const [isLoading, setIsLoading] = useState(type !== "image" && type !== "unknown");
	const [newContent, setNewContent] = useState<string>(null);
	const [oldContent, setOldContent] = useState<string>(null);

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

	useEffect(() => {
		if (type === "image" || type === "unknown") return;
		void getNewData();
	}, [getNewData, type]);

	if (isLoading) return <LoadingWithDiffBottomBar filePath={filePath} />;

	return <ExactResourceViewWithContent {...props} newContent={newContent} oldContent={oldContent} type={type} />;
};

export default ExactResourceView;
