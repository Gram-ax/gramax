import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { getEnterpriseWorkspaceEditData } from "@ext/enterprise/components/SingInOut/utils/getEnterpriseWorkspaceEditData";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";
import { useEffect, useState } from "react";
import { fetchEnterpriseWorkspaceEdit } from "../components/SingInOut/utils/fetchEnterpriseWorkspaceEdit";

export type EnterpriseWorkspaceEditData = {
	permitted: boolean;
	tooltip?: string;
	href?: string;
	target?: string;
	loading?: boolean;
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
				setResponse(EnterpriseAuthResult.Loading);
				const res = await fetchEnterpriseWorkspaceEdit(workspacePath, apiUrlCreator);
				setResponse(res);
			} catch {
				setResponse(EnterpriseAuthResult.Error);
			}
		})();
	}, [gesUrl, workspacePath, apiUrlCreator]);

	return getEnterpriseWorkspaceEditData(response, gesUrl);
}
