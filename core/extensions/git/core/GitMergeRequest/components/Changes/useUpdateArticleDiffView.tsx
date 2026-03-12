import findDiffItemByPath from "@components/Layouts/StatusBar/Extensions/logic/findDiffItemByPath";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { useRef } from "react";

interface UseUpdateArticleViewProps {
	changes: DiffFlattenTreeAnyItem[];
	currentSelectedPath: string;
	setArticleDiffView: (item: DiffFlattenTreeAnyItem) => void;
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
		setArticleDiffView(entry);
	};

	useWatch(() => {
		if (!isSetArticleDiffViewChanged.current) return;
		isSetArticleDiffViewChanged.current = false;
		updateDiffView();
	}, [changes]);
};

export default useUpdateArticleDiffView;
