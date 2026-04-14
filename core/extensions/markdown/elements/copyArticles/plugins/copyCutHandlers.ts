import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import { copy } from "@ext/markdown/elements/copyArticles/handlers/copy";
import type { EditorView } from "prosemirror-view";

export const handleCopy = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
) => {
	event.preventDefault();
	copy(view, event, articleProps, resourceService);
};

export const handleCut = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
) => {
	event.preventDefault();
	copy(view, event, articleProps, resourceService, { cut: view.editable });
};
