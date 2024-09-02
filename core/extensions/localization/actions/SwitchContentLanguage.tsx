import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import AddContentLanguage from "@ext/localization/actions/AddContentLanguage";
import RemoveContentLanguage from "@ext/localization/actions/RemoveContentLanguage";
import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";

const SwitchContentLanguage = () => {
	const router = useRouter();
	const isServerApp = PageDataContextService.value.conf.isServerApp;

	const articleProps = ArticlePropsService.value;
	const props = CatalogPropsService.value;
	const currentLanguage = PageDataContextService.value.language.content || props?.language;

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isLoading) setIsLoading(false);
	}, [currentLanguage]);

	useEffect(() => {
		if (!props || !articleProps) return;
		if (props.language && !props.supportedLanguages.includes(currentLanguage)) switchLanguage(props.language);
	}, []);

	if (!articleProps || !articleProps?.pathname) return null;

	const switchLanguage = (code: ContentLanguage) => {
		if (isServerApp) {
			router.pushPath(
				Localizer.addPath({
					current: currentLanguage,
					logicPath: articleProps.logicPath,
					target: code,
					primaryLanguage: props.language,
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
				primaryLanguage: props.language,
			}),
		);
	};

	if (!props.language)
		return (
			<Tooltip content={t("multilang.error.no-selected-language")}>
				<ButtonLink disabled iconCode="languages" text={t("language.name")} />
			</Tooltip>
		);

	return (
		<PopupMenuLayout
			trigger={
				<ButtonLink
					iconCode="languages"
					text={t(`language.${ContentLanguage[currentLanguage]}`)}
					iconIsLoading={isLoading}
				/>
			}
		>
			<>
				{!isServerApp && (
					<>
						<AddContentLanguage setIsLoading={setIsLoading} onChange={switchLanguage} />
						<div className="divider" />
					</>
				)}

				{Object.values(props.supportedLanguages).map((code, idx) => (
					<ButtonLink
						key={idx}
						disabled={code == currentLanguage}
						onClick={() => switchLanguage(code)}
						text={t(`language.${ContentLanguage[code]}`)}
						fullWidth={props.language != code}
						rightActions={
							!isServerApp &&
							props.language != code && [
								<RemoveContentLanguage
									key={0}
									setIsLoading={setIsLoading}
									disabled={code == currentLanguage}
									targetCode={code}
								/>,
							]
						}
					/>
				))}
			</>
		</PopupMenuLayout>
	);
};

export default SwitchContentLanguage;