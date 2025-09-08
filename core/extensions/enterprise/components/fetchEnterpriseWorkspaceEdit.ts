import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";

export type CheckEditWorkspaceResponse =
	| { kind: "allowed"; href: string; target: "_self" | "_blank" }
	| { kind: "denied"; reason: "unauthorized" | "forbidden" | "not_enterprise" | "missing_token" | "unknown" };

export async function fetchEnterpriseWorkspaceEdit(
	workspacePath: string,
	apiUrlCreator: ApiUrlCreator,
): Promise<EnterpriseAuthResult> {
	try {
		const res = await FetchService.fetch(apiUrlCreator.getCheckEditEnterpriseWorkspaceUrl(workspacePath));
		const json = res.ok ? await res.json() : null;
		return (json?.status as EnterpriseAuthResult) ?? EnterpriseAuthResult.Error;
	} catch {
		return EnterpriseAuthResult.Error;
	}
}
