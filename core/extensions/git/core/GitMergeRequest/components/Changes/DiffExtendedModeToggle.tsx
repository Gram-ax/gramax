import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Switch } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useDiffExtendedMode, useSetDiffExtendedMode } from "./stores/DiffExtendedModeStore";

const DiffExtendedModeToggle = () => {
	const extendedMode = useDiffExtendedMode();
	const setDiffExtendedMode = useSetDiffExtendedMode();

	return (
		<DropdownMenuItem
			onClick={(ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				setDiffExtendedMode(!extendedMode);
			}}
		>
			<div className="flex items-center justify-between w-full gap-4">
				<div className="flex items-center gap-1">
					<Icon icon="file-diff" />
					{t("git.merge-requests.advanced-mode")}
					<Tooltip>
						<TooltipTrigger>
							<Icon icon="circle-help" />
						</TooltipTrigger>
						<TooltipContent>{t("git.merge-requests.advanced-mode-description")}</TooltipContent>
					</Tooltip>
				</div>
				<Switch
					checked={extendedMode}
					onChange={(ev) => {
						ev.preventDefault();
						ev.stopPropagation();
					}}
					onCheckedChange={(toggled) => setDiffExtendedMode(toggled)}
					size="sm"
				/>
			</div>
		</DropdownMenuItem>
	);
};

export default DiffExtendedModeToggle;
