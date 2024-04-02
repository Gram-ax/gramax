import Divider from "@components/Atoms/Divider";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import LinkItemSidebar from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import useLocalize from "@ext/localization/useLocalize";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import SnippetListElement from "@ext/markdown/elements/snippet/edit/components/SnippetListElement";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import SnippetRenderData from "@ext/markdown/elements/snippet/model/SnippetRenderData";
import { Editor } from "@tiptap/core";
import { ComponentProps, useEffect, useRef, useState } from "react";

const StyledDiv = styled.div`
	padding: 0 5.5px;
	width: 300px;
`;

const SnippetsButton = ({ editor, className }: { editor: Editor; className?: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);
	const [snippetsList, setSnippetsList] = useState<SnippetEditorProps[]>([]);
	const listRef = useRef<ListLayoutElement>(null);
	const snippetText = useLocalize("snippet");
	const addNewSnippetText = useLocalize("addNewSnippet");

	const getSnippets = async () => {
		const res = await FetchService.fetch<SnippetEditorProps[]>(apiUrlCreator.getSnippetsListData());
		if (!res.ok) return;
		setSnippetsList(await res.json());
	};

	const createSnippet = async (snippetData: SnippetEditData) => {
		await FetchService.fetch(apiUrlCreator.createSnippet(), JSON.stringify(snippetData), MimeTypes.json);

		const res = await FetchService.fetch<SnippetRenderData>(apiUrlCreator.getSnippetRenderData(snippetData.id));
		if (!res.ok) return;
		const data = await res.json();
		editor.commands.setSnippet(data);
	};

	useEffect(() => {
		if (!isTooltipOpen) return;
		void getSnippets();
		const mouseHandler = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!listRef.current.htmlElement.contains(target) && !listRef.current.itemsRef.contains(target))
				setIsTooltipOpen(false);
		};
		const keyHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsTooltipOpen(false);
		};
		document.addEventListener("mousedown", mouseHandler);
		document.addEventListener("keydown", keyHandler);
		return () => {
			document.addEventListener("keydown", keyHandler);
			document.removeEventListener("mousedown", mouseHandler);
		};
	}, [isTooltipOpen]);

	const button = (
		<Button
			icon="tarp"
			tooltipText={isTooltipOpen ? undefined : snippetText}
			onClick={() => setIsTooltipOpen(true)}
			nodeValues={{ action: "snippet" }}
		/>
	);
	if (!isTooltipOpen) return button;

	return (
		<Tooltip
			visible={true}
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						<StyledDiv>
							<ListLayout
								ref={listRef}
								openByDefault
								buttons={[
									{
										element: (
											<div style={{ width: "100%" }}>
												{LinkItemSidebar(addNewSnippetText, "plus")}
												<Divider
													style={{ background: "var(--color-edit-menu-button-active-bg)" }}
												/>
											</div>
										),
										labelField: "addNewSnippet",
										onClick: () => {
											ModalToOpenService.setValue<ComponentProps<typeof SnippetEditor>>(
												ModalToOpen.SnippetEditor,
												{
													type: "create",
													onSave: createSnippet,
													onClose: () => {
														ModalToOpenService.resetValue();
													},
												},
											);
											setIsTooltipOpen(false);
										},
									},
								]}
								isCode={false}
								place="top"
								placeholder={snippetText}
								itemsClassName={className}
								items={snippetsList.map((s) => ({
									labelField: s.title,
									element: (
										<SnippetListElement snippet={s} onEditClick={() => setIsTooltipOpen(false)} />
									),
								}))}
								onItemClick={async (_, __, idx) => {
									setIsTooltipOpen(false);
									const res = await FetchService.fetch<SnippetRenderData>(
										apiUrlCreator.getSnippetRenderData(snippetsList[idx].id),
									);
									if (!res.ok) return;
									const data = await res.json();
									editor.commands.setSnippet(data);
								}}
							/>
						</StyledDiv>
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			{button}
		</Tooltip>
	);
};

export default styled(SnippetsButton)`
	left: 0;
	margin-top: 4px;
	min-width: 238px;
	margin-left: -9px;
	border-radius: var(--radius-big-block);
	background: var(--color-tooltip-background);
	.item {
		color: var(--color-article-bg);
	}
	.item,
	.breadcrumb {
		.link {
			line-height: 1.5em;
		}
	}

	.item.active {
		background: var(--color-edit-menu-button-active-bg);
	}
`;
