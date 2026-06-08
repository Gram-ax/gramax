import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import AddContentLanguage from "@ext/localization/actions/AddContentLanguage";
import ContentLanguageActions from "@ext/localization/actions/ContentLanguageActions";
import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { useSetShowPreviewArticle, useShowPreviewArticle } from "@ext/localization/core/stores/LocalizationStore";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Switch } from "@ui-kit/Switch";
import { useCallback, useEffect, useState } from "react";

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

	const showPreviewArticle = useShowPreviewArticle();
	const setShowPreviewArticle = useSetShowPreviewArticle();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (isLoading) setIsLoading(false);
	}, [currentLanguage]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!language || !articleProps) return;
		if (language && !supportedLanguages.includes(currentLanguage)) switchLanguage(language);
	}, [language, supportedLanguages, articleProps]);

	const switchLanguage = useCallback(
		(code: ContentLanguage) => {
			if (code === currentLanguage) return;

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
		},
		[currentLanguage, isReadOnly, language, router, articleProps],
	);

	const onSwitchPreviewArticle = useCallback(
		(event: Event) => {
			if (typeof window === "undefined") return;
			event.preventDefault();

			setShowPreviewArticle(!showPreviewArticle);
		},
		[setShowPreviewArticle, showPreviewArticle],
	);

	if (!articleProps || !language || !articleProps?.pathname || articleProps.welcome || !language) return null;
	if (isNext && supportedLanguages?.length < 2) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					dataQa="switch-content-language"
					iconCode="languages"
					iconIsLoading={isLoading}
					text={t(`language.${ContentLanguage[currentLanguage]}`)}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{!isReadOnly && (
					<>
						<AddContentLanguage onChange={switchLanguage} setIsLoading={setIsLoading} />
						<DropdownMenuItem onSelect={onSwitchPreviewArticle}>
							<Icon icon="columns-2" />
							{t("multilang.preview-article")}
							<Switch checked={showPreviewArticle} className="pointer-events-none" size="sm" />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuRadioGroup
					indicatorIconPosition="start"
					onValueChange={switchLanguage}
					value={currentLanguage}
				>
					{Object.values(supportedLanguages).map((code) => {
						const showActions = !isReadOnly && language !== code;

						return (
							<DropdownMenuRadioItem key={code} value={code}>
								<div className="flex items-center justify-between w-full">
									{t(`language.${ContentLanguage[code]}`)}
									{showActions && (
										<ContentLanguageActions
											canSwitch={code !== currentLanguage}
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
