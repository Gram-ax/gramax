import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

export type AddContentLanguageProps = {
	setIsLoading: (flag: boolean) => void;
	onChange: (code: ContentLanguage) => void;
};

const AddContentLanguage = ({ onChange, setIsLoading }: AddContentLanguageProps) => {
	const { supportedLanguages, language } = useCatalogPropsStore(
		(state) => ({ supportedLanguages: state.data.supportedLanguages, language: state.data.language }),
		"shallow",
	);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onSelect = async (code: ContentLanguage) => {
		setIsLoading(true);
		const res = await FetchService.fetch(apiUrlCreator.addCatalogLanguage(code));
		if (res.ok) onChange(code);
		else setIsLoading(false);
	};

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<Icon code="plus" />
				{t("multilang.add-localization")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{Object.values(ContentLanguage)
					.filter((code) => code != language && !supportedLanguages?.includes(code))
					.map((code) => (
						<DropdownMenuItem key={code} onSelect={() => onSelect(code)}>
							{t(`language.${code}`)}
						</DropdownMenuItem>
					))}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default AddContentLanguage;
