import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ReactNode } from "react";

const Wrapper = styled.span`
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
`;

const FormattedBranch = ({ name }: { name: ReactNode }) => {
	return (
		<Wrapper>
			<Icon code="git-branch" strokeWidth={"2.5px"} style={{ lineHeight: "normal" }} />
			{name}
		</Wrapper>
	);
};

export default FormattedBranch;
