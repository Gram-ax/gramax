import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { Icon } from "@ui-kit/Icon";

const VideoMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "video" });
	return (
		<ToolbarDropdownMenuItem
			dataQa={`qa-edit-menu-video`}
			disabled={disabled}
			active={isActive}
			onSelect={() => editor.chain().focus().setVideo().run()}
		>
			<div className="flex flex-row items-center gap-2 w-full">
				<Icon icon="video" />
				{t("editor.video.name")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default VideoMenuButton;
