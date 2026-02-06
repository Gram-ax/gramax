import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";
import { getEnterpriseWorkspaceEditData } from "@ext/enterprise/utils/getEnterpriseWorkspaceEditData";
import { useEffect, useState } from "react";
import { fetchEnterpriseWorkspaceEdit } from "./fetchEnterpriseWorkspaceEdit";

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
}): { editInfo: EnterpriseWorkspaceEditData; isLoading: boolean } {
	const { workspacePath, apiUrlCreator, gesUrl } = opts;

	const [response, setResponse] = useState<EnterpriseAuthResult>();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!gesUrl) {
			setResponse(EnterpriseAuthResult.Error);
			return;
		}

		void (async () => {
			try {
				setIsLoading(true);
				const res = await fetchEnterpriseWorkspaceEdit(workspacePath, apiUrlCreator);
				setResponse(res);
			} catch (e) {
				setResponse(EnterpriseAuthResult.Error);
			} finally {
				setIsLoading(false);
			}
		})();
	}, [gesUrl, workspacePath, apiUrlCreator]);

	return { editInfo: getEnterpriseWorkspaceEditData(response, gesUrl), isLoading };
}
