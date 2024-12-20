import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import UserCircle from "../Atoms/UserCircle";

import Editor, { EditorProps } from "./CommentEditor";
import { useEffect } from "react";

interface InputProps extends EditorProps {
	onLoaded?: () => void;
}

const Input = styled(({ className, ...props }: InputProps) => {
	const userName = PageDataContextService.value.userInfo;

	useEffect(() => {
		props.onLoaded?.();
	}, []);

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
	align-items: flex-start;

	.user-circle {
		margin-right: 1em;
	}

	.editer {
		width: 100%;
		padding-top: 0.35em;
	}

	.editer .article .article-body .tiptap .is-empty {
		margin: 0 !important;
	}

	.editer * {
		font-size: 1em;
	}
`;

export default Input;
