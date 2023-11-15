import GitErrorProps from "@ext/git/core/GitRepository/errors/model/GitErrorProps";
import Language from "../../../../../localization/core/model/Language";
import { Caller } from "./Caller";
import GitErrorCode from "./GitErrorCode";

export type GitErrorLocalization = {
	[key in GitErrorCode]: (props: {
		lang: Language;
		caller: Caller;
		error: { data: any; message: string; props: GitErrorProps };
	}) => string;
};
