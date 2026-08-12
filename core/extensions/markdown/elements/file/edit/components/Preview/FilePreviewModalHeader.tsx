import type Path from "@core/FileProvider/Path/Path";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { formatBytes } from "@core-ui/utils/formatBytes";
import t from "@ext/localization/locale/translate";
import { useFilePreviewModalContext } from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModalContext";
import { IconButton } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import type { ReactElement } from "react";

const getFileTypeLabel = (path: Path) => {
	const extension = path.extension?.toUpperCase();
	return extension || t("file-preview.file");
};

const getFileIcon = (path: Path) => {
	const extension = path.extension?.toLowerCase();
	if (extension === "xls" || extension === "xlsx") return "table";
	if (["gif", "jpeg", "jpg", "png", "webp"].includes(extension)) return "image";
	return "file-text";
};

export const FilePreviewModalHeader = (): ReactElement => {
	const { closeModal, file, openInSupportedApp, path } = useFilePreviewModalContext();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isTauri } = usePlatform();
	const fileSize = file.size ? formatBytes(file.size, 1) : null;

	return (
		<header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-primary-border bg-secondary-bg px-5 py-3.5 max-[860px]:items-start max-[860px]:p-3">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border border-primary-border bg-primary-bg text-muted">
					<Icon icon={getFileIcon(path)} />
				</div>
				<div className="min-w-0">
					<h2 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold leading-tight tracking-normal">
						{path.name}
					</h2>
					<div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] leading-[1.3] text-muted">
						<span>{getFileTypeLabel(path)}</span>
						{fileSize && (
							<>
								<span className="text-muted-foreground">•</span>
								<span>{fileSize}</span>
							</>
						)}
					</div>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				{isTauri && openInSupportedApp && (
					<IconButton
						aria-label={t("open-in-supported-app").toString()}
						icon="external-link"
						onClick={openInSupportedApp}
						title={t("open-in-supported-app").toString()}
						type="button"
						variant="text"
					/>
				)}
				<IconButton
					aria-label={t("download").toString()}
					icon="download"
					onClick={() => downloadResource(apiUrlCreator, path)}
					title={t("download").toString()}
					type="button"
					variant="text"
				/>
				<IconButton
					aria-label={t("close").toString()}
					icon="x"
					onClick={closeModal}
					title={t("close").toString()}
					type="button"
					variant="text"
				/>
			</div>
		</header>
	);
};
