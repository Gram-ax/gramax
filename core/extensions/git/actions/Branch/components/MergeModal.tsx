import Icon from "@components/Atoms/Icon";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import { MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import { Form, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import styled from "@emotion/styled";
import { CheckboxField } from "@ui-kit/Checkbox";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { Button } from "@ui-kit/Button";

const OptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5em;
`;

interface MergeModalProps {
	sourceBranchRef: string;
	targetBranchRef: string;
	isLoading?: boolean;
	onSubmit: (mergeRequestOptions: MergeRequestOptions) => void;
	onClose?: () => void;
}

const toBoolean = (value: string | boolean) => {
	if (typeof value === "string") return value === "true";
	return value;
};

const MergeModal = ({ sourceBranchRef, targetBranchRef, onSubmit, onClose, isLoading }: MergeModalProps) => {
	const [isOpen, setIsOpen] = useState(true);

	const schema = z.object({
		options: z.object({
			deleteAfterMerge: z.boolean().optional(),
			squash: z.boolean().optional(),
		}),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			options: {
				deleteAfterMerge: false,
				squash: false,
			},
		},
	});

	const formSubmit = (e) => {
		form.handleSubmit((data) => {
			onSubmit({
				deleteAfterMerge: data.options.deleteAfterMerge,
				squash: data.options.squash,
			});
		})(e);
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose?.();
	};

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			<ModalContent>
				<Form asChild {...form}>
					<form className="contents" onSubmit={formSubmit}>
						<FormHeader
							icon={"git-pull-request-arrow"}
							title={t("git.merge.title")}
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
								<OptionsContainer>
									<CheckboxField
										checked={form.watch("options.deleteAfterMerge")}
										onCheckedChange={(value) =>
											form.setValue("options.deleteAfterMerge", toBoolean(value))
										}
										label={t("git.merge.delete-branch-after-merge")}
									/>
									<span>
										<CheckboxField
											checked={form.watch("options.squash")}
											description={t("git.merge.squash-tooltip")}
											onCheckedChange={(value) =>
												form.setValue("options.squash", toBoolean(value))
											}
											label={t("git.merge.squash")}
										/>
									</span>
								</OptionsContainer>
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={
								<Button disabled={isLoading} type="submit">
									{isLoading && <SpinnerLoader width={16} height={16} />}
									{isLoading ? t("loading") : t("git.merge.merge")}
								</Button>
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default MergeModal;
