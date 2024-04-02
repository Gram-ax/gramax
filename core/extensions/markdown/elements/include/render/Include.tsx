import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";

export default function Include({ path, children }: { path: string; children: JSX.Element }) {
	const apiUrlCreator = ApiUrlCreatorService.value;
	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator?.fromNewArticlePath(path)}>
			{children ?? null}
		</ApiUrlCreatorService.Provider>
	);
}
