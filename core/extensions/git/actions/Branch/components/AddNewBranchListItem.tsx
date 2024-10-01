import ActionListItem from "@components/List/ActionListItem";
import GitDateSideBar from "./GitDateSideBar";

const AddNewBranchListItem = ({ addNewBranchText }: { addNewBranchText: string }) => {
	return (
		<ActionListItem>
			<GitDateSideBar title={addNewBranchText} iconCode="plus" iconViewBox="3 3 18 18" />
		</ActionListItem>
	);
};

export default AddNewBranchListItem;
