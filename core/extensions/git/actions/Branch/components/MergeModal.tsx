import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import { MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Form, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			<ModalContent>
				<Form asChild {...form}>
					<form className="contents" onSubmit={formSubmit}>
						<FormHeader
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
							icon={"git-pull-request-arrow"}
							title={t("git.merge.title")}
						/>
						<ModalBody>
							<FormStack>
								<OptionsContainer>
									<CheckboxField
										checked={form.watch("options.deleteAfterMerge")}
										label={t("git.merge.delete-branch-after-merge")}
										onCheckedChange={(value) =>
											form.setValue("options.deleteAfterMerge", toBoolean(value))
										}
									/>
									<span>
										<CheckboxField
											checked={form.watch("options.squash")}
											description={t("git.merge.squash-tooltip")}
											label={t("git.merge.squash")}
											onCheckedChange={(value) =>
												form.setValue("options.squash", toBoolean(value))
											}
										/>
									</span>
								</OptionsContainer>
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={
								<Button disabled={isLoading} type="submit">
									{isLoading && <SpinnerLoader height={16} width={16} />}
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
