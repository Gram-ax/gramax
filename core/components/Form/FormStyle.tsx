import styled from "@emotion/styled";
import { cssMedia } from "../../ui-logic/utils/cssUtils";

const FormStyle = styled(
	({ className, children }: { padding?: string; overflow?: boolean; className?: string; children?: JSX.Element }) => (
		<div className={className + " form-layout"}>
			<fieldset>{children}</fieldset>
		</div>
	),
)`
	width: 100%;
	height: 100%;
	max-height: 100%;
	border-radius: 0.3rem;
	background: var(--color-article-bg);
	color: var(--color-article-heading-text);
	padding: ${(p) => p.padding ?? "1rem"};
	overflow: ${(p) => (p.overflow ?? true ? "auto" : "")};

	fieldset {
		border: 0;
		width: 100%;
		min-width: 100%;
		max-width: 100%;

		.description {
			font-size: 18px;
			font-weight: normal;
			margin-bottom: 0.5rem;
		}

		span.required {
			margin-left: 0.2rem;
			color: var(--color-admonition-danger-br-h);
		}

		legend {
			margin-top: 1em;
			line-height: 1.5;
			font-weight: 400;
			font-size: 1.6em;
			margin-bottom: 0.5em;
			color: var(--color-article-heading-text);
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
		}

		.field.column {
			gap: 0.3rem;
			display: flex;
			flex-direction: column;
		}

		.field.row {
			display: flex;
			align-items: center;
			flex-direction: row;
			justify-content: space-between;

			> .control-label {
				flex: 0.3;

				> div {
					${cssMedia.narrow} {
						width: min-content;
					}
				}
			}

			> .input-lable {
				flex: 0.7;
			}
			> .input-lable.checkbox {
				flex: 1;
			}
		}

		.input-lable-description {
			display: flex;
			flex-direction: row;

			> div:first-of-type {
				flex: 0.3;
			}

			> div:last-child {
				flex: 0.7;
				font-size: 12px;
				color: var(--color-text-main);
			}
		}

		.input-lable-description.checkbox {
			> div:last-child {
				flex: 1;
			}
		}

		.buttons {
			display: flex;
			padding-top: 1rem;
			align-items: center;
			flex-direction: row;
			justify-content: flex-end;

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

export default FormStyle;
