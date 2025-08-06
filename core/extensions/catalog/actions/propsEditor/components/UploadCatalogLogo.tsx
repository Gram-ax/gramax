import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import LogoUploader from "@ext/workspace/components/LogoUploader";
import { FormField } from "@ui-kit/Form";
import { useMemo } from "react";
import type { FormProps } from "../logic/createFormSchema";

const UploadCatalogLogo = ({ formProps }: { formProps: FormProps }) => {
	const {
		deleteLightLogo,
		deleteDarkLogo,
		isLoadingDark,
		isLoadingLight,
		lightLogo,
		darkLogo,
		updateLightLogo,
		updateDarkLogo,
		refreshState,
	} = CatalogLogoService.value();

	useWatchClient(() => {
		void refreshState();
	}, []);

	const defaultLightFileInfo = useMemo(() => {
		if (!lightLogo) return;

		return { name: "logo_light.svg", url: lightLogo };
	}, [isLoadingLight, lightLogo]);

	const defaultDarkFileInfo = useMemo(() => {
		if (!darkLogo) return;

		return { name: "logo_dark.svg", url: darkLogo };
	}, [isLoadingDark, darkLogo]);

	return (
		<>
			<FormField
				name="lightLogo"
				title={t("file-input.logo-light")}
				description={t("file-input.both-themes-if-no-dark")}
				control={() => (
					<LogoUploader
						deleteResource={deleteLightLogo}
						updateResource={updateLightLogo}
						defaultFileInfo={defaultLightFileInfo}
					/>
				)}
				{...formProps}
			/>
			<FormField
				name={"darkLogo"}
				title={t("file-input.logo-dark")}
				description={t("file-input.dark-theme-only")}
				control={() => (
					<LogoUploader
						deleteResource={deleteDarkLogo}
						updateResource={updateDarkLogo}
						defaultFileInfo={defaultDarkFileInfo}
					/>
				)}
				{...formProps}
			/>
		</>
	);
};

export default UploadCatalogLogo;
