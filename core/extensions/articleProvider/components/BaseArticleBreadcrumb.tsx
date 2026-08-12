import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import t from "@ext/localization/locale/translate";

interface BaseArticleBreadcrumbProps {
	onCloseClick: () => void;
}

const BaseArticleBreadcrumb = ({ onCloseClick }: BaseArticleBreadcrumbProps) => {
	return (
		<div className="flex items-center justify-end flex-wrap">
			<TooltipIconButton
				className="size-7"
				icon="x"
				iconClassName="size-3.5 shrink-0"
				onClick={onCloseClick}
				size="md"
				tooltip={t("close")}
				variant="text"
			/>
		</div>
	);
};
export default BaseArticleBreadcrumb;
