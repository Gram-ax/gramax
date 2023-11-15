import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import UserCircle from "../Atoms/UserCircle";

import Editor, { EditorProps } from "./CommentEditor";

const Input = styled(({ className, ...props }: EditorProps) => {
	const userName = PageDataContextService.value.userInfo;

	return (
		<div className={className}>
			<div className="user-circle">
				<UserCircle name={userName.name} />
			</div>
			<div className="editer">
				<Editor {...props} />
			</div>
		</div>
	);
})`
	width: 100%;
	display: flex;
	font-size: 15px;

	.user-circle {
		margin-right: 1rem;
	}

	.editer {
		padding-top: 9px;
	}
`;

export default Input;
