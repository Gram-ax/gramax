import type GitErrorProps from "@ext/git/core/GitCommands/errors/model/GitErrorProps";
import type { Caller } from "./Caller";
import type GitErrorCode from "./GitErrorCode";

export type GitErrorLocalization = {
	[key in GitErrorCode]: (props: { caller: Caller; error: { data: any; message: string; props: GitErrorProps } }) => {
		message: string;
		title?: string;
		showMessage?: boolean;
	};
};
