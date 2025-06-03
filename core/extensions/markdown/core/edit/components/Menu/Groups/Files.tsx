import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import FileMenuButton from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import ImageMenuButton from "@ext/markdown/elements/image/edit/components/ImageMenuButton";
import VideoMenuButton from "@ext/markdown/elements/video/edit/components/VideoMenuButton";
import { Editor } from "@tiptap/core";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import IconMenuButton from "@ext/markdown/elements/icon/edit/components/IconMenuButton";
import Tooltip from "@components/Atoms/Tooltip";
import { useState } from "react";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";

interface FilesMenuGroupProps {
	editor?: Editor;
	fileName?: string;
	isSmallEditor?: boolean;
}

const FilesMenuGroup = ({ editor, fileName, isSmallEditor }: FilesMenuGroupProps) => {
	const file = ButtonStateService.useCurrentAction({ mark: "file" });
	const image = ButtonStateService.useCurrentAction({ action: "image" });
	const video = ButtonStateService.useCurrentAction({ action: "video" });
	const icon = ButtonStateService.useCurrentAction({ action: "icon" });

	const syntax = CatalogPropsService.value.syntax;
	const supportedElements = getFormatterType(syntax).supportedElements;

	const isVideoSupported = supportedElements.includes("video");
	const isIconSupported = supportedElements.includes("icon");

	const disabled = file.disabled && image.disabled && video.disabled && icon.disabled;
	const isActive = file.isActive || image.isActive || video.isActive || icon.isActive;

	const [isOpen, setIsOpen] = useState(false);

	return (
		<Tooltip
			onAfterUpdate={(instance) => {
				if (!isOpen) instance.hide();
			}}
			onShow={() => setIsOpen(true)}
			onHide={() => setIsOpen(false)}
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						{!isSmallEditor && <FileMenuButton editor={editor} />}
						<ImageMenuButton editor={editor} fileName={fileName} />
						{isVideoSupported && <VideoMenuButton editor={editor} />}
						{isIconSupported && <IconMenuButton editor={editor} onClose={() => setIsOpen(false)} />}
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<div>
				<Button disabled={disabled} isActive={isActive} icon="file-video" />
			</div>
		</Tooltip>
	);
};

export default FilesMenuGroup;
