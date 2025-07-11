import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import t from "@ext/localization/locale/translate";

async function createGitHubRepository(storageData: GithubStorageData) {
	const url = `https://api.github.com/${storageData.type === "User" ? "user" : `orgs/${storageData.group}`}/repos`;
	const data = { name: storageData.name, private: true };

	const response = await fetch(url, {
		method: "POST",
		headers: { Authorization: `Bearer ${storageData.source.token}`, "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorData = await response.json();
		const error = new Error(`${t("git.source.error.cannot-create-repo")}. ${errorData}`);
		error.stack = "Error info:\n" + JSON.stringify(data, null, 2) + "\n\n" + error.stack;
		throw error;
	}
}

export default createGitHubRepository;
