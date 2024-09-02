import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { MutableRefObject, TextareaHTMLAttributes, forwardRef, memo } from "react";
import Tooltip from "./Tooltip";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	showError?: boolean;
	errorText?: string;
	dataQa?: string;
	value: string;
}

const TextArea = forwardRef((props: TextAreaProps, ref?: MutableRefObject<HTMLTextAreaElement>) => {
	const { dataQa, disabled, showError, errorText, className, ...otherProps } = props;

	return (
		<div className={classNames(className, {}, ["areaWrapper"])}>
			<Tooltip visible={Boolean(errorText) && showError} content={<span>{errorText}</span>}>
				<textarea
					className={classNames("textArea", { disabled })}
					disabled={disabled}
					ref={ref}
					data-qa={dataQa}
					{...otherProps}
				/>
			</Tooltip>
		</div>
	);
});

export default styled(memo(TextArea))`
	&.areaWrapper {
		display: flex;
		align-items: center;
		flex-direction: row;
		width: 100%;

		font-size: 14px;
	}

	.disabled {
		pointer-events: none;
	}

	.textArea {
		border: none;
		outline: none;
		font-size: inherit;

		padding: 6px 12px;

		width: 100%;

		color: var(--color-article-heading-text);
		background: var(--color-code-bg);
		border-radius: var(--radius-medium);

		max-height: 400px;
		line-height: 1.6;
		font-weight: 300;
		letter-spacing: normal;
		font-family: -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif !important;
	}
`;
