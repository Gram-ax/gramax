import Code from "@components/Atoms/Code";
import t from "@ext/localization/locale/translate";

const DisableTooltipContent = ({ branch }: { branch: string }) => {
	return (
		<div>
			{t("your-branch")} <Code>{branch}</Code> {t("on-the-same-version").toLowerCase()}
		</div>
	);
};

export default DisableTooltipContent;
