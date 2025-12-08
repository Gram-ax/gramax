import { DocportalWelcome } from "@components/HomePage/Welcome/Docportal";
import { EditorWelcome } from "@components/HomePage/Welcome/Editor";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { HTMLAttributes } from "react";

const NoneGroups = (props: HTMLAttributes<HTMLDivElement>) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const Component = isReadOnly ? DocportalWelcome : EditorWelcome;

	return (
		<div {...props}>
			<Component />
		</div>
	);
};

export default styled(NoneGroups)`
	margin: auto 0;
	height: inherit;
	width: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
`;
