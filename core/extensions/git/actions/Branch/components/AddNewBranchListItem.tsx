import ActionListItem from "@components/List/ActionListItem";
import BranchSideBar from "./BranchSideBar";

const AddNewBranchListItem = ({ addNewBranchText }: { addNewBranchText: string }) => {
	return (
		<ActionListItem>
			<BranchSideBar name={addNewBranchText} iconCode="plus" iconViewBox="3 3 18 18" />
		</ActionListItem>
	);
};

export default AddNewBranchListItem;
