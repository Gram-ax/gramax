import { NotePaginator } from "@ext/markdown/elements/note/print/NotePaginator";
import { SnippetPaginator } from "@ext/markdown/elements/snippet/print/SnippetPaginator";
import { TabsPaginator } from "@ext/markdown/elements/tabs/print/TabsPaginator";
import type NodePaginator from "@ext/print/utils/pagination/NodePaginator";

const paginatorsWithoutAutoPageCreation = [SnippetPaginator, NotePaginator, TabsPaginator];

const someParentHaveChildNodes = (paginator: NodePaginator) => {
	let parent = paginator.parentPaginator;
	if (parent.haveChildNodes()) return true;
	while (parent) {
		if (
			paginatorsWithoutAutoPageCreation.some((P) => parent instanceof P) &&
			(parent as NodePaginator).parentPaginator.haveChildNodes()
		) {
			return true;
		}
		parent = (parent as NodePaginator).parentPaginator;
	}
};

export default someParentHaveChildNodes;
