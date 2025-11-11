import ButtonLink from "@components/Molecules/ButtonLink";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import AddContentLanguage from "@ext/localization/actions/AddContentLanguage";
import ContentLanguageActions from "@ext/localization/actions/ContentLanguageActions";
import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@ui-kit/Dropdown";
import { useEffect, useState } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const SwitchContentLanguage = () => {
	const router = useRouter();
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	const articleProps = ArticlePropsService.value;
	const { language, supportedLanguages } = useCatalogPropsStore(
		(state) => ({ language: state.data?.language, supportedLanguages: state.data?.supportedLanguages }),
		"shallow",
	);
	const currentLanguage = PageDataContextService.value.language.content || language;

	const [isLoading, setIsLoading] = useState(false);
	const { isNext } = usePlatform();

	useEffect(() => {
		if (isLoading) setIsLoading(false);
	}, [currentLanguage]);

	useEffect(() => {
		if (!language || !articleProps) return;
		if (language && !supportedLanguages.includes(currentLanguage)) switchLanguage(language);
	}, [language, supportedLanguages, articleProps]);

	if (!articleProps || !language || !articleProps?.pathname || articleProps.welcome || !language) return null;
	if (isNext && supportedLanguages?.length < 2) return null;

	const switchLanguage = (code: ContentLanguage) => {
		if (code == currentLanguage) return;

		if (isReadOnly) {
			router.pushPath(
				Localizer.addPath({
					current: currentLanguage,
					logicPath: articleProps.logicPath,
					target: code,
					primaryLanguage: language,
				}),
			);
			return;
		}

		router.pushPath(
			Localizer.addPathname({
				current: currentLanguage,
				logicPath: articleProps.logicPath,
				pathname: articleProps.pathname,
				target: code,
				primaryLanguage: language,
			}),
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					iconCode="languages"
					text={t(`language.${ContentLanguage[currentLanguage]}`)}
					dataQa="switch-content-language"
					iconIsLoading={isLoading}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{!isReadOnly && (
					<>
						<AddContentLanguage setIsLoading={setIsLoading} onChange={switchLanguage} />
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuRadioGroup
					value={currentLanguage}
					onValueChange={switchLanguage}
					indicatorIconPosition="start"
				>
					{Object.values(supportedLanguages).map((code) => {
						const showActions = !isReadOnly && language != code;

						return (
							<DropdownMenuRadioItem key={code} value={code}>
								<div className="flex items-center justify-between w-full">
									{t(`language.${ContentLanguage[code]}`)}
									{showActions && (
										<ContentLanguageActions
											canSwitch={code != currentLanguage}
											setIsLoading={setIsLoading}
											targetCode={code}
										/>
									)}
								</div>
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchContentLanguage;
