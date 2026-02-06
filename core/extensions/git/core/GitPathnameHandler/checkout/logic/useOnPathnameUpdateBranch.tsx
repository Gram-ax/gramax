import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import { useEffect } from "react";

const useOnPathnameUpdateBranch = () => {
	const router = useRouter();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const onUpdateBranch = (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
			if (
				caller === OnBranchUpdateCaller.MergeRequest ||
				caller === OnBranchUpdateCaller.Publish ||
				caller === OnBranchUpdateCaller.Init
			)
				return;

			const routerPath = new Path(router.path + router.hash).removeExtraSymbols;
			if (!RouterPathProvider.isEditorPathname(routerPath)) return;

			const pathnameData = RouterPathProvider.parsePath(routerPath);
			const isLocal = RouterPathProvider.isLocal(pathnameData);
			if (isLocal) return;

			const isCheckoutToNewCreatedBranch = caller === OnBranchUpdateCaller.CheckoutToNewCreatedBranch;

			const newPath = RouterPathProvider.updatePathnameData(
				pathnameData,
				isCheckoutToNewCreatedBranch
					? { refname: branch?.name }
					: { refname: branch?.name, filePath: null, itemLogicPath: null },
			).value;

			if (isCheckoutToNewCreatedBranch) {
				router.setPreventNextPushRefresh(true);
			}

			router.pushPath(newPath);
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [router.path, router.hash]);
};

export default useOnPathnameUpdateBranch;
