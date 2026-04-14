import canShowVersion from "@core/utils/canShowVersion";
import getAppVersion from "@core/utils/getAppVersion";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import ToggleFeatures from "@ext/toggleFeatures/components/ToggleFeatures";
import { useMemo } from "react";

const BottomInfo = () => {
	const { conf, isLogged } = PageDataContextService.value;
	const cred = `© ${new Date().getFullYear()} Gramax`;
	const version = `${t("version")} ${getAppVersion(conf?.version, conf?.isRelease)}`;
	const canShow = useMemo(
		() => canShowVersion(conf?.enterprise?.gesUrl, isLogged),
		[conf?.enterprise?.gesUrl, isLogged],
	);

	return (
		<div className="bottom-info flex flex-row flex-wrap items-center justify-between gap-1 py-5">
			<ToggleFeatures />
			<div className="text-muted flex items-center gap-2 text-xs whitespace-nowrap">
				{canShow && <span className="text-muted">{version}</span>}
				<span className="text-muted">{cred}</span>
			</div>
		</div>
	);
};

export default BottomInfo;
