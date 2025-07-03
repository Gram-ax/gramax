import t from "@ext/localization/locale/translate";
import EditStyles from "@ext/workspace/components/EditStyles";
import LogoUploader, { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { Button } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { memo, useMemo } from "react";

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

	const defaultLightFileInfo = useMemo(() => {
		if (!lightLogo) return;

		return { name: "logo_for_light.svg", url: lightLogo };
	}, [lightLogo, isLoadingLight]);

	const defaultDarkFileInfo = useMemo(() => {
		if (!darkLogo) return;

		return { name: "logo_for_dark.svg", url: darkLogo };
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
				name="darkLogo"
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

			<FormField
				name="cssStyles"
				title={t("workspace.css-style")}
				description={t("workspace.css-styles-description")}
				control={() => (
					<EditStyles revertCustomCss={revertCustomCss} setCustomCss={setCustomCss} customCss={customCss}>
						<Button startIcon="palette" type="button" variant="outline" style={{ width: "100%" }}>
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
