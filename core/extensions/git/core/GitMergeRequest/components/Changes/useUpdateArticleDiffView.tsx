import findDiffItemByPath from "@components/Layouts/StatusBar/Extensions/logic/findDiffItemByPath";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { DiffItemOrResource } from "@ext/VersionControl/model/Diff";
import { useRef } from "react";

interface UseUpdateArticleViewProps {
	changes: DiffTreeAnyItem[];
	currentSelectedPath: string;
	setArticleDiffView: (item: DiffItemOrResource) => void;
}

const useUpdateArticleDiffView = (props: UseUpdateArticleViewProps) => {
	const { changes, currentSelectedPath, setArticleDiffView } = props;

	const isSetArticleDiffViewChanged = useRef<boolean>(null);

	useWatch(() => {
		const isInit = isSetArticleDiffViewChanged.current === null;
		if (isInit) {
			isSetArticleDiffViewChanged.current = false;
			return;
		}
		isSetArticleDiffViewChanged.current = true;
	}, [setArticleDiffView]);

	const updateDiffView = () => {
		if (!currentSelectedPath || ArticleViewService.isDefaultView()) return;
		const entry = findDiffItemByPath(changes, currentSelectedPath);
		if (!entry || entry.type === "node") return;
		setArticleDiffView(entry.rawItem);
	};

	useWatch(() => {
		if (!isSetArticleDiffViewChanged.current) return;
		isSetArticleDiffViewChanged.current = false;
		updateDiffView();
	}, [changes]);
};

export default useUpdateArticleDiffView;
