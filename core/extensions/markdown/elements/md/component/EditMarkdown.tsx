import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";

interface EditMarkdownProps {
	visible: boolean;
	children: React.ReactNode;
}

const EditMarkdown = ({ visible, children }: EditMarkdownProps) => {
	return (
		<TooltipProvider>
			<Tooltip open={visible}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent>
					<span>
						{t("click")}
						<em>{` ${t("article.edit-markdown")} `}</em>
						{t("to-make-changes")}
					</span>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default EditMarkdown;
