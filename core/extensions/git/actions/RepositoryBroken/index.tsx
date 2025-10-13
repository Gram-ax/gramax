import { RepositoryHealthcheckFailed } from "@ext/git/actions/RepositoryBroken/RepositoryHealthcheckFailed";
import { RepositoryNotFullyCloned } from "@ext/git/actions/RepositoryBroken/RepositoryNotFullyCloned";

export type RepositoryBrokenProps = {
	trigger: JSX.Element;
	error: Error;
};

const CLONE_ERROR_MARKER = `"cmd": "clone"`;

const RepositoryBroken = ({ trigger, error }: RepositoryBrokenProps) => {
	if (!error) return null;

	if (error.message?.includes(CLONE_ERROR_MARKER))
		return <RepositoryNotFullyCloned trigger={trigger} error={error} />;

	return <RepositoryHealthcheckFailed trigger={trigger} error={error} />;
};

export default RepositoryBroken;
