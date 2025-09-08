import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { useEffect, useState } from "react";
import { fetchEnterpriseWorkspaceEdit } from "./fetchEnterpriseWorkspaceEdit";
import { getEnterpriseWorkspaceEditData } from "@ext/enterprise/utils/getEnterpriseWorkspaceEditData";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";

export type EnterpriseWorkspaceEditData = {
	permitted: boolean;
	tooltip?: string;
	href?: string;
	target?: string;
};

export function useEnterpriseWorkspaceEdit(opts: {
	workspacePath: string;
	apiUrlCreator: ApiUrlCreator;
	gesUrl?: string;
}): EnterpriseWorkspaceEditData {
	const { workspacePath, apiUrlCreator, gesUrl } = opts;

	const [response, setResponse] = useState<EnterpriseAuthResult>();

	useEffect(() => {
		if (!gesUrl) {
			setResponse(EnterpriseAuthResult.Error);
			return;
		}

		void (async () => {
			try {
				const res = await fetchEnterpriseWorkspaceEdit(workspacePath, apiUrlCreator);
				setResponse(res);
			} catch (e) {
				setResponse(EnterpriseAuthResult.Error);
			}
		})();
	}, [gesUrl, workspacePath, apiUrlCreator]);

	return getEnterpriseWorkspaceEditData(response, gesUrl);
}
