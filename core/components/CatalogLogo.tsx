import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import IconComponent from "@ext/markdown/elements/icon/render/components/Icon";
import { useState } from "react";

export const ActionLogo = () => {
	const [isError, setIsError] = useState(false);
	const logoData = PageDataContextService.value.conf.logo;
	const url = logoData.linkUrl;
	const imageSrc = logoData?.imageUrl;
	const title = logoData?.linkTitle ?? (url !== "/" ? `${t("go-to")} ${url}` : null);

	if (isError) return null;
	return (
		<img
			onClick={() => {
				window.location.href = url;
			}}
			onError={() => setIsError(true)}
			src={imageSrc}
			title={title}
		/>
	);
};

export const CatalogLogo = ({ catalogName }: { catalogName?: string }) => {
	const { logo } = CatalogLogoService.value();
	const { isStaticCli } = usePlatform();
	if (isStaticCli) return null;

	if (!logo) return null;
	if ("iconCode" in logo)
		return (
			<IconComponent
				className="w-[1.625rem] box-content shrink-0"
				code={logo.iconCode as IconCode}
				color={logo.iconColor}
				data-testid="catalog-logo-icon"
			/>
		);
	if ("emoji" in logo)
		return (
			<span className="text-xl leading-none shrink-0 pr-[10px]" data-testid="catalog-logo-emoji">
				{logo.emoji}
			</span>
		);
	return <img alt={catalogName} data-testid="catalog-logo-image" src={logo.src} />;
};
