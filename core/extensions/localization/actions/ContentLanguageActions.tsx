import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import RemoveContentLanguage from "@ext/localization/actions/RemoveContentLanguage";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";

export type ContentLanguageActionsProps = {
	targetCode: ContentLanguage;
	canSwitch: boolean;
	setIsLoading: (isLoading: boolean) => void;
};

const ContentLanguageActions = ({ canSwitch, setIsLoading, targetCode }: ContentLanguageActionsProps) => {
	return (
		<PopupMenuLayout
			className="wrapper"
			placement="right-start"
			trigger={
				<Tooltip hideInMobile content={t("actions")}>
					<Icon code="ellipsis" onClick={(e) => e.stopPropagation()} />
				</Tooltip>
			}
		>
			<RemoveContentLanguage key={0} setIsLoading={setIsLoading} disabled={!canSwitch} targetCode={targetCode} />
		</PopupMenuLayout>
	);
};

export default ContentLanguageActions;
