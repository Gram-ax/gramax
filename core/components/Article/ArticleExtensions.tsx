import IsEditService from "@core-ui/ContextServices/IsEdit";
import styled from "@emotion/styled";
import { MenuBarId } from "../../extensions/markdown/core/edit/components/Menu/Menu";

export default styled(({ className }: { className?: string }) => {
	const isEdit = IsEditService.value;

	return <div className={className}>{isEdit && <div id={MenuBarId} />}</div>;
})`
	bottom: 4px;
	z-index: 101;
	position: sticky;
`;
