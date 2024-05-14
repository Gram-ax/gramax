import countFiles from "@app/commands/migrate/countFiles";
import migrate from "@app/commands/migrate/migrate";
import shouldMigrate from "@app/commands/migrate/shouldMigrate";

export default {
	shouldMigrate,
	countFiles,
	migrate,
};
