import { useDismissableToast } from "@components/Atoms/DismissableToast";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { useDownloadAsZip } from "@core-ui/hooks/useDownloadAsZip";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Loader } from "@ui-kit/Loader";

const DownloadZip = () => {
	const platform = usePlatform();

	const { dismiss, show } = useDismissableToast({
		title: t("export.zip.process"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const { download, isDownloading } = useDownloadAsZip({ onStart: show, onFinally: () => dismiss.current?.() });

	if (!platform.isBrowser && !platform.isTauri) return null;

	return (
		<DropdownMenuItem onSelect={download}>
			{isDownloading ? (
				<>
					<SpinnerLoader height={14} width={14} />
					{t("loading")}
				</>
			) : (
				<>
					<Icon code="file-archive" />
					{t("export.zip.catalog")}
				</>
			)}
		</DropdownMenuItem>
	);
};

export default DownloadZip;
