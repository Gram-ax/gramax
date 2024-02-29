import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

const FormStyle = styled(
	({ className, children }: { padding?: string; overflow?: boolean; className?: string; children?: JSX.Element }) => (
		<div className={classNames("form-layout", {}, [className])}>
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
			}
			> .input-lable.full-width {
				flex: 1;
			}
		}

		.input-lable-description {
			display: flex;
			flex-direction: row;

			> div:first-of-type {
				flex: 0.4;
			}

			> div:last-child {
				flex: 0.6;
				font-size: 12px;
				color: var(--color-text-main);
			}
		}

		.input-lable-description.full-width {
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

export default FormStyle;
