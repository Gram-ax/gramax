import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import ThemeService from "@ext/Theme/components/ThemeService";
import { useState } from "react";

const ActionLogo = ({ setIsError }) => {
	const logoData = PageDataContextService.value.conf.logo;
	const imageSrc = logoData?.imageUrl;
	const url = logoData.linkUrl;
	const title = logoData?.linkTitle ?? (url !== "/" ? `${t("go-to")} ${url}` : null);

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
	const useImage = resolveModule("useImage");
	const [isError, setIsError] = useState(false);
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const imageSrc = useImage(apiUrlCreator.getLogoUrl(catalogName, theme));
	if (isError || !imageSrc) return null;

	if (PageDataContextService.value.conf.logo.imageUrl) return <ActionLogo setIsError={setIsError} />;

	return <img src={imageSrc} onError={() => setIsError(true)} alt={catalogName} />;
};
