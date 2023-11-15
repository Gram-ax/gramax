import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Error from "@components/Error";
import { getLocalizedString } from "@components/libs/utils";
import styled from "@emotion/styled";
import { useState } from "react";
import Popup from "reactjs-popup";
import { Table, TableWithRefs } from "../../../../../logic/components/tableDB/table";
import Language from "../../../../localization/core/model/Language";
import useLocalize from "../../../../localization/useLocalize";

const TableDB = styled(
	({
		object,
		lang,
		error,
		isLogged,
		className,
	}: {
		object: Table | TableWithRefs;
		lang: Language;
		error?: { message: string; stack: string };
		isLogged: boolean;
		className?: string;
	}) => {
		if (error) return <Error error={error} isLogged={isLogged} />;
		if (!object) return <SpinnerLoader width={75} height={75} />;

		const table = (t: string, refTable?: Table) => (
			<code onClick={refTable ? () => setPopup(refTable) : null} className={refTable ? "refTable" : ""}>
				<Icon code="table" /> {t}
			</code>
		);
		const [popup, setPopup] = useState(null);
		return (
			<div className={className} data-type="dbtable" contentEditable={false}>
				{popup ? (
					<Popup defaultOpen onClose={() => setPopup(null)} lockScroll={false}>
						<div className={className}>
							<div className="scroll article">
								<TableDB object={popup} lang={lang} isLogged={isLogged} />
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
					dangerouslySetInnerHTML={{ __html: getLocalizedString(object.description, lang) }}
				/>
				<table className="fields">
					<thead>
						<tr>
							<th>{useLocalize("field")}</th>
							<th>{useLocalize("type")}</th>
							<th>{useLocalize("description")}</th>
						</tr>
					</thead>
					<tbody>
						{object.fields.map((field, idx) => {
							return (
								<tr key={idx}>
									<td>
										<code>
											{field.code}
											{!field.nullable && (
												<span title="NOT NULL" className="required">
													*
												</span>
											)}
										</code>
										{field.primary && (
											<span className="pk">
												<Icon code="key" />
												&nbsp;PK
											</span>
										)}
										{field.refObject && (
											<div className="fk" title={useLocalize("foreignKey")}>
												<Icon code="arrow-to-right" />{" "}
												{table(
													field.refObject,
													(object as TableWithRefs).refs
														? (object as TableWithRefs).refs[field.code]
														: null,
												)}
											</div>
										)}
									</td>
									<td>
										<code>{field.sqlType}</code>
									</td>
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
	},
)`
	.fields {
		font-size: 14px;

		.description {
			font-size: 0.9em;
			margin-top: 1em;
		}
	}

	.required {
		color: red;
		font-weight: bold;
		margin-left: 5px;
		vertical-align: 2px;
	}
	.pk {
		font-family: "Roboto Mono", Consolas, monospace;
		display: inline-block;
		margin-left: 0.5em;
		color: var(--color-article-text);
		border-radius: 4px;
		background: var(--color-code-bg);
		padding: 2px 6px;
		.icon {
			margin-right: 0.3em;
			vertical-align: 1px;
			font-size: 12px;
		}
	}
	.fk {
		margin-left: 1.5em;
		margin-top: 0.5em;
		code {
			margin-left: 0.3em;
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
		font-size: 0.9;
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

export default TableDB;
