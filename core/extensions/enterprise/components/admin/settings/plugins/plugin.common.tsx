import { Icon } from "@ui-kit/Icon";

export const SidePluginIcon = ({ disabled }: { disabled: boolean }) => {
	return <Icon icon={disabled ? "unplug" : "plug-zap"} />;
};
