import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import { useEffect } from "react";

const useOnPathnameUpdateBranch = () => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;

	useEffect(() => {
		const onUpdateBranch = (branch: GitBranchData, caller: OnBranchUpdateCaller) => {
			if (caller === OnBranchUpdateCaller.MergeRequest) return;

			const routerPath = new Path(router.path + router.hash).removeExtraSymbols;
			if (isReadOnly || !RouterPathProvider.isEditorPathname(routerPath)) return;

			const fromInit = caller === OnBranchUpdateCaller.Init;
			const pathnameData = RouterPathProvider.parsePath(routerPath);
			const isLocal = RouterPathProvider.isLocal(pathnameData);
			if (isLocal) return;

			const newPath = RouterPathProvider.updatePathnameData(
				pathnameData,
				fromInit ? { refname: branch?.name } : { refname: branch?.name, filePath: null, itemLogicPath: null },
			).value;

			router.pushPath(newPath);
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, [router.path]);
};

export default useOnPathnameUpdateBranch;
