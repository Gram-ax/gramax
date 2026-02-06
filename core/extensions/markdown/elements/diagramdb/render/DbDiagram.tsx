import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { useEffect, useState } from "react";
import Popup from "reactjs-popup";
import { Table } from "../../../../../logic/components/tableDB/table";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import TableDB from "../../tabledb/render/DbTable";

export interface DbDiagramData {
	tables: {
		title: string;
		fields: string[];
		table: Table;
	}[];
	links: {
		link: string;
		table1Name: string;
		table2Name: string;
	}[];
	width: number;
	height: number;
	message?: string;
	stack?: string;
}

const DbDiagram = styled(
	({ src, className, tags, primary }: { src: string; className?: string; tags: string; primary?: string }) => {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [data, setData] = useState<DbDiagramData>(null);
		const [error, setError] = useState(null);
		const [popup, setPopup] = useState(null);
		const [hover, setHover] = useState(null);
		const [focus, setFocus] = useState(false);

		const load = async (src: string, tags: string, primary?: string) => {
			const url = apiUrlCreator.getDbDiagramUrl(src, primary, tags);
			const res = await FetchService.fetch<DbDiagramData>(url, null, MimeTypes.text, Method.POST, false);
			if (res.ok) setData(await res.json());
			else setError(await res.json());
		};

		useEffect(() => {
			load(src, tags, primary);
		}, [src, tags, primary]);

		if (error || (data && !data?.tables)) return <DiagramError diagramName="Db-Diagram" error={error ?? data} />;

		return !data ? (
			<div contentEditable={false} data-type="dbdiagram" />
		) : (
			<div className={className} contentEditable={false} data-type="dbdiagram">
				<div className="svg">
					{popup ? (
						<Popup defaultOpen lockScroll={false} onClose={() => setPopup(null)}>
							<div className={className}>
								<div className="scroll article">
									<TableDB className="" object={popup} />
								</div>
							</div>
						</Popup>
					) : null}
					<svg
						className={hover ? "highlight" : ""}
						fill="none"
						viewBox={`0 0 ${data.width + 100} ${data.height + 100}`}
						xmlns="http://www.w3.org/2000/svg"
					>
						{data.links?.map((l, idx) => {
							let highlight = false;
							if (hover)
								for (const h of hover) {
									if (h.idx == idx) {
										highlight = true;
										break;
									}
								}
							return (
								<a
									className={highlight ? "highlight" : ""}
									dangerouslySetInnerHTML={{ __html: l.link }}
									key={idx}
									onBlur={() => {
										setFocus(false);
										setHover(null);
									}}
									onFocus={() => {
										setFocus(true);
										setHover([{ idx, table1Name: l.table1Name, table2Name: l.table2Name }]);
									}}
									onMouseOut={() => {
										if (!focus) setHover(null);
									}}
									onMouseOver={() => {
										if (!focus)
											setHover([{ idx, table1Name: l.table1Name, table2Name: l.table2Name }]);
									}}
									tabIndex={0}
								/>
							);
						})}
						{data.tables?.map((table, idx) => {
							let highlight = false;
							if (hover)
								for (const h of hover) {
									if (h.table1Name == table.table.code || h.table2Name == table.table.code) {
										highlight = true;
										break;
									}
								}
							return (
								<a
									className={highlight ? "highlight" : ""}
									key={idx}
									onBlur={() => {
										setFocus(false);
										setHover(null);
									}}
									onFocus={() => {
										setFocus(true);
										setHover(
											data.links
												?.map((l, idx) => {
													return {
														idx,
														table1Name: l.table1Name,
														table2Name: l.table2Name,
													};
												})
												.filter(
													(l) =>
														l.table1Name == table.table.code ||
														l.table2Name == table.table.code,
												),
										);
									}}
									onMouseOut={() => {
										if (!focus) setHover(null);
									}}
									onMouseOver={() => {
										if (!focus)
											setHover(
												data.links
													?.map((l, idx) => {
														return {
															idx,
															table1Name: l.table1Name,
															table2Name: l.table2Name,
														};
													})
													.filter(
														(l) =>
															l.table1Name == table.table.code ||
															l.table2Name == table.table.code,
													),
											);
									}}
									tabIndex={0}
								>
									<g
										className="titleBlock"
										dangerouslySetInnerHTML={{ __html: table.title }}
										onClick={() => setPopup(table.table)}
									/>
									{table.fields?.map((field, idx) => (
										<g dangerouslySetInnerHTML={{ __html: field }} key={idx} />
									))}
								</a>
							);
						})}
					</svg>
				</div>
			</div>
		);
	},
)`
	.svg {
		max-width: var(--article-max-width);
	}

	svg a {
		text-decoration: none;
		cursor: default;
		outline: none;
	}

	svg .title {
		font: bold 30px "Open Sans", sans-serif;
	}

	svg .titleBlock {
		cursor: pointer;
	}

	svg .titleBlock:hover {
		text-decoration: underline;
	}

	svg .field {
		font: 25px "Open Sans", sans-serif;
	}

	svg .key {
		font-weight: bold;
	}

	svg .notNullable {
		font: 25px "Open Sans", sans-serif;
	}

	svg.highlight > * {
		opacity: 0.5;
	}

	svg.highlight > .highlight {
		opacity: 1;
	}

	.scroll {
		padding: 20px;
		overflow-y: auto;
		max-height: 600px;
		color: var(--color-article-text);
		background: var(--color-article-bg);
		border-radius: var(--radius-small);
		box-shadow: 0 0 4px var(--color-shadows-scroll);
	}
`;

export default DbDiagram;
