import DiagramType from "@core/components/Diagram/DiagramType";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import type { Mark, NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import t from "@ext/localization/locale/translate";
import useSupportedElements from "@ext/markdown/core/edit/components/Menu/Groups/hooks/useSupportedElements";
import PropertyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Property";
import DiagramsMenuButton from "@ext/markdown/elements/diagrams/edit/components/DiagramsMenuButton";
import DrawioMenuButton from "@ext/markdown/elements/drawio/edit/components/DrawioMenuButton";
import { FileMenuButtonDropdown } from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import FragmentsButton from "@ext/markdown/elements/fragment/edit/components/FragmentsButton";
import HTMLMenuButton from "@ext/markdown/elements/html/edit/components/HTMLMenuButton";
import IconMenuButton from "@ext/markdown/elements/icon/edit/components/IconMenuButton";
import ImageMenuButton from "@ext/markdown/elements/image/edit/components/ImageMenuButton";
import OpenApiMenuButton from "@ext/markdown/elements/openApi/edit/components/OpenApiMenuButton";
import QuestionMenuButton from "@ext/markdown/elements/question/edit/components/QuestionMenuButton";
import TabsMenuButton from "@ext/markdown/elements/tabs/edit/components/TabsMenuButton";
import VideoMenuButton from "@ext/markdown/elements/video/edit/components/VideoMenuButton";
import ViewMenuButton from "@ext/markdown/elements/view/edit/components/ViewMenuButton";
import type { Editor } from "@tiptap/core";
import { useSearchableMenu } from "@ui-kit/Dropdown";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

export enum Sections {
	Diagrams = "diagrams",
	Tools = "tools",
	Attachments = "attachments",
}

export interface MenuItem {
	key: string;
	section: Sections;
	label: string;
	node: ReactNode;
	type: "action" | "mark";
}

export const SECTION_LABELS: Record<Sections, () => string> = {
	diagrams: () => t("diagrams"),
	tools: () => t("editor.tools"),
	attachments: () => t("editor.attachments"),
};

interface UseSemiBlocksMenuProps {
	editor?: Editor;
	fileName?: string;
	isSmallEditor?: boolean;
	includeResources?: boolean;
}

const useSemiBlocksMenu = ({ editor, fileName, isSmallEditor, includeResources }: UseSemiBlocksMenuProps) => {
	const { search, setSearch, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } = useSearchableMenu();
	const [isOpen, setIsOpen] = useState(false);

	const {
		isTabsSupported,
		isFragmentSupported,
		isHtmlSupported,
		isViewSupported,
		isDrawioSupported,
		isMermaidSupported,
		isPlantUmlSupported,
		isOpenApiSupported,
		isVideoSupported,
		isIconSupported,
	} = useSupportedElements();

	const hasDiagrams =
		includeResources && (isDrawioSupported || isMermaidSupported || isPlantUmlSupported || isOpenApiSupported);
	const hasFiles = includeResources;
	const hasTools = isTabsSupported || isFragmentSupported || isHtmlSupported || isViewSupported;

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) setSearch("");
		},
		[setSearch],
	);

	const onSave = useCallback(() => {
		setIsOpen(false);
	}, []);

	const allItems = useMemo<MenuItem[]>(() => {
		const items: MenuItem[] = [];

		if (hasTools) {
			items.push({
				key: "property",
				section: Sections.Tools,
				type: "action",
				label: t("editor.property"),
				node: <PropertyMenuGroup editor={editor} />,
			});
			if (!isSmallEditor && isFragmentSupported && includeResources)
				items.push({
					key: "fragments",
					section: Sections.Tools,
					type: "action",
					label: t("fragments"),
					node: <FragmentsButton editor={editor} />,
				});
			items.push({
				key: "question",
				section: Sections.Tools,
				type: "action",
				label: t("editor.question.name"),
				node: <QuestionMenuButton editor={editor} />,
			});
			if (isTabsSupported)
				items.push({
					key: "tabs",
					section: Sections.Tools,
					type: "action",
					label: t("editor.tabs.name"),
					node: <TabsMenuButton editor={editor} />,
				});
			if (isHtmlSupported)
				items.push({
					key: "html",
					section: Sections.Tools,
					type: "action",
					label: "HTML",
					node: <HTMLMenuButton editor={editor} />,
				});
			if (!isSmallEditor && isViewSupported)
				items.push({
					key: "view",
					section: Sections.Tools,
					type: "action",
					label: t("properties.view.name"),
					node: <ViewMenuButton editor={editor} />,
				});
		}

		if (hasDiagrams) {
			if (isDrawioSupported)
				items.push({
					key: "drawio",
					section: Sections.Diagrams,
					type: "action",
					label: t("diagram.names.drawio"),
					node: <DrawioMenuButton editor={editor} fileName={fileName} />,
				});
			if (isMermaidSupported)
				items.push({
					key: "mermaid",
					section: Sections.Diagrams,
					type: "action",
					label: t("diagram.names.mermaid"),
					node: <DiagramsMenuButton diagramName={DiagramType.mermaid} editor={editor} fileName={fileName} />,
				});
			if (isPlantUmlSupported)
				items.push({
					key: "plant-uml",
					section: Sections.Diagrams,
					type: "action",
					label: t("diagram.names.puml"),
					node: (
						<DiagramsMenuButton
							diagramName={DiagramType["plant-uml"]}
							editor={editor}
							fileName={fileName}
						/>
					),
				});
			if (isOpenApiSupported)
				items.push({
					key: "openapi",
					section: Sections.Diagrams,
					type: "action",
					label: t("open-api"),
					node: <OpenApiMenuButton editor={editor} />,
				});
		}

		if (hasFiles) {
			if (!isSmallEditor)
				items.push({
					key: "file",
					section: Sections.Attachments,
					type: "mark",
					label: t("file"),
					node: <FileMenuButtonDropdown editor={editor} onSave={onSave} />,
				});
			items.push({
				key: "image",
				section: Sections.Attachments,
				type: "action",
				label: t("image"),
				node: <ImageMenuButton editor={editor} fileName={fileName} onSave={onSave} />,
			});
			if (isVideoSupported)
				items.push({
					key: "video",
					section: Sections.Attachments,
					type: "action",
					label: t("editor.video.name"),
					node: <VideoMenuButton editor={editor} />,
				});
			if (isIconSupported)
				items.push({
					key: "icon",
					section: Sections.Attachments,
					type: "action",
					label: t("icon"),
					node: <IconMenuButton editor={editor} />,
				});
		}

		return items;
	}, [
		editor,
		onSave,
		fileName,
		isSmallEditor,
		includeResources,
		hasDiagrams,
		hasFiles,
		hasTools,
		isDrawioSupported,
		isMermaidSupported,
		isPlantUmlSupported,
		isOpenApiSupported,
		isVideoSupported,
		isIconSupported,
		isTabsSupported,
		isFragmentSupported,
		isHtmlSupported,
		isViewSupported,
	]);

	const buttonStates = allItems.map((item) =>
		// eslint-disable-next-line react-hooks/rules-of-hooks
		ButtonStateService.useCurrentAction(
			item.type === "mark" ? { mark: item.key as Mark } : { action: item.key as NodeType },
		),
	);

	const filteredItems = filterItems(allItems);
	const isSearching = search.length > 0;

	const renderedSections = useMemo(
		() =>
			Object.values(Sections)
				.map((section) => filteredItems.filter((item) => item.section === section))
				.filter((items) => items.length > 0),
		[filteredItems],
	);

	const filteredStates = filteredItems.map((item) => buttonStates[allItems.indexOf(item)]);

	const isActived = useMemo(() => filteredStates.some((s) => s.isActive), [filteredStates]);
	const disabled = useMemo(
		() => filteredStates.length > 0 && filteredStates.every((s) => s.disabled),
		[filteredStates],
	);

	return {
		isOpen,
		search,
		setSearch,
		inputRef,
		handleContentKeyDown,
		handleInputKeyDown,
		onOpenChange,
		renderedSections,
		isSearching,
		hasDiagrams,
		hasFiles,
		hasTools,
		isActived,
		disabled,
	};
};

export default useSemiBlocksMenu;
