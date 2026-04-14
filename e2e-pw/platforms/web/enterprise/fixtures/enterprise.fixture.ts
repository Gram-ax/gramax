import "@utils/async";
import { baseTest } from "@web/fixtures/base.fixture";
import EnterpriseCreds from "../pom/enterprise.pom";

export interface EnterpriseFixture {
	creds: EnterpriseCreds;
}

export const enterpriseTest = baseTest.extend<EnterpriseFixture, object>({
	creds: new EnterpriseCreds(),
});
