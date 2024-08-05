import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
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
		const lang = PageDataContextService.value.lang;
		const isLogged = PageDataContextService.value.isLogged;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const [data, setData] = useState<DbDiagramData>(null);
		const [error, setError] = useState(null);
		const [popup, setPopup] = useState(null);
		const [hover, setHover] = useState(null);
		const [focus, setFocus] = useState(false);

		const load = async (src: string, tags: string, primary?: string) => {
			const res = await FetchService.fetch<DbDiagramData>(apiUrlCreator.getDbDiagramUrl(src, primary, tags));
			if (res.ok) setData(await res.json());
			else setError(await res.json());
		};

		useEffect(() => {
			load(src, tags, primary);
		}, [src, tags, primary]);

		if (error || (data && !data?.tables)) return <DiagramError error={error ?? data} diagramName="Db-diagram" />;

		return !data ? (
			<div data-type="dbdiagram" contentEditable={false} />
		) : (
			<div className={className} data-type="dbdiagram" contentEditable={false}>
				<div className="svg">
					{popup ? (
						<Popup defaultOpen onClose={() => setPopup(null)} lockScroll={false}>
							<div className={className}>
								<div className="scroll article">
									<TableDB object={popup} className="" lang={lang} isLogged={isLogged} />
								</div>
							</div>
						</Popup>
					) : null}
					<svg
						viewBox={`0 0 ${data.width + 100} ${data.height + 100}`}
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className={hover ? "highlight" : ""}
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
									dangerouslySetInnerHTML={{ __html: l.link }}
									key={idx}
									className={highlight ? "highlight" : ""}
									onMouseOver={() => {
										if (!focus)
											setHover([{ idx, table1Name: l.table1Name, table2Name: l.table2Name }]);
									}}
									onMouseOut={() => {
										if (!focus) setHover(null);
									}}
									tabIndex={0}
									onFocus={() => {
										setFocus(true);
										setHover([{ idx, table1Name: l.table1Name, table2Name: l.table2Name }]);
									}}
									onBlur={() => {
										setFocus(false);
										setHover(null);
									}}
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
									key={idx}
									className={highlight ? "highlight" : ""}
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
									onMouseOut={() => {
										if (!focus) setHover(null);
									}}
									tabIndex={0}
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
									onBlur={() => {
										setFocus(false);
										setHover(null);
									}}
								>
									<g
										dangerouslySetInnerHTML={{ __html: table.title }}
										onClick={() => setPopup(table.table)}
										className="titleBlock"
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
		border-radius: var(--radius-normal);
		box-shadow: 0 0 4px var(--color-shadows-scroll);
	}
`;

export default DbDiagram;
