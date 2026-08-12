import Icon from "@components/Atoms/Icon";
import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import getIconColor from "@ext/markdown/elements/note/edit/logic/getNoteButtonIconColor";
import { NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";

interface NoteMenuActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	updateAttributes: (attributes: Record<string, unknown>, transaction?: boolean) => void;
}

const NoteMenuActions = (props: NoteMenuActionsProps) => {
	const { editor, node, getPos, updateAttributes } = props;
	const hasTitle = node.firstChild?.type.name === "noteTitle";

	const updateType = (type: NoteType) => {
		updateAttributes({ type });
	};

	const addTitle = (text = "") => {
		const pos = getPos() + 1;
		editor
			.chain()
			.insertContentAt(pos, { type: "noteTitle", content: text ? [{ type: "text", text }] : [] })
			.focus(pos + 1, { scrollIntoView: false })
			.run();
	};

	const removeTitle = () => {
		const titleNode = node.firstChild;
		if (titleNode?.type.name !== "noteTitle") return;
		const from = getPos() + 1;
		editor
			.chain()
			.deleteRange({ from, to: from + titleNode.nodeSize })
			.focus(from, { scrollIntoView: false })
			.run();
	};

	const toggleHeadEditor = () => {
		if (hasTitle) removeTitle();
		else addTitle();
	};

	const toggleCollapse = () => {
		const collapsed = !node.attrs.collapsed;
		updateAttributes({ collapsed });
		if (collapsed && !hasTitle) addTitle(t("more"));
	};

	return (
		<>
			<ActionButton icon="heading" onClick={toggleHeadEditor} selected={hasTitle} tooltipText={t("title")} />
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
							(value) =>
								value !== NoteType.hotfixes && (
									<DropdownMenuRadioItem key={value} value={value}>
										<Icon code={noteIcons[value]} style={{ color: getIconColor(value) }} />
										<span>{t(`${value}-text`)}</span>
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
