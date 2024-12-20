import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";
import getRenderRows from "@ext/markdown/elements/view/render/logic/getRenderRows";
import { ViewRenderGroup } from "@ext/properties/models";
import { useMemo } from "react";

const Group = ({ group, select }: { group: ViewRenderGroup; select: string[] }) => {
	const rows = useMemo(() => getRenderRows(group, select), [group, select]);
	return (
		<>
			{rows.map((row, index) => (
				<tr key={"row" + row.length + index}>
					{row.map((cell) => (
						<td
							rowSpan={cell?.rowSpan ?? 1}
							key={"cell" + (cell?.name !== undefined ? cell.name : cell?.article?.title)}
						>
							{cell?.name}
							{cell.article && (
								<Anchor href={cell.article.linkPath} resourcePath={cell.article.resourcePath}>
									{cell.article.title || t("article.no-name")}
								</Anchor>
							)}
						</td>
					))}
				</tr>
			))}
		</>
	);
};

export default Group;
