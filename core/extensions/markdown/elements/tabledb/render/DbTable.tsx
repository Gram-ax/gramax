import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { getLocalizedString } from "@components/libs/utils";
import LanguageService from "@core-ui/ContextServices/Language";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { useState } from "react";
import Popup from "reactjs-popup";
import { Table, TableWithRefs } from "../../../../../logic/components/tableDB/table";

interface TableDBProps {
	object: Table | TableWithRefs;
	error?: { message: string; stack: string };
	className?: string;
}

const TableDB = ({ object, error, className }: TableDBProps) => {
	const lang = LanguageService.currentUi();

	if (error)
		return <DiagramError error={error} title={t("diagram.error.tabledb-render-failed")} diagramName="Db-Table" />;

	if (!object) return <SpinnerLoader width={75} height={75} />;
	const [popup, setPopup] = useState(null);

	const table = (t: string, refTable?: Table) => (
		<code onClick={refTable ? () => setPopup(refTable) : null} className={refTable ? "refTable" : ""}>
			<Icon code="table" />
			<span>{t}</span>
		</code>
	);

	return (
		<div className={className} data-type="dbtable" contentEditable={false}>
			{popup ? (
				<Popup defaultOpen onClose={() => setPopup(null)} lockScroll={false}>
					<div className={className}>
						<div className="scroll article">
							<TableDB object={popup} />
						</div>
					</div>
				</Popup>
			) : null}
			<h3>
				{table(object.code)} <span>{getLocalizedString(object.title, lang)}</span>
			</h3>
			<div className="subtitle" dangerouslySetInnerHTML={{ __html: object.subtitle }} />
			<div
				className="description"
				dangerouslySetInnerHTML={{
					__html: getLocalizedString(object.description, lang),
				}}
			/>
			<table className="fields">
				<colgroup>
					<col style={{ width: "30%" }} />
					<col style={{ width: "30%" }} />
					<col style={{ width: "30%" }} />
				</colgroup>
				<thead>
					<tr>
						<th>{t("field")}</th>
						<th>{t("type")}</th>
						<th>{t("description")}</th>
					</tr>
				</thead>
				<tbody>
					{object.fields.map((field, idx) => {
						return (
							<tr key={idx}>
								<td>
									<div className="field-code">
										<code>
											{field.code}
											{!field.nullable && (
												<span title="NOT NULL" className="required">
													*
												</span>
											)}
										</code>
										{field.primary && (
											<code>
												<Icon code="key-round" />
												&nbsp;PK
											</code>
										)}
										{field.refObject && (
											<div className="fk" title={t("foreign-key")}>
												<Icon code="arrow-right-to-line" />
												<span>
													{table(
														field.refObject,
														(object as TableWithRefs).refs
															? (object as TableWithRefs).refs[field.code]
															: null,
													)}
												</span>
											</div>
										)}
									</div>
								</td>
								<td>{field.sqlType && <code>{field.sqlType}</code>}</td>
								<td>
									{(field.title || field.refObject) && (
										<div className="title">
											{getLocalizedString(field.title, lang) || field.refObject}
										</div>
									)}
									{field.default && (
										<div>
											Default: <code>{field.default}</code>
										</div>
									)}
									{getLocalizedString(field.description, lang) && (
										<div
											className="description"
											dangerouslySetInnerHTML={{
												__html: getLocalizedString(field.description, lang),
											}}
										/>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default styled(TableDB)`
	margin: 1em 0;
	.fields {
		display: table;
		font-size: 14px;

		.description {
			font-size: 0.9em;
			margin-top: 1em;
		}
	}

	.field-code {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	code {
		margin: 0;
		display: inline-flex;
		align-items: center;
	}

	.required {
		color: red;
		font-weight: bold;
		margin-left: 2px;
		vertical-align: 2px;
	}

	.pk {
		font-family: "Roboto Mono", Consolas, monospace;
		display: inline-block;
		margin-left: 0.5em;
		color: var(--color-article-text);
		border-radius: var(--radius-small);
		background: var(--color-code-bg);
		padding: 2px 6px;

		.icon {
			margin: 0 0.3em 0 0;
			vertical-align: 1px;
			font-size: 12px;
		}
	}

	.fk {
		display: flex;
		flex-direction: row;
		align-content: center;
		align-items: center;

		code {
			margin: 0 0.3em 0 0;
			display: inline-flex;
			align-items: center;
			white-space: nowrap;
		}
	}

	h3 {
		margin-top: 0;
	}

	h3 code {
		font-size: 17px;

		.icon {
			vertical-align: baseline;
		}
	}

	.title {
	}

	.description {
		font-size: 0.9em;
	}

	.scroll {
		padding: 20px;
		overflow-y: auto;
		max-height: 600px;
		color: var(--color-article-text);
		background: var(--color-article-bg);
		box-shadow: var(--shadows-changeable-deeplight);
	}

	.refTable {
		cursor: pointer;
	}

	.refTable:hover {
		text-decoration: underline;
	}
`;
