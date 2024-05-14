import Code from "@components/Atoms/Code";
import useLocalize from "@ext/localization/useLocalize";

const DisableTooltipContent = ({ branch }: { branch: string }) => {
	return (
		<div>
			{useLocalize("yourBranch")} <Code>{branch}</Code> {useLocalize("onTheSameVersion").toLowerCase()}
		</div>
	);
};

export default DisableTooltipContent;
