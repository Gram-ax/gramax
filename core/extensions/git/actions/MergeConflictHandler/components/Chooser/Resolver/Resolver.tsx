import Divider from "@components/Atoms/Divider";
import styled from "@emotion/styled";
import { Conflict } from "../../../model/FileTypes";
import BottomMergeButton from "./BottomMergeButton";
import TopMergeButton from "./TopMergeButton";

const Resolver = styled(
	({
		conflict,
		onClick,
		className,
	}: {
		conflict: Conflict;
		onClick: (conflict: Conflict) => void;
		className?: string;
	}) => {
		return (
			<div className={"resolver " + className}>
				{conflict.resolved && !conflict.isTopPart ? null : (
					<TopMergeButton
						resolved={conflict.resolved}
						onClick={() => {
							const newConflictState: Conflict = {
								...conflict,
								resolved: !conflict.resolved,
								isTopPart: true,
							};
							onClick(newConflictState);
						}}
					>
						{conflict.topPart}
					</TopMergeButton>
				)}
				{conflict.resolved ? null : <Divider style={{ height: "4px" }} />}
				{conflict.resolved && conflict.isTopPart ? null : (
					<BottomMergeButton
						resolved={conflict.resolved}
						onClick={() => {
							const newConflictState: Conflict = {
								...conflict,
								resolved: !conflict.resolved,
								isTopPart: false,
							};
							onClick(newConflictState);
						}}
					>
						{conflict.bottomPart}
					</BottomMergeButton>
				)}
			</div>
		);
	},
)`
	border-radius: 8px;
	overflow: hidden;
	margin: 0px calc(20px - 0.5rem);
`;

export default Resolver;
