import ActionButton from "@components/controls/HoverController/ActionButton";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import { FLOAT_ALIGN_ICONS } from "@ext/markdown/elements/float/edit/model/consts";
import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";
import { Node } from "@tiptap/pm/model";
import { Editor } from "@tiptap/react";

const FloatActions = ({ node, editor }: { node: Node; editor: Editor }) => {
	const float = node.attrs.float || "center";

	const setFloat = (align: FloatAlign) => {
		editor.commands.setFloat(node.type, align);
	};

	return (
		<PopupMenuLayout
			offset={[10, -5]}
			appendTo="parent"
			placement="right-start"
			className="wrapper"
			trigger={<ActionButton icon={FLOAT_ALIGN_ICONS[float]} tooltipText={t("editor.float.name")} />}
		>
			<ButtonLink
				text={t(`editor.float.left`)}
				iconCode={FLOAT_ALIGN_ICONS.left}
				onClick={() => setFloat("left")}
			/>
			<ButtonLink
				text={t(`editor.float.center`)}
				iconCode={FLOAT_ALIGN_ICONS.center}
				onClick={() => setFloat("center")}
			/>
			<ButtonLink
				text={t(`editor.float.right`)}
				iconCode={FLOAT_ALIGN_ICONS.right}
				onClick={() => setFloat("right")}
			/>
		</PopupMenuLayout>
	);
};

export default FloatActions;
