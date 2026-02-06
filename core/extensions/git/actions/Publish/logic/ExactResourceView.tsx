import ExactResourceViewWithContent, {
	DIAGRAM_FILE_TYPES,
	IMG_FILE_TYPES,
	UseResourceArticleViewType,
} from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import LoadingWithDiffBottomBar from "@ext/markdown/elements/diff/components/LoadingWithDiffBottomBar";
import useFetchDiffData from "@ext/markdown/elements/diff/logic/hooks/useFetchDiffData";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useEffect, useState } from "react";

const ExactResourceView = (props: Omit<UseResourceArticleViewType, "newContent" | "oldContent" | "type">) => {
	const { resourcePath, newScope, oldScope, status, oldResourcePath, filePath } = props;

	const isAdded = status === FileStatus.new;
	const isDeleted = status === FileStatus.delete;

	const ext = resourcePath.extension;
	const maybeDiagramType = DIAGRAM_FILE_TYPES[ext];
	let type: "image" | "diagram" | "text" = "text";

	if (IMG_FILE_TYPES.includes(ext)) {
		type = "image";
	} else if (maybeDiagramType) {
		type = "diagram";
	}

	const [isLoading, setIsLoading] = useState(type !== "image");
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

	const getNewData = async () => {
		setIsLoading(true);
		const { newData, oldData } = await fetchDiffData(null);
		setNewContent(newData?.content);
		setOldContent(oldData?.content);
		setIsLoading(false);
	};

	useEffect(() => {
		if (type === "image") return;
		void getNewData();
	}, []);

	if (isLoading) return <LoadingWithDiffBottomBar filePath={filePath} />;

	return <ExactResourceViewWithContent {...props} newContent={newContent} oldContent={oldContent} type={type} />;
};

export default ExactResourceView;
