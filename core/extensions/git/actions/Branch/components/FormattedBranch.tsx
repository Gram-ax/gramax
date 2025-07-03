import Icon from "@components/Atoms/Icon";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { ReactNode } from "react";

const Wrapper = styled.span<{ changeColorOnHover?: boolean }>`
	background: var(--merge-branch-code-bg);
	color: var(--merge-branch-code-text);
	font-weight: 400;
	padding: 0 2px;
	border-radius: var(--radius-x-small);
	font-size: 12px;
	line-height: 16px;

	> i {
		margin-right: 2px;
	}

	${({ changeColorOnHover }) =>
		changeColorOnHover &&
		css`
			:hover {
				background: var(--merge-branch-code-bg-hover);
			}
		`}
`;

interface FormattedBranchProps {
	name: ReactNode;
	changeColorOnHover?: boolean;
}

const FormattedBranch = (props: FormattedBranchProps) => {
	const { name, changeColorOnHover = false } = props;

	return (
		<Wrapper changeColorOnHover={changeColorOnHover}>
			<Icon code="git-branch" strokeWidth={"2.5px"} style={{ lineHeight: "normal" }} />
			{name}
		</Wrapper>
	);
};

export default FormattedBranch;
