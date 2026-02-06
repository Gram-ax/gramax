import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";

const VideoMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "video" });
	return (
		<ToolbarDropdownMenuItem
			active={isActive}
			dataQa={`qa-edit-menu-video`}
			disabled={disabled}
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
