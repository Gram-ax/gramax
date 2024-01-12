import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import FileMenuButton from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import ImageMenuButton from "@ext/markdown/elements/image/edit/components/ImageMenuButton";
import VideoMenuButton from "@ext/markdown/elements/video/edit/components/VideoMenuButton";
import { Editor } from "@tiptap/core";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";

const FilesMenuGroup = ({ editor }: { editor?: Editor }) => {
	const file = ButtonStateService.useCurrentAction({ mark: "file" });
	const image = ButtonStateService.useCurrentAction({ action: "image" });
	const video = ButtonStateService.useCurrentAction({ action: "video" });

	return (
		<Tooltip
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						<FileMenuButton editor={editor} />
						<ImageMenuButton editor={editor} />
						<VideoMenuButton editor={editor} />
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<div>
				<Button
					disabled={file.disabled && image.disabled && video.disabled}
					isActive={file.isActive || image.isActive || video.isActive}
					icon="file"
				/>
			</div>
		</Tooltip>
	);
};

export default FilesMenuGroup;
