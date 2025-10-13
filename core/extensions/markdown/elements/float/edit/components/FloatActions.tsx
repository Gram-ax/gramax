import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import { FLOAT_ALIGN_ICONS } from "@ext/markdown/elements/float/edit/model/consts";
import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";
import { Node } from "@tiptap/pm/model";
import { Editor } from "@tiptap/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioItem,
	DropdownMenuRadioGroup,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";

const FloatActions = ({ node, editor }: { node: Node; editor: Editor }) => {
	const float: FloatAlign = node.attrs.float || "center";

	const setFloat = (align: FloatAlign) => {
		editor.commands.setFloat(node.type, align);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<ActionButton icon={FLOAT_ALIGN_ICONS[float]} tooltipText={t("editor.float.name")} />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuRadioGroup value={float} onValueChange={setFloat}>
					<DropdownMenuRadioItem value="left">{t(`editor.float.left`)}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="center">{t(`editor.float.center`)}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="right">{t(`editor.float.right`)}</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default FloatActions;
