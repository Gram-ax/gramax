import IsEditService from "@core-ui/ContextServices/IsEdit";
import styled from "@emotion/styled";

export default styled(({ className, id }: { id: string; className?: string }) => {
	const isEdit = IsEditService.value;

	return <div className={className}>{isEdit && <div id={id} />}</div>;
})`
	bottom: 4px;
	z-index: 101;
	position: sticky;
`;
