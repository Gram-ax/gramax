import UserJSONData from "@ext/security/logic/User/UserJSONData";

interface EnterpriseUserJSONData extends UserJSONData {
	token: string;
	gesUrl: string;
}

export default EnterpriseUserJSONData;
