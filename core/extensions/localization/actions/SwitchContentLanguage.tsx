import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import AddContentLanguage from "@ext/localization/actions/AddContentLanguage";
import ContentLanguageActions from "@ext/localization/actions/ContentLanguageActions";
import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";

const SwitchContentLanguage = ({ className }: { className?: string }) => {
	const router = useRouter();
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

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

	if (!articleProps || !props || !articleProps?.pathname || articleProps.welcome || !props.language) return null;
	if (getExecutingEnvironment() == "next" && props.supportedLanguages?.length < 2) return null;

	const switchLanguage = (code: ContentLanguage) => {
		if (isReadOnly) {
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

	return (
		<PopupMenuLayout
			hideOnClick={false}
			trigger={
				<ButtonLink
					dataQa="switch-content-language"
					iconCode="languages"
					text={t(`language.${ContentLanguage[currentLanguage]}`)}
					iconIsLoading={isLoading}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			}
		>
			<>
				{!isReadOnly && (
					<>
						<AddContentLanguage setIsLoading={setIsLoading} onChange={switchLanguage} />
						<div className="divider" />
					</>
				)}

				{Object.values(props.supportedLanguages).map((code, idx) => {
					const canSwitch = code != currentLanguage;
					const showActions = !isReadOnly && props.language != code;

					const button = (
						<ButtonLink
							key={idx}
							className={className}
							onClick={canSwitch ? () => switchLanguage(code) : undefined}
							text={t(`language.${ContentLanguage[code]}`)}
							fullWidth={props.language != code || !canSwitch}
							iconIsLoading={isLoading}
							rightActions={[
								!canSwitch ? <Icon key={0} code="check" /> : null,
								showActions ? (
									<ContentLanguageActions
										key={1}
										canSwitch={canSwitch}
										setIsLoading={setIsLoading}
										targetCode={code}
									/>
								) : null,
							]}
						/>
					);

					return canSwitch ? (
						button
					) : (
						<Tooltip hideInMobile hideOnClick content={t("multilang.current")}>
							{button}
						</Tooltip>
					);
				})}
			</>
		</PopupMenuLayout>
	);
};

export default styled(SwitchContentLanguage)`
	.right-actions {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}
`;
