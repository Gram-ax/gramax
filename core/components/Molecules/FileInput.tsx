import ButtonLink, { ButtonLinkProps } from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { HTMLProps } from "react";

interface InputProps extends HTMLProps<HTMLInputElement> {
	dataQa?: string;
	buttonLinkProps?: ButtonLinkProps;
}

const FileInput = (props: InputProps) => {
	const { dataQa, className, buttonLinkProps, ...inputProps } = props;

	return (
		<div className={className}>
			<label style={{ width: "100%" }}>
				<ButtonLink dataQa={dataQa} {...buttonLinkProps} />
				<input className="textInput" type={"file"} {...inputProps} />
			</label>
		</div>
	);
};

export default styled(FileInput)`
	.disabled {
		color: var(--color-input-disabled-text);
	}

	.hasError {
		color: var(--color-admonition-danger-br-h);
	}

	input::placeholder {
		color: var(--color-placeholder);
	}
`;
