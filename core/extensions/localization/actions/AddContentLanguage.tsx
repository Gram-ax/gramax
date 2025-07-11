import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import ExportButton from "@ext/wordExport/components/DropdownButton";
import { useRef } from "react";

export type AddContentLanguageProps = {
	setIsLoading: (flag: boolean) => void;
	onChange: (code: ContentLanguage) => void;
};

const AddContentLanguage = ({ onChange, setIsLoading }: AddContentLanguageProps) => {
	const ref = useRef<HTMLDivElement>(null);

	const props = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, -5]}
			className="wrapper"
			placement="left-start"
			openTrigger="mouseenter focus"
			trigger={<ExportButton ref={ref} iconCode="plus" text={t("multilang.add-localization")} />}
		>
			{Object.values(ContentLanguage).map((code) => {
				const disabled = code == props.language || props.supportedLanguages?.includes(code);
				const button = (
					<ButtonLink
						key={`add-content-language-${code}`}
						text={t(`language.${code}`)}
						onClick={async () => {
							setIsLoading(true);
							const res = await FetchService.fetch(apiUrlCreator.addCatalogLanguage(code));
							if (res.ok) onChange(code);
							else setIsLoading(false);
						}}
						disabled={disabled}
					/>
				);

				return disabled ? (
					<Tooltip
						key={`tooltip-${code}`}
						place="auto"
						hideOnClick
						hideInMobile
						content={t("multilang.error.cannot-add-language")}
					>
						{button}
					</Tooltip>
				) : (
					button
				);
			})}
		</PopupMenuLayout>
	);
};

export default AddContentLanguage;
