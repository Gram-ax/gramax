import SourceType from "../SourceDataProvider/model/SourceType";

const getAccessTokenDocs = (type: SourceType): string => {
	if (type === SourceType.gitHub) {
		return "https://docs.github.com/en/enterprise-server@3.6/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens";
	}
	if (type === SourceType.gitLab) {
		return "https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html";
	}
};

export default getAccessTokenDocs;
