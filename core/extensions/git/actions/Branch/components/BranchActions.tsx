import Button from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import Input from "@components/Labels/Input";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { ListItem, ButtonItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import AddNewBranchListItem from "@ext/git/actions/Branch/components/AddNewBranchListItem";
import BranchSideBar from "@ext/git/actions/Branch/components/BranchSideBar";
import MergeBranches from "@ext/git/actions/Branch/components/MergeBranches";
import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import useLocalize from "@ext/localization/useLocalize";
import { useEffect, useRef, useState } from "react";

interface BranchActionsProps {
	currentBranch: string;
	trigger: JSX.Element;
	onNewBranch?: (branchName: string) => void;
	onStopMerge?: (isError: boolean) => void;
}

const BranchActions = (props: BranchActionsProps) => {
	const { currentBranch, trigger, onNewBranch = () => {}, onStopMerge = () => {} } = props;
	const lang = PageDataContextService.value.lang;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const readOnly = PageDataContextService.value.conf.isReadOnly;
	const addNewBranchText = useLocalize("addNewBranch");

	const [displayedBranch, setDisplayedBranch] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const [initNewBranchName, setInitNewBranchName] = useState("");
	const [isInitNewBranch, setIsInitNewBranch] = useState(false);
	const [isInitNewBranchNameExist, setIsInitNewBranchNameExist] = useState(false);
	const [apiProcess, setApiProcess] = useState(false);
	const initNewBranchInputRef = useRef<HTMLInputElement>(null);

	const [isNewBranch, setIsNewBranch] = useState(false);
	const [branches, setBranches] = useState<GitBranchData[]>([]);

	const [newBranches, setNewBranches] = useState<GitBranchData[]>([]);

	const [brancTohMergeInTo, setBrancTohMergeInTo] = useState<string>(null);
	const [deleteAfterMerge, setDeleteAfterMerge] = useState<boolean>(null);
	const [canMerge, setCanMerge] = useState<boolean>(null);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const canInitNewBranch =
		isInitNewBranch && !isNewBranch && initNewBranchName && !isInitNewBranchNameExist && !apiProcess;
	const canSwitchBranch =
		!isInitNewBranch && displayedBranch && !isNewBranch && currentBranch !== displayedBranch && !apiProcess;

	const getNewBranches = async () => {
		setIsLoadingData(true);
		const getBranchUrl = apiUrlCreator.getVersionControlResetBranchesUrl();
		const response = await FetchService.fetch<GitBranchData[]>(getBranchUrl);
		if (!response.ok) {
			setIsOpen(false);
			return;
		}
		setNewBranches(await response.json());
		setIsLoadingData(false);
	};

	const switchBranch = async () => {
		if (!displayedBranch) return;
		const newBranchUrl = apiUrlCreator.getVersionControlCheckoutBranchUrl(displayedBranch);
		setApiProcess(true);
		const response = await FetchService.fetch(newBranchUrl);
		if (!response.ok) {
			setApiProcess(false);
			return;
		}
		onNewBranch(displayedBranch);
		setIsNewBranch(true);
		setIsOpen(false);
		setApiProcess(false);
	};

	const initNewBranch = async () => {
		const initNewBranchUrl = apiUrlCreator.getVersionControlCreateNewBranchUrl(initNewBranchName);
		setApiProcess(true);
		const response = await FetchService.fetch(initNewBranchUrl);
		if (!response.ok) {
			setApiProcess(false);
			return;
		}
		onNewBranch(initNewBranchName);
		setIsNewBranch(true);
		setIsOpen(false);
		setApiProcess(false);
	};

	const mergeBranches = async () => {
		const mergeIntoUrl = apiUrlCreator.mergeInto(brancTohMergeInTo, deleteAfterMerge);
		setApiProcess(true);
		const res = await FetchService.fetch(mergeIntoUrl);
		if (!res.ok) {
			setApiProcess(false);
			onStopMerge(true);
			setIsOpen(false);
			return;
		}
		onStopMerge(false);
		setIsOpen(false);
		setApiProcess(false);
	};

	const onCmdEnter = async () => {
		let action: () => Promise<void>;
		if (canInitNewBranch) action = initNewBranch;
		else if (canSwitchBranch) action = switchBranch;
		if (!action && canMerge) action = mergeBranches;
		if (!action) return;
		if ((canInitNewBranch || canSwitchBranch) && canMerge) return;
		await action();
	};

	useEffect(() => {
		setIsInitNewBranchNameExist(
			[currentBranch, ...branches.map((otherBranch) => otherBranch.name)].includes(initNewBranchName),
		);
	}, [initNewBranchName]);

	useEffect(() => {
		if (isInitNewBranch) initNewBranchInputRef.current.focus();
	}, [isInitNewBranch]);

	const areNewBranchesLoading = newBranches.length === 0;

	useEffect(() => {
		if (areNewBranchesLoading) return;
		if (isInitNewBranch) initNewBranchInputRef.current.focus();
	}, [areNewBranchesLoading]);

	useEffect(() => {
		if (!newBranches) return;
		setBranches(newBranches.filter((b) => b.name != currentBranch));
	}, [newBranches]);

	const addNewBranchListItem: ButtonItem[] = !readOnly
		? [
				{
					element: <AddNewBranchListItem addNewBranchText={addNewBranchText} />,
					labelField: addNewBranchText,
					onCLick: () => {
						setIsInitNewBranch(true);
					},
				},
		  ]
		: undefined;

	const branchListItems: ListItem[] = [
		...branches.map((b) => {
			return {
				element: (
					<BranchSideBar
						name={b.name}
						iconCode={b.remoteName ? "cloud" : "desktop"}
						tooltipContent={b.remoteName ? useLocalize("remote", lang) : useLocalize("local", lang)}
						data={{ lastCommitAuthor: b.lastCommitAuthor, lastCommitModify: b.lastCommitModify }}
					/>
				),
				labelField: b.name,
			};
		}),
	];

	return (
		<ModalLayout
			trigger={trigger}
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
				void getNewBranches();
			}}
			onClose={() => {
				setIsInitNewBranch(false);
				setDisplayedBranch("");
				setIsNewBranch(false);
				setNewBranches([]);
				setApiProcess(false);
				setIsOpen(false);
			}}
			onCmdEnter={onCmdEnter}
			setGlobasStyles={true}
		>
			<ModalLayoutLight>
				<FormStyle>
					{apiProcess ? (
						<>
							<legend>{useLocalize("loading2", lang)}</legend>
							<SpinnerLoader fullScreen />
						</>
					) : (
						<>
							<legend>{useLocalize("changeBranch", lang)}</legend>
							<div className="form-group field field-string">
								<ListLayout
									isLoadingData={isLoadingData}
									selectAllOnFocus={true}
									onSearchClick={() => {
										setIsInitNewBranch(false);
										setDisplayedBranch("");
									}}
									openByDefault={true}
									buttons={addNewBranchListItem}
									items={branchListItems}
									onItemClick={(elem) => {
										setDisplayedBranch(elem ?? currentBranch);
									}}
									placeholder={useLocalize("findBranch", lang)}
								/>
							</div>
							{isInitNewBranch && (
								<div className="init-new-branch-input form-group">
									<Input
										ref={initNewBranchInputRef}
										style={isNewBranch ? { pointerEvents: "none" } : null}
										placeholder={useLocalize("enterBranchName", lang)}
										onChange={(e) => setInitNewBranchName(e.currentTarget.value)}
									/>
								</div>
							)}
							<div className="buttons">
								{isInitNewBranch ? (
									<Button disabled={!canInitNewBranch} onClick={initNewBranch}>
										{useLocalize("add", lang)}
									</Button>
								) : (
									<Button disabled={!canSwitchBranch} onClick={switchBranch}>
										{useLocalize("switch", lang)}
									</Button>
								)}
							</div>
							<IsReadOnlyHOC>
								<MergeBranches
									onClick={mergeBranches}
									onCanMergeChange={(value) => setCanMerge(value)}
									onBrancTohMergeInToChange={(value) => setBrancTohMergeInTo(value)}
									onDeleteAfterMergeChange={(value) => setDeleteAfterMerge(value)}
									currentBranch={currentBranch}
									isLoadingData={isLoadingData}
									branches={branchListItems}
								/>
							</IsReadOnlyHOC>
						</>
					)}
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default BranchActions;
