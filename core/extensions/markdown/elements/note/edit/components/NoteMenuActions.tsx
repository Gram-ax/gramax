import Icon from "@components/Atoms/Icon";
import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import { NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { RefObject } from "react";

interface NoteMenuActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	updateAttributes: (attributes: Record<string, any>, transaction?: boolean) => void;
	setShowHeadEditor: (show: boolean) => void;
	showHeadEditor: boolean;
	titleRef: RefObject<HTMLInputElement>;
}

const NoteMenuActions = (props: NoteMenuActionsProps) => {
	const { editor, node, getPos, updateAttributes, setShowHeadEditor, showHeadEditor, titleRef } = props;

	const updateType = (type: NoteType) => {
		updateAttributes({ type });
	};

	const toggleCollapse = () => {
		const collapsed = !node.attrs.collapsed;
		const curTitle = node.attrs.title;
		const title = !curTitle ? t("more") : curTitle;
		if (titleRef.current) titleRef.current.value = title || "";
		updateAttributes({ collapsed, title: title || "" });
		setShowHeadEditor(true);
	};

	const toggleHeadEditor = () => {
		const title = titleRef.current;
		const hasDataBlur = title?.dataset.focus;
		const bValue = !showHeadEditor && !hasDataBlur;

		if (node.attrs.collapsed) {
			const curTitle = node.attrs.title;
			const newTitle = !curTitle ? t("more") : curTitle;

			updateAttributes({ title: newTitle || "" });

			if (title) title.value = newTitle || "";
		} else if (!title?.value.length && hasDataBlur) {
			updateAttributes({ title: "" });
			setShowHeadEditor(false);
		} else {
			setShowHeadEditor(bValue);

			if (bValue) {
				title?.focus();
			}
		}

		title?.removeAttribute("data-focus");

		if (!bValue) {
			updateAttributes({ title: "" });
			editor.commands.focus(getPos() + 1);
		}
	};

	return (
		<>
			<ActionButton
				icon="heading"
				onClick={toggleHeadEditor}
				selected={showHeadEditor}
				tooltipText={t("title")}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<ActionButton icon={noteIcons[node.attrs.type]} tooltipText={t("type")} />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						indicatorIconPosition="end"
						onValueChange={updateType}
						value={node.attrs.type}
					>
						{Object.values(NoteType).map(
							(value, key) =>
								value !== NoteType.hotfixes && (
									<DropdownMenuRadioItem key={key} value={value}>
										<Icon
											code={noteIcons[value]}
											style={{ color: `var(--color-admonition-${value}-br-h)` }}
										/>
										<span style={{ color: `var(--color-admonition-${value}-br-h)` }}>
											{t(`${value}-text`)}
										</span>
									</DropdownMenuRadioItem>
								),
						)}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<ActionButton
				icon={"chevrons-down-up"}
				onClick={toggleCollapse}
				selected={node.attrs.collapsed}
				tooltipText={t("collapse")}
			/>
		</>
	);
};

export default NoteMenuActions;
