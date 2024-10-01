import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

interface FormStyleProps {
	padding?: string;
	overflow?: boolean;
	height?: string;
	className?: string;
	formDirection?: "row" | "column";
	fieldDirection?: "row" | "column";
	children?: JSX.Element;
}

const FormStyle = ({ className, children }: FormStyleProps) => (
	<div className={classNames("form-layout", {}, [className])}>
		<div style={{ height: "100%" }}>{children}</div>
	</div>
);

export default styled(FormStyle)`
	height: ${(p) => p.height ?? "100%"};
	width: 100%;
	max-height: 100%;
	border-radius: var(--radius-x-large);
	background: var(--color-article-bg);
	color: var(--color-article-heading-text);
	padding: ${(p) => p.padding ?? "1rem"};
	overflow: ${(p) => (p.overflow ?? true ? "auto" : "")};

	> div {
		legend {
			line-height: 1.5;
			font-weight: 400;
			font-size: 1.6em;
			margin-bottom: 0.5em;
			color: var(--color-article-heading-text);
		}

		.description {
			font-size: 18px;
			font-weight: normal;
			margin-bottom: 0.5rem;
		}

		fieldset {
			border: 0;
			width: 100%;
			min-width: 100%;
			max-width: 100%;

			display: flex;
			flex-direction: ${(p) => p?.formDirection ?? "column"};
			${(p) => (p?.formDirection ? "gap: 1rem;" : "")}

			span.required {
				margin-left: 0.2rem;
				color: var(--color-admonition-danger-br-h);
			}

			h3 {
				margin: 1.5rem 0px 0.5rem;
			}

			.separator {
				height: 2rem;
			}

			.control-label {
				font-weight: 400;
			}

			.field {
				font-size: 14px;
			}

			.field.field-height {
				height: 34px;
			}

			.form-group {
				margin-bottom: 0.5rem;
				${(p) => (p?.formDirection ? "flex: 1;" : "")}
			}

			.field.column {
				gap: 0.4rem;
				display: flex;
				flex-direction: column;
			}

			.field.row {
				display: flex;
				align-items: baseline;
				flex-direction: row;
				justify-content: space-between;

				> .control-label {
					flex: 0.4;

					> div {
						${cssMedia.narrow} {
							width: min-content;
						}
					}
				}

				> .input-lable {
					flex: 0.6;
					max-width: 60%;
				}
				> .input-lable.full-width {
					flex: 1;
					max-width: 100%;
				}
			}

			.input-lable-description {
				display: flex;
				flex-direction: row;

				> div:first-of-type {
					flex: 0.4;
				}

				> div:last-child {
					flex: ${(p) => (!p?.fieldDirection || p?.fieldDirection === "row" ? "0.6" : "1")};
					font-size: 12px;
					color: var(--color-text-main);

					> p {
						line-height: 1.6em;

						> code {
							font-size: 10px;
							padding: 0 2px 1px 2px;
						}
					}
				}
			}

			.input-lable-description.full-width {
				> div:last-child {
					flex: 1;
				}
			}
		}

		.buttons {
			display: flex;
			padding-top: 1rem;
			align-items: center;
			flex-direction: row;
			justify-content: flex-end;
			gap: 1rem;

			.left-buttons {
				flex: 1;
				display: flex;
				align-items: center;
				flex-direction: row;
				justify-content: flex-start;
			}
		}
	}

	a {
		color: var(--color-link);
	}
	a:hover {
		text-decoration: underline;
	}
`;
