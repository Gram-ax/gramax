import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";

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
		throw new Error(`Не удалось создать репозиторий. ${errorData}`);
	}
}

export default createGitHubRepository;
