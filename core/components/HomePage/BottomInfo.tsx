import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import localUserInfo from "@ext/security/logic/User/localUserInfo";
import ToggleFeatures from "@ext/toggleFeatures/components/ToggleFeatures";

const BottomInfo = () => {
	const { conf, isLogged, userInfo } = PageDataContextService.value;
	const cred = `© ${new Date().getFullYear()} Gramax`;
	const ver = `${t("version")} ${conf?.version} ${conf?.isRelease ? "" : "dev"}`.trim();
	const isAdmin = userInfo?.mail === localUserInfo?.mail;

	return (
		<div className="bottom-info flex flex-row flex-wrap items-center justify-between gap-1 py-5">
			<ToggleFeatures />
			<div className="text-muted flex items-center gap-2 text-xs whitespace-nowrap">
				{(!conf?.enterprise?.gesUrl || (isLogged && !isAdmin)) && <span className="text-muted">{ver}</span>}
				<span className="text-muted">{cred}</span>
			</div>
		</div>
	);
};

export default BottomInfo;
