import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";
import Property from "@ext/properties/components/Property";
import getRenderRows from "@ext/markdown/elements/view/render/logic/getRenderRows";
import { Property as PropertyType, ViewRenderGroup } from "@ext/properties/models";
import React from "react";

const Group = ({ group }: { group: ViewRenderGroup }) => {
	const rows = getRenderRows(group);
	return (
		<>
			{rows.map((row, index) => (
				<tr key={"row" + row.length + index}>
					{row.map((cell) => (
						<td rowSpan={cell?.rowSpan ?? 1} key={"cell" + (cell?.name ?? cell?.article.title)}>
							{cell?.name}
							{cell.article && (
								<div>
									<Anchor href={cell.article.linkPath} resourcePath={cell.article.resourcePath}>
										{cell.article.title || t("article.no-name")}
									</Anchor>
									<div className="chips">
										{cell.article.otherProps.map((property: PropertyType) => (
											<Property
												key={property.name}
												type={property.type}
												value={property.value ? property.value : property.name}
												name={property.name}
												propertyStyle={property.style}
											/>
										))}
									</div>
								</div>
							)}
						</td>
					))}
				</tr>
			))}
		</>
	);
};

export default Group;
