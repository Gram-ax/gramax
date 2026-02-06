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
			<Avatar className="w-4 h-4" size="xs">
				<AvatarImage crossOrigin={isBrowser ? "anonymous" : undefined} src={user.avatarUrl} />
			</Avatar>
		);
	};

	return (
		<Field
			control={() => (
				<TextInput
					className="font-medium"
					readOnly
					startIcon={getStartIcon()}
					value={user ? user.name : t("loading")}
				/>
			)}
			labelClassName="w-44"
			title={t("user")}
		/>
	);
};

export default ReadOnlyUserField;
