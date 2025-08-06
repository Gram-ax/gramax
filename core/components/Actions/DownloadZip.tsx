import { useDismissableToast } from "@components/Atoms/DismissableToast";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import { Loader } from "ics-ui-kit/components/loader";
import { useState } from "react";

const DownloadZip = () => {
	const catalogProps = CatalogPropsService.value;
	const [isDownloading, setIsDownloading] = useState(false);
	const platform = usePlatform();

	const { dismiss, show } = useDismissableToast({
		title: t("export.zip.process"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	if (!platform.isBrowser && !platform.isTauri) return null;

	return (
		<ButtonLink
			iconCode="file-archive"
			text={t("export.zip.catalog")}
			onClick={async () => {
				setIsDownloading(true);
				show();
				try {
					await window.debug.zip(catalogProps.name);
				} finally {
					setIsDownloading(false);
					dismiss.current?.();
				}
			}}
			iconIsLoading={isDownloading}
		/>
	);
};

export default DownloadZip;
