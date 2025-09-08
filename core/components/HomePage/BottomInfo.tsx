import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import ToggleFeatures from "@ext/toggleFeatures/components/ToggleFeatures";

const BottomInfo = () => {
	const config = PageDataContextService.value.conf;

	const cred = `© ${new Date().getFullYear()} Gramax`;
	const ver = `${t("version")} ${config.version} ${config.isRelease ? "" : "dev"}`.trim();

	return (
		<div className="w-full mx-auto flex max-w-[1144px] flex-row flex-wrap items-center justify-between gap-4 py-5">
			<ToggleFeatures />
			<div className="text-muted flex items-center gap-2 text-xs">
				<span>{ver}</span>
				<span>{cred}</span>
			</div>
		</div>
	);
};

export default BottomInfo;
