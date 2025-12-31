import t from "@ext/localization/locale/translate";
import { GitErrorLocalization } from "./model/GitErrorLocalization";

const gitErrorLocalization: GitErrorLocalization = {
	CheckoutConflictError: (props) =>
		props?.caller == "pull"
			? { message: t("git.sync.error.local-changes-present") }
			: { message: t("git.sync.error.local-changes-present") },
	DeleteCurrentBranch: () => ({ message: t("git.branch.error.deleting-head-branch") }),
	WorkingDirNotEmpty: () => ({
		message: t("git.merge.error.workdir-not-empty.body"),
		title: t("git.merge.error.workdir-not-empty.title"),
	}),
	PushRejectedError: (props) =>
		props.error?.data?.reason === "not-fast-forward"
			? {
					message: t("git.publish.error.non-fast-forward.body"),
					title: t("git.publish.error.non-fast-forward.title"),
			  }
			: { message: `${t("git.publish.error.unknown")} ${props.error.message}` },
	GitPushError: (props) => {
		if (props.caller === "deleteBranch") {
			if (props.error.props.fromMerge) {
				return {
					message: t("git.branch.error.cannot-delete-protected").replace(
						"{{branch}}",
						props.error.props.branchName,
					),
					showMessage: true,
				};
			}
			return { message: t("git.branch.error.cannot-delete").replace("{{branch}}", props.error.props.branchName) };
		}
		return { message: t("git.publish.error.protected"), showMessage: true };
	},
	CurrentBranchNotFoundError: () => ({ message: t("git.branch.error.not-found.local") }),
	RemoteRepositoryNotFoundError: (props) => {
		return {
			message: t("git.error.not-found.repo.message")
				.replace("{{url}}", props.error.props.remoteUrl)
				.replace("{{name}}", props.error.props.repositoryPath.replaceAll("/", "")),
			title: t("git.error.not-found.repo.title"),
			showMessage: false,
		};
	},
	ContentTooLargeError: (props) => ({
		message: t("git.error.content-too-large.message")
			.replace("{{url}}", props.error.props.remoteUrl)
			.replace("{{name}}", props.error.props.repositoryPath.replaceAll("/", "")),
		title: t("git.error.content-too-large.title"),
		showMessage: false,
	}),
	NotAuthorizedError: (props) => {
		if (props.caller === "pull" || props.caller === "fetch")
			return { title: t("git.error.http.title"), message: t("git.sync.error.no-permission") };
		if (props.caller === "push")
			return { title: t("git.error.http.title"), message: t("git.publish.error.no-permission") };

		return { title: t("git.error.http.title"), message: t("git.error.http.message"), showMessage: true };
	},
	MergeNotSupportedError: () => ({ message: t("git.merge.error.not-supported") }),
	MergeConflictError: () => ({ message: t("git.merge.error.conflict-occured") }),
	MergeError: () => ({ message: t("git.merge.error.generic") }),
	CantGetConflictedFiles: () => ({ message: t("git.merge.error.conflicts-not-found") }),
	AlreadyExistsError: (props) => {
		if (props.caller === "branch")
			return { message: t("git.branch.error.already-exist").replace("{{branch}}", props.error.props.branchName) };
		if (props.caller === "clone")
			return {
				message: t("git.clone.error.already-exist").replace("{{path}}", props.error?.props?.repositoryPath),
			};
	},
	HttpError: (props) => {
		const text = props.error.message ?? ("" as string);
		return { message: t("git.error.http.message"), showMessage: true, title: t("git.error.http.title") };
	},
	NotFoundError: (props) => {
		switch (props.caller) {
			case "resolveRef":
				return { message: t("git.sync.error.local-changes-present") };
			case "pull":
				if (props.error.data?.what) {
					return {
						message: t("git.error.not-found.remote-branch").replace("{{what}}", props.error.data.what),
					};
				}
			// eslint-disable-next-line no-fallthrough
			case "checkout":
				const branch: string =
					props.error?.props?.what ?? /reference '(.*)' not found/.exec(props.error.message)?.[1];
				return { message: t("git.error.not-found.branch").replace("{{what}}", branch ?? "") };
			case "branch":
				return { message: t("git.error.not-found.branch").replace("{{what}}", props.error.props.what) };
			case "readBlob":
				return { message: t("git.error.not-found.blob").replace("{{path}}", props.error.props.filePath) };
			case "clone":
				return {
					message: t("git.clone.error.branch-not-found").replace("{{branch}}", props.error.props.branchName),
				};
			default:
				return { message: `${t("git.error.not-found.generic")} ${props.error.message}` };
		}
	},
	CloneError: () => ({ message: t("git.clone.error.generic") }),
	NetworkConntectionError: () => ({ message: t("git.error.network.message"), title: t("git.error.network.title") }),
	FileNotFoundError: () => ({ message: t("not-found") }),
	CancelledOperation: (props) => ({ message: props.error.message }),
	HealthcheckFailed: (props) => ({
		title: t("git.error.broken.healthcheck.title"),
		html: true,
		message: t("git.error.broken.healthcheck.body") + ".<br>" + t("git.error.broken.healthcheck.body2"),
		showMessage: true,
	}),
};

export default gitErrorLocalization;
