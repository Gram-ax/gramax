import Anchor from "@components/controls/Anchor";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import getRenderRows from "@ext/markdown/elements/view/render/logic/getRenderRows";
import { Property, ViewRenderGroup } from "@ext/properties/models";
import { useMemo } from "react";

const Wrapper = ({
	children,
	basePath,
	catalogName,
	itemPath,
}: {
	children: JSX.Element;
	basePath: string;
	catalogName: string;
	itemPath: string;
}) => {
	if (!itemPath) return children;
	const apiUrlCreator = new ApiUrlCreator(basePath, catalogName, itemPath);

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator}>
			<ResourceService.Provider>{children}</ResourceService.Provider>
		</ApiUrlCreatorService.Provider>
	);
};

const Group = ({
	group,
	select,
	catalogName,
	catalogProperties,
}: {
	group: ViewRenderGroup;
	select: string[];
	catalogName: string;
	catalogProperties: Map<string, Property>;
}) => {
	const router = useRouter();
	const rows = useMemo(() => getRenderRows(group, select, catalogProperties), [group, select, catalogProperties]);

	return (
		<>
			{rows.map((row, index) => (
				<tr key={"row-" + row.length + index}>
					{row.map((cell, cellIndex) => {
						return (
							<Wrapper
								basePath={router.basePath}
								catalogName={catalogName}
								itemPath={cell?.itemPath}
								key={
									"cell-" +
									(cell?.name !== undefined ? cell.name : cell?.article?.title) +
									"-" +
									cellIndex
								}
							>
								<td rowSpan={cell?.rowSpan ?? 1} style={{ width: cell?.width }}>
									{cell?.name}
									{cell.article && (
										<Anchor href={cell.article.linkPath} resourcePath={cell.article.resourcePath}>
											{cell.article.title || t("article.no-name")}
										</Anchor>
									)}
								</td>
							</Wrapper>
						);
					})}
				</tr>
			))}
		</>
	);
};

export default Group;
