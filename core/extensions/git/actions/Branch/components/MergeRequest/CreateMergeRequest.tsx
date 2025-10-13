import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import useWatch from "@core-ui/hooks/useWatch";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import validateEmail from "@core/utils/validateEmail";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import SelectGES from "@ext/git/actions/Branch/components/MergeRequest/SelectGES";
import SelectGitCommitAuthors from "@ext/git/actions/Branch/components/MergeRequest/SelectGitCommitAuthors";
import {
	ApprovalSignature,
	CreateMergeRequest,
	MergeRequestOptions,
} from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { Textarea } from "@ui-kit/Textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const OptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5em;
`;

interface MergeRequestModalProps {
	useGesUsersSelect: boolean;
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onOpen?: () => void;
	onClose?: () => void;
	preventSearchAndStartLoading?: boolean;
	isLoading?: boolean;
}

const CreateMergeRequestModal = (props: MergeRequestModalProps) => {
	const {
		preventSearchAndStartLoading = false,
		sourceBranchRef,
		targetBranchRef,
		onSubmit,
		onOpen,
		isLoading = false,
		onClose,
		useGesUsersSelect,
	} = props;

	const [isOpen, setIsOpen] = useState(true);

	const schema = z.object({
		approvers: z.array(z.object({ label: z.string(), value: z.string() })),
		description: z.string().optional(),
		options: z
			.object({
				deleteAfterMerge: z.boolean().default(false).optional(),
				squash: z.boolean().default(false).optional(),
			})
			.optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit((data) => {
			onSubmit({
				targetBranchRef,
				approvers: data.approvers.map((item) => AuthorInfoCodec.deserialize(item.value) as ApprovalSignature),
				description: data.description,
				options: data.options as MergeRequestOptions,
			});
		})(e);
	};

	useWatch(() => {
		if (isOpen) onOpen?.();
		else onClose?.();
	}, [isOpen]);

	return (
		<Modal open={isOpen} onOpenChange={setIsOpen}>
			<ModalContent data-modal-root size="M">
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmit}>
						<FormHeader
							icon={"git-pull-request-arrow"}
							title={t("git.merge-requests.create")}
							description={
								<div className="flex items-center gap-1">
									<span>{t("git.merge.branches")}</span>
									<FormattedBranch name={sourceBranchRef} />
									<span>
										<Icon code="arrow-right" />
									</span>
									<FormattedBranch name={targetBranchRef} />
								</div>
							}
						/>
						<ModalBody>
							<FormStack>
								<FormField
									name="approvers"
									required
									title={t("git.merge-requests.approvers")}
									control={({ field }) => (
										<>
											{useGesUsersSelect ? (
												<SelectGES
													preventSearchAndStartLoading={preventSearchAndStartLoading}
													approvers={field.value}
													onChange={(reviewers) => {
														field.onChange(
															reviewers.map((reviewer) => ({
																label: reviewer.name,
																value: AuthorInfoCodec.serialize(reviewer),
															})),
														);
													}}
												/>
											) : (
												<SelectGitCommitAuthors
													approvers={field.value}
													shouldFetch={isOpen}
													onChange={(reviewers) => {
														const additionalReviewers = reviewers.filter((reviewer) =>
															validateEmail(reviewer.value),
														);

														const res = [
															...reviewers
																.filter((reviewer) => !!reviewer.name)
																.map((reviewer) => ({
																	label: reviewer.name,
																	value: AuthorInfoCodec.serialize(reviewer),
																})),
															...additionalReviewers.map((reviewer) => ({
																label: reviewer.value,
																value: AuthorInfoCodec.serialize(reviewer),
															})),
														];

														field.onChange(res);
													}}
												/>
											)}
										</>
									)}
									labelClassName={"w-44"}
								/>
								<FormField
									name="description"
									title={t("description")}
									control={({ field }) => (
										<Textarea
											{...field}
											rows={5}
											placeholder={`${t("write")} ${t("description").toLowerCase()}`}
										/>
									)}
								/>
								<FormField
									name="options"
									title={t("other")}
									labelClassName="items-start"
									control={({ field }) => (
										<OptionsContainer>
											<CheckboxField
												className="gap-2"
												checked={field.value?.deleteAfterMerge}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, deleteAfterMerge: value })
												}
												label={t("git.merge.delete-branch-after-merge")}
											/>
											<CheckboxField
												className="gap-2"
												checked={field.value?.squash}
												description={t("git.merge.squash-tooltip")}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, squash: value })
												}
												label={t("git.merge.squash")}
											/>
										</OptionsContainer>
									)}
								/>
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={
								<Button disabled={isLoading} type="submit">
									{isLoading && <SpinnerLoader width={16} height={16} />}
									{isLoading ? t("loading") : t("git.merge-requests.create-request")}
								</Button>
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default CreateMergeRequestModal;
