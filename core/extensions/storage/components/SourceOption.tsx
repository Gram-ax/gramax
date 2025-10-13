import useRemoveSource from "@ext/storage/components/useRemoveSource";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import t from "@ext/localization/locale/translate";
import getStorageIconByData from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import CustomSelectOption from "@ext/git/actions/Clone/components/SelectOption";

interface SourceOptionProps {
	storageKey: string;
	source: SourceData;
	onDelete?: () => void;
	onEdit?: () => void;
	onInvalid?: (source: SourceData) => void;
}

const SourceOption = ({ storageKey, source, onDelete, onInvalid, onEdit }: SourceOptionProps) => {
	const { removeSource, getSourceUsage } = useRemoveSource({
		sourceName: storageKey,
	});

	const onDeleteClick = async () => {
		const usage = await getSourceUsage();

		const message = usage?.length
			? t("git.source.remove-alert") +
			  " " +
			  t("git.source.remove-alert-usage") +
			  usage.map((u) => ` - ${u}`).join("\n")
			: t("git.source.remove-alert");

		if (await confirm(message)) {
			await removeSource();
			onDelete?.();
		}
	};

	return (
		<CustomSelectOption
			invalid={source.isInvalid}
			key={storageKey}
			value={storageKey}
			label={storageKey}
			icon={getStorageIconByData(source)}
			onEdit={onEdit}
			onDelete={onDeleteClick}
			onClickInvalid={(e) => {
				e.stopPropagation();
				e.preventDefault();
				onInvalid?.(source);
			}}
		/>
	);
};

export default SourceOption;
