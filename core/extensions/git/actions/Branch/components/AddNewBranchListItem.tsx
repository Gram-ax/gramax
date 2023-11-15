import ActionListItem from "@components/List/ActionListItem";
import BranchSideBar from "./BranchSideBar";

const AddNewBranchListItem = ({ addNewBranchText }: { addNewBranchText: string }) => {
	return (
		<ActionListItem>
			<BranchSideBar name={addNewBranchText} iconCode="plus" />
		</ActionListItem>
	);
};

export default AddNewBranchListItem;
