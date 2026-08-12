import type Path from "@core/FileProvider/Path/Path";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import type FilePreviewModal from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModal";
import type { ComponentProps } from "react";

const PREVIEW_EXTENSIONS = ["docx", "gif", "jpeg", "jpg", "pdf", "png", "pptx", "webp", "xls", "xlsx"];

interface OpenPreviewOptions {
	onError: () => void;
	downloadResource: () => void;
	openInSupportedApp?: () => void;
}

export const openFilePreview = (buffer: Buffer, path: Path, options: OpenPreviewOptions) => {
	const { onError, openInSupportedApp, downloadResource } = options;
	const extension = path.extension?.toLowerCase();
	const isFilePreview = Boolean(extension && PREVIEW_EXTENSIONS.includes(extension));

	if (!buffer?.byteLength) return onError();

	if (isFilePreview) {
		return ModalToOpenService.setValue<ComponentProps<typeof FilePreviewModal>>(ModalToOpen.FilePreview, {
			path,
			openInSupportedApp,
			onError,
			file: new File([buffer as BlobPart], path.nameWithExtension, { type: resolveFileKind(buffer) }),
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}

	downloadResource();
};
