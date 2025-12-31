import Button from "@ext/markdown/core/edit/components/Menu/Button";
import MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import FilePreviewModal from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModal";
import { ComponentProps } from "react";

const Anchor = styled.a`
	color: var(--color-article-bg) !important;
	width: 100% !important;
	text-decoration: none !important;
`;

const MEDIA_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const FILE_EXTENSIONS = ["docx", "pdf"];

interface NameProps {
	path: Path;
	openInSupportedApp: () => void;
	downloadResource: () => void;
	onError: () => void;
}

const StyledButton = styled(Button)`
	.button .iconFrame {
		padding: 4.5px 7px;
		display: flex;
	}

	.button .iconFrame span {
		white-space: nowrap;
		overflow: hidden;
		line-height: 1.2;
		text-overflow: ellipsis;
	}

	.button .iconFrame i {
		align-items: flex-start;
		justify-content: center;
		display: flex;
	}
`;

const Name = ({ path, downloadResource, onError, openInSupportedApp }: NameProps) => {
	const isFilePreview = FILE_EXTENSIONS.includes(path.extension);
	const isImagePreview = MEDIA_EXTENSIONS.includes(path.extension);

	const resourceService = ResourceService.value;
	const openPreview = async () => {
		const buffer = await resourceService.getResource(path.value);
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
		} else if (isFilePreview) {
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

	return (
		<Anchor onClick={openPreview}>
			<StyledButton icon={"file"} title={path.nameWithExtension} text={path.nameWithExtension} />
		</Anchor>
	);
};

export default Name;
