import type MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import type Path from "@core/FileProvider/Path/Path";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import type FilePreviewModal from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModal";
import type { ComponentProps } from "react";

const MEDIA_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const FILE_EXTENSIONS = ["docx", "pdf"];

interface OpenPreviewOptions {
	onError: () => void;
	downloadResource: () => void;
	openInSupportedApp?: () => void;
}

export const openFilePreview = (buffer: Buffer, path: Path, options: OpenPreviewOptions) => {
	const { onError, openInSupportedApp, downloadResource } = options;
	const isFilePreview = FILE_EXTENSIONS.includes(path.extension);
	const isImagePreview = MEDIA_EXTENSIONS.includes(path.extension);

	if (!buffer?.byteLength) return onError();

	if (isImagePreview) {
		const url = URL.createObjectURL(new Blob([buffer], { type: resolveFileKind(buffer) }));
		return ModalToOpenService.setValue<ComponentProps<typeof MediaPreview>>(ModalToOpen.MediaPreview, {
			id: path.value,
			src: url,
			onClose: () => {
				URL.revokeObjectURL(url);
				ModalToOpenService.resetValue();
			},
		});
	}
	if (isFilePreview) {
		return ModalToOpenService.setValue<ComponentProps<typeof FilePreviewModal>>(ModalToOpen.FilePreview, {
			path,
			openInSupportedApp,
			onError,
			file: new File([buffer], path.nameWithExtension, { type: resolveFileKind(buffer) }),
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}

	downloadResource();
};
