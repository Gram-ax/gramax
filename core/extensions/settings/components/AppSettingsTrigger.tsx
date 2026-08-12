import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { Level } from "@ext/settings/logic/settings";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { ComponentProps } from "react";
import type AppSettingsEditor from "./AppSettingsEditor";

type Props = {
	defaultLevel?: Level;
};

const open = (defaultLevel: Level) => {
	ModalToOpenService.setValue<ComponentProps<typeof AppSettingsEditor>>(ModalToOpen.AppSettings, {
		defaultLevel,
		onClose: () => ModalToOpenService.resetValue(),
	});
};

export const openAppSettings = open;

const AppSettingsTrigger = ({ defaultLevel = Level.app }: Props) => {
	return (
		<Tooltip>
			<TooltipContent>
				<p>{t("app-settings.title")}</p>
			</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className="p-2"
					icon="settings"
					iconClassName="w-5 h-5 stroke-[1.6]"
					onClick={() => open(defaultLevel)}
					size="lg"
					variant="ghost"
				/>
			</TooltipTrigger>
		</Tooltip>
	);
};

export default AppSettingsTrigger;
