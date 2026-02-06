import RemoveContentLanguage from "@ext/localization/actions/RemoveContentLanguage";
import type { ContentLanguage } from "@ext/localization/core/model/Language";

export type ContentLanguageActionsProps = {
	targetCode: ContentLanguage;
	canSwitch: boolean;
	setIsLoading: (isLoading: boolean) => void;
};

const ContentLanguageActions = ({ canSwitch, setIsLoading, targetCode }: ContentLanguageActionsProps) => {
	return (
		<div>
			<RemoveContentLanguage
				disabled={!canSwitch}
				key={`remove-content-language-${targetCode}`}
				setIsLoading={setIsLoading}
				targetCode={targetCode}
			/>
		</div>
	);
};

export default ContentLanguageActions;
