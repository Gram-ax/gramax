import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import { TippyProps } from "@tippyjs/react";

interface EditMarkdownProps {
	visible: boolean;
	children: TippyProps["children"];
}

const EditMarkdown = ({ visible, children }: EditMarkdownProps) => {
	const zIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--z-index-base"), 10);
	return (
		<Tooltip
			appendTo={"parent"}
			content={
				<span>
					{t("click")}
					<em>{" " + t("article.edit-markdown") + " "}</em>
					{t("to-make-changes")}
				</span>
			}
			visible={visible}
			zIndex={zIndex}
		>
			{children}
		</Tooltip>
	);
};

export default EditMarkdown;
