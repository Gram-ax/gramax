import GitStorageData from "../../../../core/model/GitStorageData";

async function createGitHubRepository(storageData: GitStorageData) {
	const url = `https://api.github.com/user/repos`;
	const data = { name: storageData.name, private: true };

	const response = await fetch(url, {
		method: "POST",
		headers: { Authorization: `Bearer ${storageData.source.token}`, "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorData = await response.json();
		new Error(`Не удалось создать репозиторий. ${errorData}`);
	}
}

export default createGitHubRepository;
