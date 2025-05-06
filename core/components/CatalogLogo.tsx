import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
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
			src={imageSrc}
			onError={() => setIsError(true)}
			title={title}
			onClick={() => {
				window.location.href = url;
			}}
		/>
	);
};

export const CatalogLogo = ({ catalogName }: { catalogName?: string }) => {
	const { logo } = CatalogLogoService.value();
	const { isStaticCli } = usePlatform();
	if (!logo || isStaticCli) return null;

	return <img src={logo} alt={catalogName} />;
};
