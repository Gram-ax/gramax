import ActionButton from "@components/controls/HoverController/ActionButton";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import { noteIcons, NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
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
	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const updateType = (type: NoteType) => {
		updateAttributes({ type });
	};

	const toggleCollapse = () => {
		const collapsed = !node.attrs.collapsed;
		const curTitle = node.attrs.title;
		const title = collapsed && !curTitle ? t("more") : curTitle;
		updateAttributes({ collapsed, title: title || "" });
		setShowHeadEditor(true);
	};

	const toggleHeadEditor = () => {
		const title = titleRef.current;
		const hasDataBlur = title?.dataset.focus;
		const bValue = !showHeadEditor && !hasDataBlur;

		if (node.attrs.collapsed) {
			updateAttributes({ collapsed: false, title: "" });
			setShowHeadEditor(false);
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
				selected={showHeadEditor}
				tooltipText={t("title")}
				onClick={toggleHeadEditor}
			/>
			<PopupMenuLayout
				offset={[10, -5]}
				appendTo="parent"
				placement="right-start"
				className="wrapper"
				trigger={<ActionButton icon={noteIcons[node.attrs.type]} tooltipText={t("type")} />}
			>
				{Object.values(NoteType).map(
					(value, key) =>
						value !== NoteType.hotfixes && (
							<ButtonLink
								text={t(`${value}-text`)}
								iconCode={noteIcons[value]}
								iconStyle={{ color: `var(--color-admonition-${value}-br-h)` }}
								key={key}
								onClick={() => updateType(value)}
							/>
						),
				)}
			</PopupMenuLayout>
			<ActionButton
				selected={node.attrs.collapsed}
				icon={"chevrons-down-up"}
				tooltipText={t("collapse")}
				onClick={toggleCollapse}
			/>
			<ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />
		</>
	);
};

export default NoteMenuActions;
