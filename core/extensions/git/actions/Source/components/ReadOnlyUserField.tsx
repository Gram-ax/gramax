import { usePlatform } from "@core-ui/hooks/usePlatform";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import t from "@ext/localization/locale/translate";
import { Avatar, AvatarImage } from "@ui-kit/Avatar";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { Loader } from "@ui-kit/Loader";

interface ReadOnlyUserFieldProps {
	user: SourceUser;
	renderAvatar?: boolean;
}

const ReadOnlyUserField = (props: ReadOnlyUserFieldProps) => {
	const { user, renderAvatar = true } = props;
	const { isBrowser } = usePlatform();

	const getStartIcon = () => {
		if (!user) return <Loader className="p-0" />;
		if (!renderAvatar) return;

		return (
			<Avatar size="xs" className="w-4 h-4">
				<AvatarImage src={user.avatarUrl} crossOrigin={isBrowser ? "anonymous" : undefined} />
			</Avatar>
		);
	};

	return (
		<Field
			title={t("user")}
			labelClassName="w-44"
			control={() => (
				<TextInput
					startIcon={getStartIcon()}
					className="font-medium"
					value={user ? user.name : t("loading")}
					readOnly
				/>
			)}
		/>
	);
};

export default ReadOnlyUserField;
