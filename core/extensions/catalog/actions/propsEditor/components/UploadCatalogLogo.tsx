import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import { FormProps } from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import { FormItemTitle, FormField } from "@ui-kit/Form";
import LogoUploader from "@ext/workspace/components/LogoUploader";

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

	return (
		<>
			<FormField
				name="lightLogo"
				title={t("workspace.logo")}
				description={t("workspace.default-logo-description")}
				control={({ field }) => (
					<LogoUploader
						deleteResource={deleteLightLogo}
						updateResource={updateLightLogo}
						logo={lightLogo}
						isLoading={isLoadingLight}
						imageTheme={Theme.light}
					/>
				)}
				{...formProps}
			/>

			<FormField
				name="darkLogo"
				title=""
				description={t("workspace.dark-logo-description")}
				control={({ field }) => (
					<>
						<FormItemTitle as={"h4"} children={t("workspace.for-dark-theme")} />
						<LogoUploader
							deleteResource={deleteDarkLogo}
							updateResource={updateDarkLogo}
							logo={darkLogo}
							isLoading={isLoadingDark}
							imageTheme={Theme.dark}
						/>
					</>
				)}
				{...formProps}
			/>
		</>
	);
};

export default UploadCatalogLogo;
