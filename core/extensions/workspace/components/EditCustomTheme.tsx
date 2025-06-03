import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import EditStyles from "@ext/workspace/components/EditStyles";
import LogoUploader, { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { Button } from "@ui-kit/Button";
import { FormField, FormItemTitle } from "@ui-kit/Form";
import { memo } from "react";

interface EditWorkspaceAssetsProps {
	lightLogo?: string;
	darkLogo?: string;
	deleteLightLogo?: () => void;
	deleteDarkLogo?: () => void;
	updateLightLogo?: UpdateResource;
	revertCustomCss?: () => void;
	updateDarkLogo?: UpdateResource;
	customCss?: string;
	setCustomCss?: (css: string) => void;
	isLoadingDark?: boolean;
	isLoadingLight?: boolean;
	formProps: Record<string, string>;
}

const EditWorkspaceAssets = memo((props: EditWorkspaceAssetsProps) => {
	const {
		deleteLightLogo,
		deleteDarkLogo,
		updateLightLogo,
		revertCustomCss,
		updateDarkLogo,
		lightLogo,
		darkLogo,
		setCustomCss,
		customCss,
		isLoadingDark,
		isLoadingLight,
		formProps,
	} = props;

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

			<FormField
				name="cssStyles"
				title={t("workspace.css-style")}
				description={t("workspace.css-styles-description")}
				control={({ field }) => (
					<EditStyles revertCustomCss={revertCustomCss} setCustomCss={setCustomCss} customCss={customCss}>
						<Button startIcon="palette" type="button" variant="primary" style={{ width: "100%" }}>
							{t("edit2")}
						</Button>
					</EditStyles>
				)}
				{...formProps}
			/>
		</>
	);
});

export default EditWorkspaceAssets;
