import { getExecutingEnvironment } from "@app/resolveModule/env";

const locale = {
	forms: {
		"catalog-edit-props": {
			name: "Catalog Settings",
			description: "Set the catalog parameters and its display",
			props: {
				title: {
					name: "Catalog Title",
					placeholder: "Enter the catalog name",
					description: "Displayed on the homepage and within the catalog",
				},
				url: {
					name: "Repository Name",
					placeholder: "Enter the repository name",
					description: "System name assigned when creating the repository. Displayed in the URL",
				},
				docroot: {
					name: "Directory",
					placeholder: "Specify the directory",
					description: "Path to the directory where all documentation will be stored in the repository",
				},
				versions: {
					name: "Versions",
					placeholder: "Specify the versions",
					description:
						"List of versions (branches or tags) to be shown in the doc portal. Specified as glob patterns, e.g., v19.* or release-*",
				},
				filterProperties: {
					name: "Filter Properties",
					placeholder: "Specify the filter properties",
					description: "List of properties to use for filtering the catalog",
				},
				language: {
					name: "Main language",
					placeholder: "English",
					description: "Main language of the catalog. Cannot be changed after selection",
				},
				description: {
					name: "Description",
					placeholder: "Enter a description",
				},
				style: {
					name: "Style",
					placeholder: "Blue",
				},
				code: {
					name: "Short Name",
					placeholder: "Enter a short name",
				},
				properties: {
					name: "Properties",
				},
			},
			section: {
				display: "Display on the homepage",
			},
			extended: {
				name: "Format",
			},
		},
		"catalog-extended-edit-props": {
			name: "Text Storage Format",
			props: {
				syntax: {
					name: "Article Markup Language",
					description:
						"By default, articles are saved in extended Markdown syntax. You can choose a different format: after saving the settings, all articles will be reformatted. You will only need to publish the changes",
					placeholder: "Legacy",
				},
			},
		},
		"catalog-create-props": {
			name: "Props settings",
			props: {
				name: {
					name: "Name",
					placeholder: "Enter a name for the property",
				},
				type: {
					name: "Type",
					placeholder: "Flag",
					description: "Cannot be changed after save",
				},
				icon: {
					name: "Icon",
					placeholder: "Icon",
				},
				style: {
					name: "Style",
					placeholder: "Blue",
				},
				values: {
					name: "Values",
					placeholder: "Value",
				},
			},
		},
		"review-edit-props": {
			name: "Share Link",
			props: {
				haveAccess: {
					name: "Recipient has access to [$STORAGE_NAME]($STORAGE_URL)",
					description:
						"If the recipient does not have access, a [repository access token]($ACCESS_TOKEN_DOCS) will be added to the link on your behalf.",
				},
			},
		},
		"article-edit-props": {
			name: "Properties",
			props: {
				title: {
					name: "Title",
				},
				url: {
					name: "URL",
				},
			},
		},
		"git-source-data": {
			props: {
				sourceType: {
					name: "Type",
				},
				url: {
					name: "Git Server URL",
					placeholder: "https://git-server.com",
					description: "Copy the URL from the main page of your repository",
				},
				token: {
					name: "Token",
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5", // # gitleaks:allow
					description: "Token for reading and modifying repositories in the storage",
				},
				password: {
					name: "Password",
					placeholder: "password",
					description: "Password used for authorization on the git server",
				},
				createDate: {
					name: "Creation Time",
					placeholder: "1707213960",
					description: "Time the token was obtained",
				},
				usePassword: {
					name: "Use Password",
					description: "Use password instead of token",
				},
				refreshToken: {
					name: "Refresh Token",
					placeholder: "4740fbc6db719d42c158b88580be7633c1e386827ebe9134e9a5198c52cb2e4c",
					description: "Token for refreshing the main token",
				},
				userName: {
					name: "Author Name",
					description: "Will be displayed in the change history",
					placeholder: "John Doe",
				},
				gitServerUsername: {
					name: "Git Username",
					description: "Username used for authorization on the git server",
					placeholder: "john.doe",
				},
				userEmail: {
					name: "Email",
					description: "Will be displayed in the change history",
					placeholder: "john.doe@gmail.com",
				},
			},
		},
		"gitlab-source-data": {
			props: {
				sourceType: {
					name: "Type",
				},
				token: {
					name: "GitLab Token",
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5", // # gitleaks:allow
					description: `<a ${
						getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
					} href='{{create_token_url}}'>New token</a><br>Token for reading and modifying repositories in storage. Specify the token permissions: <code>api</code>, <code>read_repository</code>, <code>write_repository</code>. <a ${
						getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
					} href='https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html'>Learn more</a>`,
				},
				url: {
					name: "GitLab Server URL",
					placeholder: "https://gitlab.com",
					description: "Log in to GitLab and copy the URL from the main page",
				},
				createDate: {
					name: "Creation Time",
					placeholder: "1707213960",
					description: "Token retrieval time",
				},
				refreshToken: {
					name: "Refresh Token",
					placeholder: "4740fbc6db719d42c158b88580be7633c1e386827ebe9134e9a5198c52cb2e4c",
					description: "Token for refreshing the main token",
				},
				userName: {
					name: "Author Name",
					description: "Will be displayed in the change history",
					placeholder: "John Doe",
				},
				userEmail: {
					name: "Email",
					description: "Will be displayed in the change history",
					placeholder: "john.doe@mail.com",
				},
			},
		},
		"gitverse-source-data": {
			props: {
				sourceType: {
					name: "Type",
				},
				token: {
					name: "GitVerse Token",
					placeholder: "e5a43119d84f620fedfc0929e125ed4b10a6a5f4", // # gitleaks:allow
					description:
						`<a ${
							getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
						} href='https://gitverse.ru/settings/tokens'>Create token</a><br>Token for reading and modifying repositories in storage. Specify the token permissions: <code>Репозиторий</code>, <code>Публичный API</code>. ` +
						`<a ${
							getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
						} href='https://gitverse.ru/docs/account-and-profile/tokens-uc/'>Learn more</a>`,
				},
				url: {
					name: "GitVerse Server URL",
					placeholder: "https://gitverse.ru",
					description: "Log in to GitVerse and copy the URL from the main page",
				},
				createDate: {
					name: "Creation Time",
					placeholder: "1707213960",
					description: "Token retrieval time",
				},
				refreshToken: {
					name: "Refresh Token",
					placeholder: "4740fbc6db719d42c158b88580be7633c1e386827ebe9134e9a5198c52cb2e4c",
					description: "Token for refreshing the main token",
				},
				userName: {
					name: "Author Name",
					description: "Will be displayed in the change history",
					placeholder: "John Doe",
				},
				userEmail: {
					name: "Email",
					description: "Will be displayed in the change history",
					placeholder: "john.doe@mail.com",
				},
			},
		},
		"confluence-server-source-data": {
			props: {
				sourceType: {
					name: "Тип",
				},
				domain: {
					name: "Confluence server URL",
					placeholder: "https://confluence.domain.com",
					description: "Copy the URL of your Confluence server",
				},
				password: {
					name: "Password",
					placeholder: "opxsdk_tvdg",
					description: "Enter the Confluence account password",
				},
				userName: {
					name: "Username",
					placeholder: "John",
					description: "Enter the Confluence account username",
				},
				token: {
					name: "Токен",
					description: `Enter the Confluence account token. <a ${
						getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
					} href='https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html'>Подробнее</a>`,
					placeholder: "NzIzNTYyNTQ3NjQxOva29fNcHrLYMGH77/YuEAKpqy+Q",
				},
			},
		},
		"admin-login-props": {
			name: "Account Login",
			props: {
				login: {
					name: "Login",
					placeholder: "Enter login",
				},
				password: {
					name: "Password",
					placeholder: "Enter password",
				},
			},
		},
		"snippet-editor": {
			name: "Snippet editor",
			props: {
				title: {
					name: "Title",
					placeholder: "My snippet",
				},
				id: {
					name: "Id",
					placeholder: "my_id",
				},
				content: {
					name: "Content",
				},
			},
		},
		"snippet-add": {
			name: "Create snippet",
			props: {
				title: {
					name: "Title",
					placeholder: "My snippet",
				},
				id: {
					name: "Id",
					placeholder: "my_id",
				},
				content: {
					name: "<p>Content</p>",
				},
			},
		},
		"ics-account-in": {
			name: "Generate ICS Account",
			description: "Input data",
			props: {
				fullName: {
					name: "Full Name",
				},
			},
		},
		"ics-account-out": {
			name: "Execution Result",
			props: {
				fullName: {
					name: "Full Name",
				},
				email: {
					name: "Email",
				},
				login: {
					name: "Login",
				},
			},
		},
		"sign-in-enterprise": {
			name: "Sign in to Your Business Account",
			props: {
				email: {
					name: "Sign in to your Gramax Enterprise Server account",
					description: "Use your work email to connect to your organization's workspace.",
					placeholder: "Enter your email",
				},
			},
		},
	},
	app: {
		update: {
			error: "Unable to update the application",
			retry: "Try again",
			available: "New version is available",
			updating: "Updating...",
			installed: "Update installed",
		},
		loading: "loading",
		error: {
			"browser-not-supported": {
				title: "This browser is not supported",
				desc: "<span>Open Gramax in a <a href='https://gram.ax/resources/docs/app/web-editor'>different browser</a> or </span><a href='https://gram.ax'> download the app</a><span> to your computer</span>",
			},
			"unknown-error": "Unknown error",
			"cannot-load": "Unable to load the application",
			"not-https":
				"Missing <a href='https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated'>cross-origin isolation</a> or HTTPS connection which is required to run application",
			"command-failed": {
				title: "Something went wrong",
				body: '<p>Reload the page and try again.</p><p>We will receive a problem report and try to fix it quickly. If the error blocks your work — contact us on <a href="https://t.me/gramax_assist_bot">Telegram</a>.</p>',
				"body-enterprise": `<p>Reload the page and try again. If the error blocks your work — contact <a href='https://t.me/gramax_chat' target='${
					getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
				}'>support</a>.</p>`,
			},
			"something-went-wrong": "Something went wrong",
		},
		"continue-in-browser": {
			title: "Opened in Gramax application",
			description:
				"The catalog is already open in the Gramax desktop application. Do you want to continue in the browser?",
			action: "Continue in browser",
		},
	},
	language: {
		name: "Language",
		ru: "Русский",
		en: "English",
		zh: "中文",
		hi: "हिन्दी",
		es: "Español",
		fr: "Français",
		ar: "العربية",
		pt: "Português",
		de: "Deutsch",
		ja: "日本語",
		ko: "한국어",
		it: "Italiano",
		tr: "Türkçe",
		nl: "Nederlands",
		pl: "Polski",
		sv: "Svenska",
		cs: "Čeština",
		ky: "Кыргызча",
	},
	"style-guide": {
		"check-with-style-guide": "Check with style guide",
		"set-up-connection-and-style-guide": "Set up connection and style guide",
		"check-article": "Check current article",
		"set-up-style-guide": "Set up style guide settings",
		"set-up-connection": "Set up connection",
		"style-guide-settings": "Style guide settings",
		"delete-text": "Suggested to delete a fragment",
		"replace-text": "Suggestion for replacement",
		"LLM-provider": "LLM Provider",
		"enter-token": "Enter token",
		"verifying-token": "Verifying token",
		"invalid-token": "Invalid token",
		recommended: "Recommended",
		"settings-file": "Settings file",
		"invalid-file-format": "Invalid file format",
		"select-file": "Select a file",
		"no-file-selected": "No file selected",
		"token-descriprion":
			"Your token remains on your device and is not transmitted to our servers. Please keep your token secure and do not share it with others.",
		"settings-description": `<p>To upload a style guide configuration file, follow these steps:</p>
<ol>
	<li>
		<p>
			Go to
			<a
				target="_blank"
				href="https://check.gram.ax"
				rel="noreferrer"
			>
				check.gram.ax
			</a>
			and navigate to "Settings".
		</p>
	</li>
	<li>
		<p>
			Set up the connection tokens for your chosen LLM provider (e.g., OpenAI, Anthropic, etc.).
		</p>
	</li>
	<li>
		<p>Create rules and test their functionality.</p>
	</li>
	<li>
		<p>Export the configuration file.</p>
	</li>
	<li>
		<p>Upload the resulting file in this form.</p>
	</li>
</ol>
<p>
	For more details, refer to the
	<a
		target="_blank"
		rel="noreferrer"
		href="https://gram.ax/resources/docs/review/comments"
	>
		documentation
	</a>
	.
</p>`,
	},
	workspace: {
		name: "Workspace",
		"configure-your-workspace": "Configure your space settings",
		"default-name": "Default Workspace",
		"enter-name": "Enter a name",
		"path-desc": "Directory on the local disk where working catalogs are located",
		selected: "Working directory: ",
		add: "Add workspace",
		edit: "Workspace settings",
		delete: {
			desktop: "Delete workspace? Working directory will remain on your computer",
			web: "Delete workspace? All catalogs in it will also be deleted",
		},
		"edit-style": "Edit style",
		"editing-css": "Editing CSS-styles",
		"css-configuration-instruction":
			"Use the {{instruction}} to configure the CSS styles of the application and the portal",
		instruction: "instruction",
		"css-style": "CSS-style",
		logo: "Logo",
		appearance: "Appearance",
		"set-ai-server": "AI server",
		"ai-server-url": "AI server URL",
		"ai-server-url-description": "Enter the URL of your AI server",
		"ai-server-token": "AI server token",
		"ai-server-token-description": "Enter the token for your AI server",
		"ai-server-error": "Error connecting to AI server. Check the URL",
		"ai-token-set-error": "Token is not set. To connect, you need to set the token",
		"ai-token-error": "Token is invalid. Check it in the server settings",
		"delete-ai-server": "Delete AI server?",
		"upload-error-title": "Upload Error",
		"invalid-logo-format-body": "Unsupported file format. Please upload a logo in SVG or PNG format only",
		"icon-invalid-files-body":
			"Errors occurred while uploading files [{{iconNames}}]. Please upload icons in SVG format and no larger than 500 KB",
		"icons-available-in-article": "Icons available in the article",
		"icons-uploaded": "Icons uploaded",
		"logo-upload-failed": "Failed to upload the logo",
		"logo-size-exceeded": "The logo size must not exceed 500KB",
		"css-styles-description": "Advanced styles settings for your workspace",
		"dark-logo-description": "Logo for dark theme. Used only in dark theme",
		"for-dark-theme": "For the dark theme",
		"default-logo-description":
			"Default logo. Used in the light theme and also in the dark theme if there is no separate dark theme logo",
		tooltip: {
			"only-current": {
				one: "catalog is available for sync in the current workspace",
				few: "catalogs are available for sync in the current workspace",
				many: "catalogs are available for sync in the current workspace",
			},
			"including-current": {
				one: "catalog is available for sync ({{current-count}} in current)",
				few: "catalogs are available for sync in {{workspace-count}} workspaces ({{current-count}} in current)",
				many: "catalogs are available for sync in {{workspace-count}} workspaces ({{current-count}} in current)",
			},
			"excluding-current": {
				one: "catalog is available for sync",
				few: "catalogs are available for sync in {{workspace-count}} workspaces",
				many: "catalogs are available for sync in {{workspace-count}} workspaces",
			},
			"only-one-excluding-current": {
				one: "catalog is available for sync in one of workspaces",
				few: "catalogs are available for sync in one of workspaces",
				many: "catalogs are available for sync in one of workspaces",
			},
			"has-changes": {
				one: "{{count}} catalog is available for sync",
				few: "{{count}} catalogs are available for sync",
				many: "{{count}} catalogs are available for sync",
			},
		},
	},
	"file-input": {
		"select-file": "Select a file",
		"no-file-chosen": "no file chosen",
		"logo-light": "Logo for light theme",
		"logo-dark": "Logo for dark theme",
		"dark-theme-only": "Displayed only in dark theme",
		"both-themes-if-no-dark": "Displayed in both themes if no dark logo",
	},
	modal: {
		confirm: {
			"warning-have-changes": "Are you sure you want to exit editing mode? Your changes will be discarded",
		},
	},
	multilang: {
		switch: "Switch language",
		warning: {
			action: {
				title: "Changes will apply to all languages",
				body: "You're about to update the structure of a multi-language catalog. To keep everything working smoothly, the structure needs to stay the same across all languages.",
			},
			delete: {
				title: "Delete content in all languages?",
				body: "You're about to delete content that exists in multiple languages. Since the catalog structure must stay the same across all languages, this will remove the same content in all other languages too.",
			},
		},
		"delete-confirm": "Are you sure you want to delete language?",
		"add-localization": "Add language",
		current: "You're already viewing this language",
		error: {
			"cannot-switch-to-self": "You can't delete or switch to the language you're currently using",
			"cannot-add-language": "This language is already added",
		},
	},
	article: {
		create: {
			title: "Create Article",
			body: "Your sections and articles will be in the left navigation. Start by creating your first article.",
		},
		title: "Article Title",
		"no-name": "Untitled",
		placeholder: "Article text",
		"add-child": "Add a sub-article",
		"add-root": "Add a root article",
		links: {
			name: "Related articles",
			backlinks: "Backlinks",
			links: "Links",
			"no-links": "No links",
		},
		configure: {
			title: "Article settings",
			description: "Configure your article settings",
		},
		"edit-markdown": "Edit Markdown",
		"markdown-edit": {
			title: "Markdown Formatting",
			description: "Edit or define the article styling using Markdown",
		},
		error: {
			parse: "Gramax couldn’t read the Markdown structure in the article file.\nClick Edit Markdown, then fix the error or remove the structure.",
			"resource-too-large": {
				title: "Unable to add file",
				desc: "File size exceeds {{maxSizeMb}} MB. Compress it, select a smaller file, or use the desktop version.",
			},
			"not-found": {
				title: "Article not found",
				body: "The article was moved or deleted. Reload the page to get the updates.",
			},
			"render-failed": "Failed to display the article",
		},
		custom: {
			"404": {
				title: {
					article: "Article not found",
					catalog: "Catalog not found",
				},
				"alert-title": "Check that the path is correct",
				pathname: "Please ensure that the path `{{pathname}}` actually exists",
				"open-in-desktop":
					"You can also [open this path in Gramax desktop app](gramax://{{pathname}}) to edit on your computer",
			},
			"403": `---
title: 403
---

[alert:warning:This is a private article]\n\nLog in with an account that has access or request permissions from the author.\n\n[/alert]`,
			"500": {
				title: `---
title: Unable to display the article
---
`,
				body: `[alert:error:Gramax couldn’t read the Markdown structure in the article file].\n\nFix the error or remove the structure by "Edit Markdown".\n\n[/alert]`,
			},
			"init-source": `---
title: Catalog already linked with repository
---

We detected that the catalog is linked with a repository.
But we don't know which storage this repository is located in.
Add storage to confirm the link.`,
		},
	},
	section: {
		configure: {
			title: "Section Settings",
			description: "Configure your section settings",
		},
	},
	catalog: {
		"new-name": "New Catalog",
		new: "Create new",
		"new-2": "Create new catalog",
		"new-3": "Stored locally until first publication",
		clone: "Load",
		"clone-2": "Load existing",
		"clone-3": "Clone via Link",
		"clone-4": "If it already exists in the storage",
		import: "Import",
		"import-2": "Import from another system",
		"import-3": "From Confluence or Notion",
		add: "Add catalog",
		delete: "Delete catalog",
		name: "catalog",
		configure: "Configure catalog",
		"missing-config": {
			title: "Insufficient catalog information",
			description:
				"This catalog was not created in Gramax: it has no name, group, or logo. Specify them in the settings.",
			"open-settings": "Open settings",
		},
		style: {
			red: "Red",
			blue: "Blue",
			black: "Black",
			green: "Green",
			purple: "Purple",
			"blue-pink": "Blue-pink",
			"pink-blue": "Pink-blue",
			"blue-green": "Blue-green",
			"red-green": "Red-green",
			"orange-red": "Orange-red",
			"red-orange": "Red-orange",
			"blue-purple": "Blue-purple",
			"purple-blue": "Purple-blue",
			"dark-orange": "Dark-orange",
			"pink-purple": "Pink-purple",
			"orange-green": "Orange-green",
			"green-orange": "Green-orange",
			"bright-orange": "Bright-orange",
			"purple-orange": "Purple-orange",
		},
		"get-started": {
			editor: "With Gramax, you can create and edit documentation directly in the code repository. You can start in three ways:",
			"editor-desc":
				"<ul><li>Create a catalog in Gramax and publish it to GitLab or GitHub.</li><li>Load an existing repository.</li><li>Import a section from Confluence.</li></ul>",
			docportal: "Load catalogs that will be visible to readers",
		},
		error: {
			"already-exist": "Such a catalog already exists",
			"already-exist-2":
				"In storage % catalog % already exists.\nChange the “Repository Name” in the catalog settings.",
		},
	},
	share: {
		name: {
			catalog: "Share catalog",
			article: "Share article",
		},
		"new-file-disable": "You can share only after the article is published",
		copy: "Link to access the article and catalog on the branch ",
		hint: "You can also copy the link directly from your browser's address bar.",
		note: "Note:",
		desc: "<b>Note:</b> Make sure the recipient has access to the repository in {{domain}} via an <em>Access Token</em> with <code>read_api</code> and <code>write_repository</code> permissions.",
		more: "Learn more.",
		popover: "Copied to clipboard",
		error: {
			"no-private-groups": "No private groups set. Learn more https://docs.ics-it.ru/doc-reader/catalog/private",
			"need-permission": "Need access to the catalog",
			"incorrect-ticket": "Incorrect ticket",
		},
	},
	diagram: {
		name: "Diagram",
		names: {
			c4: "C4 Diagram",
			mermaid: "Mermaid Diagram",
			puml: "PlantUml Diagram",
			ts: "TS Diagram",
			drawio: "Diagrams.net Diagram",
		},
		error: {
			"render-failed": "Failed to render diagram",
			"cannot-get-data": "Check if the path is correct and if the diagram file is in the repository.",
			"no-internet": "Check your internet connection.",
			"invalid-syntax": "Check the diagram syntax.",
			"wrong-name": "Incorrect diagram name",
			"tabledb-render-failed": "Failed to display the table",
			"tabledb-file-not-found": "Error displaying item. Schema file not found at the path",
			"tabledb-not-found": "Error displaying item. Table not found",
			specification: "Failed to render specification",
			"mermaid-export-next-error": "Mermaid diagram will be rendered as diagram content",
		},
	},
	"open-in": {
		web: "Open in web app",
		desktop: "Open in app",
		gramax: "Edit in Gramax",
		generic: "Open in",
		teams: "Open in Teams",
		finder: "Show in Finder",
		explorer: "Show in Explorer",

		error: {
			"cannot-open-desktop": {
				title: "App not installed",
				desc: "<a target='_blank' rel='noreferrer' href='https://gram.ax'>Download the app</a><span> and try again.</span>",
			},
		},
	},
	"enterprise-guest": {
		welcomeTitle: "Welcome to Gramax Enterprise Server",
		descriptions: {
			emailFieldDescription: "Enter your email to receive a one-time code",
			otpFieldDescription: "Enter the code sent to your email",
			continueWith: "or continue with",
		},
		placeholders: {
			emailPlaceholder: "johndoe@example.com",
			otpPlaceholder: "123456",
		},
		buttons: {
			sendPasswordButton: "Send code",
			resendPasswordButton: "Resend code",
			confirmButton: "Confirm",
			resendPasswordButtonWithCooldown: "Resend code in {seconds} sec",
			corporateLoginButton: "Corporate login (SSO)",
		},
		fields: {
			emailLabel: "Email",
			otpLabel: "Access code",
		},
		validationErrors: {
			emailRequired: "Email is required",
			emailInvalidFormat: "Invalid email format",
			otpRequired: "Code is required",
			otpNumbersOnly: "Code must contain only numbers",
			otpLength: "Code must be 6 digits long",
			formSubmitError: "Please fill all required fields correctly",
		},
		tooltips: {
			tooManyRequests: "Too many requests. Try after {minutes} min",
			resendAvailableIn: "Resend available in {seconds}",
			internalServerError: "Internal server error. Please try again later",
			loginFailed: "Login failed (Status: {status})",
			errorSendingPassword: "Error sending code (Status: {status})",
			invalidOtp: "Invalid code",
			networkError: "Network error. Please try again",
		},
	},
	cloud: {
		"publish-to-cloud": "Publish to Cloud",
		"login-modal": {
			title: "Sign in to Gramax Cloud",
			description: "Authorization is required to publish the catalog",
			definition:
				"is a service for hosting static HTML versions of catalogs. After publishing, your catalog will be available at the following link",
			"account-info":
				"Sign in is required to protect and link the publication to your account. All subsequent publications will also be performed on behalf of this account.",
		},
		"upload-modal": {
			title: "Publish catalog",
			description: "Make your catalog available to everyone",
			info: "After publishing, the catalog will become available <strong>to everyone on the Internet</strong> at the following link:",
			revoke: "You can unpublish the catalog at any time.",
			"switch-account": "Switch account",
			status: {
				building: "Building site",
				publishing: "Publishing",
			},
			published: {
				title: "Republish catalog",
				description: "Update the published catalog available to everyone",
				info: "After republishing, the catalog will remain available <strong>to everyone on the Iinternet</strong> at the following link:",
			},
		},
		"uploaded-modal": {
			title: "Catalog published successfully",
			link: "Link to the published catalog",
			description:
				"You can see the publication status in the right panel. There you can also update or revoke the publication.",
		},
		"publish-status-panel": {
			published: "Published",
			republish: "Republish",
			delete: "Delete publication",
		},
		error: {
			"failed-to-connect": "Failed to connect to the cloud server",
			"request-failed": "Failed to request to the cloud server",
		},
		"delete-catalog": "The catalog will be deleted from cloud",
	},
	"log-in": "Log in to ",
	"login-with": "Login with ",
	search: {
		name: "Search",
		open: "Open search",
		placeholder: "Enter query",
		desc: '<ul><li>Use <code>"</code> for exact matches. Example:&nbsp;<code><nobr>"word"</nobr></code> or <code><nobr>"search phrase"</nobr></code>.</li><li>Use <code>-</code> to exclude. Example:&nbsp;<code><nobr>-word</nobr></code> or <code><nobr>-"excluded phrase"</nobr></code>.</li></ul>',
		"articles-not-found": "No articles found",
		"all-catalogs": "Search all catalogs",
		ai: "AI search",
		"ai-search-error":
			"The AI search function is unavailable due to technical problems. We recommend contacting the system administrator for additional information.",
		"ai-search-error-title": "Technical problems with AI search",
	},
	list: {
		"no-results-found": "No results found",
		"search-articles": "Link or search for articles",
	},
	versions: {
		switch: "Switch version",
		version: "Version",
		"not-actual-warning": {
			header: "Outdated version",
			"1": "You are viewing an outdated version ",
			"2": "Switch to the <a data-qa href='{{link}}'>latest version</a> to view the actual version",
		},
	},
	filterProperties: {
		switch: "Filter",
		unfilter: "No filter",
	},
	git: {
		source: {
			error: {
				"cannot-create-repo": "Unable to create repository",
				"storage-not-exist": 'Storage named "{{storage}}" does not exist. Add it.',
				"catalog-exist":
					"In storage {{storage}} catalog {{name}} already exists.\nChange the “Repository Name” field in the catalog settings.",
				"cannot-bind-to-storage": `Cannot bind to this storage`,
				"unsupported-link": "A link of the format must be specified",
				"invalid-credentials": {
					desc: "The current token for this storage is invalid. Update the storage data and try again.",
				},
			},
			"remove-alert": "Are you sure you want to delete this source?",
			"remove-alert-usage": "It is used in the following catalogs:\n\n",
		},
		clone: {
			progress: {
				finish: "Downloaded",
				downloading: "Downloading",
				checkout: "Checking out",
				wait: "Waiting server",
				queue: "Pending",
				cancel: "Cancelling",
			},
			etc: {
				bs: "{bs} B/s",
				kbs: "{kbs} KB/s",
				mbs: "{mbs} MB/s",
				b: "{} B",
				kb: "{} KB",
				mb: "{} MB",
				"eta-s": ", ETA {s}s",
				"eta-m": ", ETA {m}m {s}s",
				"eta-h": ", ETA {h}h {m}m {s}s",
			},

			"receiving-objects": "Received {received} objects of {total} (indexed {indexed})",
			"indexing-deltas": "Indexed {indexed} deltas of {total}",
			checkout: "Checkout {checkouted} files of {total}",
			"repo-link": "Repository link",
			"public-clone": "Clone via Link",
			"not-cloned": {
				title: "Load catalog?",
				body: "The link leads to a catalog that has not been loaded yet. To view and edit, load it from storage.",
			},
			"open-in-app": "You also can open that catalog in Gramax desktop app",
			public: {
				"link-title": "Repository URL",
				"link-placeholder": "Public Git Repository URL",
				"link-description": `Public Git Repository URL to clone.<br>For example: <a href='https://github.com/gram-ax/gramax' ${
					getExecutingEnvironment() === "tauri" ? "" : "target=_blank"
				} rel='noreferrer'>https://github.com/gram-ax/gramax</a>`,
			},
			error: {
				title: "Error loading",
				"cannot-clone": "Unable to load catalog",
				"already-exist": "A catalog with name `{{path}}` already exists",
				"no-permission": "No access to repository {{url}}",
				generic: "Try refreshing the page and loading the catalog again.",
				"branch-not-found": "Unable to load catalog on branch <code>{{branch}}</code>",
				public: {
					"invalid-link":
						"Invalid link to repository. Please check if link is correct and repository is public",
					"name-empty": "Repository name and url cannot be empty",
				},
			},
		},
		sync: {
			error: {
				"local-changes-present": "Your local changes prevent synchronization",
				"no-permission": "You don't have permission to synchronize with this catalog",
			},
		},
		checkout: {
			"change-branch": "Change branch",
			conflict:
				"The current branch has unpublished changes that conflict with changes in another branch. Please publish or revert them.",
			"pathname-desc":
				"If you have unpublished changes and they don't conflict with changes in another branch, they will be carried over.",
			error: {
				"local-changes-present": "Your local changes prevent branch switching",
				// conflict: "There are unpublished changes",
				conflict: "Unable to switch branch",
			},
			submodule: {
				error: "<p>Failed to switch branch to <b>master</b> or <b>main</b> in the {{path}} submodule.<p>",
			},
		},
		branch: {
			management: "Branch management",
			actual: "Actual branch",
			error: {
				"deleting-head-branch":
					"You are trying to delete the branch you are on. Switch to another branch and try again",
				"cannot-delete-protected":
					"Branch <code>{{branch}}</code> is protected from deletion. Uncheck the “Delete branch <code>{{branch}}</code> after merging” option and try again",
				"cannot-delete":
					"Failed to complete the deletion of the published branch <code>{{branch}}</code>. Please reload the page and try again",
				"not-found": {
					local: "Could not determine the current branch",
					remote: "Failed to find remote branch for local branch <code>{{branch}}</code>",
				},
				"not-found-reload": "Could not determine the current branch. Reload the page",
				"already-exist": "Unable to create new branch. Branch <code>{{branch}}</code> already exists",
				"has-been-deleted": {
					title: "Branch has been deleted",
					body: "The branch on which the catalog was located has been deleted. You will be switched to the default branch of the catalog",
				},
			},
			delete: {
				confirm: {
					title: "Delete branch?",
					description:
						"Branch <code>{{branch}}</code> and all its content will be deleted from the app and the Git storage. This action cannot be undone",
				},
			},
		},
		merge: {
			"instant-merge": "Instant merge",
			merge: "Merge",
			"add-user": "Add user",
			branches: "Merge branches",
			"after-merge": "After the merge",
			"current-branch": "Merge the current branch",
			"delete-branch-after-merge": "Delete branch after merge",
			squash: "Squash commits",
			"squash-tooltip": "Changes from the current branch will be squashed into a single commit after merging",
			conflict: {
				conflicts: "Conflicts",
				"abort-confirm": {
					title: {
						sync: "Cancel synchronization?",
						branch: "Undo branch merge?",
					},
					body: {
						sync: "A conflict occurred during synchronization. You need to resolve it to complete synchronization. If you do not, the catalog will return to its previous state.",
						branch: "A conflict occurred while merging branches. You need to resolve it to complete the merge. If you don't, the merge will be canceled.",
						"impossible-conflict":
							"A conflict occurred while merging branches. Reload the page and resolve the conflict.",
					},
					"action-button": {
						sync: "Cancel synchronization",
						branch: "Cancel merge",
					},
					"cancel-button": "Resolve the conflict",
				},
				"current-change": "Current change",
				"incoming-change": "Incoming change",
				"accept-current-change": "Keep current change",
				"accept-incoming-change": "Select incoming change",
				"accept-both": "Select both changes",
				"delete-in-current":
					"The file was deleted in the current revision but changed in the incoming revision",
				"delete-in-incoming":
					"The file was changed in the current revision but deleted in the incoming revision",
				"default-with-deletion-text": "The file was removed or added in the current or incoming change.",
				leave: "Leave",
				"added-by-them": "You do not have a file that was added or renamed in the incoming change.",
				"added-by-us": "You added or renamed a file that was not in the incoming change.",
				"deleted-by-them": "You modified a file that was deleted or renamed in the incoming change.",
				"deleted-by-us": "You deleted or renamed a file that was changed in the incoming change.",
			},
			confirm: {
				sync: "You have unpublished changes that conflict with changes in the live branch. Resolve the conflict before syncing.",
				branch: "Changes in branches conflict. Resolve the conflict before merging.",
				"catalog-conflict-state":
					"Your catalog is in a state of conflict. Resolve the conflict before you continue editing.",
				"catalog-conflict-state-with-checkout":
					"<p>The link leads to the <code>{{branchToCheckout}}</code> branch, but your catalog is in conflict. Resolve the conflict before you continue editing.</p>",
			},
			error: {
				sync: "Failed to synchronize changes",
				generic: "Failed to merge branches",
				branches: "Failed to merge branches",
				"workdir-not-empty": {
					title: "You have local changes",
					body: "Publish or discard local changes. After that, merge the branches.",
				},
				"not-supported": "Merge error. We cannot resolve such conflicts yet",
				"conflict-occured": "Could not automatically resolve merge conflict",
				"conflicts-not-found": "Failed to get conflicting files",
				"catalog-conflict-state": "Resolve the conflict",
			},
		},
		publish: {
			name: "Publish",
			"to-publish": "Publish",
			error: {
				"non-fast-forward": {
					title: "Outdated catalog version",
					body: "The server has newer changes. Synchronize, then publish again.",
				},
				unknown: "Unknown error when publishing. Error message -",
				protected: "Branch protected from publishing",
				"no-permission": "You do not have permission to publish in this catalog",
				"main-branch": "Publishing in this branch is prohibited",
			},
		},
		history: {
			button: "Show history",
			name: "Change History",
			error: {
				"not-found": "Could not find file history",
				"need-to-publish": "Change history will be available after the article is published",
			},
		},
		revisions: {
			"compare-title": "Change review",
			"compare-button": "Change review",
			"choose-placeholder": "Select revision...",
		},
		discard: {
			"seletected-confirm":
				"Discard selected changes? The articles will revert to their previous state, and the added media files will be deleted.",
			"select-all-arrow-tooltip": "Discard selected changes",
			"selected-file-arrow-tooltip": "Discard changes",
			"paragraph-tooltip": "Discard changes",
		},
		warning: {
			"no-changes": {
				title: "No changes",
				body: "There are no changes in the current catalog to publish.",
			},
		},
		error: {
			"not-found": {
				branch: "Failed to find branch <code>{{what}}</code>",
				"remote-branch": "Failed to find remote branch <code>{{what}}</code>",
				blob: "Failed to find file <code>{{path}}</code>",
				repo: {
					title: "Repository not found",
					message: `Failed to find repository <a href='{{url}}' ${
						getExecutingEnvironment() === "tauri" ? "" : "target=_blank"
					} rel='noreferrer'>{{name}}</a> in Git storage. It may have been deleted, moved, or you don't have enough permissions to access it`,
				},
				generic: "Error code - NotFoundError. Error message - ",
			},
			"content-too-large": {
				title: "Too many changes",
				message: `You are trying to push a large file or too many changes at once. Try publishing changes by parts`,
			},
			network: {
				title: "No internet",
				message:
					"Publishing, synchronizing, changing branches, and other operations with Git storage require internet. Reconnect and try again.",
			},
			http: {
				title: "Error when requesting Git storage",
				message: "An unexpected error occurred when requesting the Git repository",
			},
		},
		"merge-requests": {
			"branch-tab-tooltip": "This branch has a merge request",
			"branch-tab-badge": "MR",
			diff: "Changes",
			approvedCountTooltip: "{{approvedCount}} of {{approvedTotal}} approvals",
			changes: "Changes",
			back: "Back",
			create: "Create merge request",
			"create-request": "Create request",
			by: "By",
			into: "into",
			you: "You",
			name: "Merge Request",
			approvers: "Reviewers",
			"no-approvers": "No reviewers",
			"approved-of": "Approved",
			of: "of",
			approval: {
				approved: "Approved",
				unapproved: "Pending review",
			},
			status: {
				draft: "Draft",
				"draft-tooltip": "Waiting for merge request to be pushed to remote",
				"in-progress": "Review",
				"in-progress-tooltip": "Waiting for review and approval",
				approved: "Approved",
				"approved-tooltip": "Approved by all reviewers and ready to merge",
			},
			"disable-button-reason": {
				"has-conflicts": "Conflicts need to be resolved before merging branches",
				draft: "Can't merge a draft",
				"not-approved": "All reviewers need to approve",
				"not-author": "You are not the author of this merge request",
			},
			confirm: {
				title: "Merge branches?",
				body: {
					"delete-branch-after-merge":
						"<p>Changes from the <code>{{sourceBranch}}</code> branch will be merged into the <code>{{targetBranch}}</code> branch, and branch <code>{{sourceBranch}}</code> will be deleted. This action cannot be undone.</p>",
					"not-delete-branch-after-merge":
						"<p>Changes from the <code>{{sourceBranch}}</code> branch will be merged into the <code>{{targetBranch}}</code> branch. This action cannot be undone.</p>",
					"squash-comment":
						"<p>The commits from the <code>{{sourceBranch}}</code> branch will be squashed and merged into the <code>{{targetBranch}}</code> branch. This action cannot be undone.</p>",
					"squash-delete-branch-comment":
						"<p>The commits from the <code>{{sourceBranch}}</code> branch will be squashed and merged into the <code>{{targetBranch}}</code> branch, and the <code>{{sourceBranch}}</code> branch will be deleted. This action cannot be undone.</p>",
				},
			},
			warning: {
				"no-changes": {
					title: "No changes",
					body: "There are no changes in branches to merge.",
				},
			},
			error: {
				"merge-with-conflicts": {
					title: "Failed to merge branches",
					body: "<p>There are conflicts in the branches. Merge the changes from the <code>{{targetBranch}}</code> branch into the <code>{{sourceBranch}}</code> branch. Then resolve the conflict.</p>",
				},
			},
		},
	},
	confluence: {
		blogs: "Blogs",
		"link-board": "Link to board",
		error: {
			"ext-not-supported": "Extension not supported:",
			http: "HTTP Error:",
			"couldnt-find-file": "Could not find file name:",
			"couldnt-find-fileId": "Could not find attachment with fileId:",
			"http-2": "HTTP Error while loading file:",
		},
	},
	import: {
		error: {
			"page-conversion": "Error converting page",
			"ext-not-supported": "Extension not supported:",
			"cannot-import": {
				title: "Failed to import element from ",
				desc: "You can manually transfer it from the page",
			},
		},
	},
	"yandex-disk": {
		"log-in": "Log in to Yandex.Disk",
	},
	diff: {
		"source-text": "Source text",
		"double-panel": "Double panel",
		type: {
			added: "Added",
			modified: "Modified",
			deleted: "Deleted",
		},
	},
	"unsupported-elements": {
		confluence: {
			title: "Some elements will not be migrated",
			description:
				"Gramax does not support specific elements from Confluence, such as Jira tasks, graphs, and reports. You can migrate data from them manually.",
			noteTitle: "List of pages with unsupported elements",
		},
		notion: {
			title: "Some elements will not be migrated",
			description:
				"Gramax does not support specific elements from Notion, such as buttons, breadcrumbs. You can migrate data from them manually.",
			noteTitle: "List of pages with unsupported elements",
			"region-restricted": {
				title: "Access restricted",
				message:
					"Unfortunately, your request cannot be processed because access to Notion is restricted for your region.",
			},
		},
		default: {
			title: "Some elements will not be migrated",
			description:
				"Gramax does not support certain elements from the data source. You can migrate data from them manually.",
			noteTitle: "List of unsupported elements",
		},
	},

	alert: {
		details: "Details",
		image: {
			unavailable: "Failed to display the image",
			path: "Check that it exists and the path is correct.",
		},
		gif: {
			unavailable: "Failed to display the gif",
		},
		video: {
			unavailable: "Failed to display the video",
			path: "Check that the video at the link exists and is accessible to everyone on the internet.",
		},
	},
	editor: {
		ai: {
			improve: "Improve writing",
			generate: "Generate",
			transcribe: "Transcribe speech to text",
		},
		italic: "Italic",
		bold: "Bold",
		stroke: "Strikethrough",
		code: "Code line",
		"code-block": "Code block",
		"bullet-list": "Bullet list",
		"ordered-list": "Numbered list",
		"task-list": "Task list",
		note: "Note",
		heading: "Heading",
		highlight: {
			name: "Highlight background",
			colors: {
				default: "No highlight",
				"lemon-yellow": "Lemon yellow",
				"mint-green": "Mint green",
				lavender: "Lavender",
				"ice-blue": "Ice blue",
				peach: "Peach",
				"light-pink": "Light pink",
				"grayish-blue": "Grayish blue",
			},
		},
		templates: {
			"inline-property": "Property field",
			"block-field": "Block field input",
		},

		table: {
			name: "Table",
			row: {
				title: "Header row",
				"add-up": "Insert row above",
				"add-down": "Insert row below",
				"add-left": "Insert column left",
				"add-right": "Insert column right",
				delete: "Delete entire row",
			},
			column: {
				title: "Header column",
				delete: "Delete entire column",
			},
			align: {
				name: "Alignment",
				left: "Align to left",
				center: "Align to center",
				right: "Align to right",
			},
			"join-cells": "Join cells",
			"split-cells": "Split cells",
			aggregation: {
				name: "Aggregation",
				methods: {
					sum: { name: "SUM", tooltip: "" },
					avg: { name: "AVG", tooltip: "" },
					min: { name: "MIN", tooltip: "" },
					max: { name: "MAX", tooltip: "" },
					count: { name: "COUNT", tooltip: "Number of values in the column." },
					countDistinct: {
						name: "DISTINCT COUNT",
						tooltip: "Number of distinct values in the column.",
					},
				},
			},
		},

		tabs: {
			name: "Tab",
			add: "Add new tab",
			delete: "Delete tab",
			"delete-last": "You are deleting the last tab. Delete the entire element?",
		},

		video: {
			name: "Video",
			link: "Video link",
			"will-be-here": "Your video will be here",
			"not-available": "Video unavailable",
			error: {
				none: "Specify the link in the additional panel and add a caption.",
				"none-2": "Learn which sources can be used for video links",
				"none-2-link": " in the article",
				some: "Check for video availability in the file storage at",
				"some-link": " link",
				"some-2": "Ensure there are no access restrictions for the video/link in the storage.",
				generic: "Check the file name is correct.",
				"generic-2": "Ensure the video is in the appropriate SharePoint folder. Learn where to place the file",
				"generic-2-link": " here",
			},
		},
	},
	"bug-report": {
		name: "Report a Bug",
		submit: "Report",
		"what-happened": "What happened",
		"what-will-be-sent": "What will be sent?",
		describe: "Describe the issue or bug",
		"attach-tech-details": "Attach technical details",
		"this-will-help-us":
			"This information will help us fix the bug faster. We will not see your content or personal data. ",
		"view-tech-details": "View details",
		error: {
			"cannot-send-feedback": {
				title: "Failed to send a feedback",
				message: "You may have an ad blocker enabled. Disable it and try again.",
			},
		},
	},
	word: {
		"table-of-contents": "Table of Contents",
		"error-rendering": "Error: Failed to render ",
		diagram: "diagram",
		picture: "picture",
		tabledb: "database table",
		snippet: "snippet",
		video: "video",
		error: {
			"export-type-error": "Error, no such export type: ",
			"canvas-to-blob-error": "Failed to convert canvas to Blob.",
			"canvas-error": "Failed to get canvas context.",
			"load-image-error": "Failed to load image.",
			"file-not-found-error": "File not found at path.",
			"wrong-object-type": "Error, no such object type.",
			"divide-by-zero-error": "Divide by zero error.",
			"delete-failed-error": "Failed to delete the file",
		},
		template: {
			templates: "Templates",
			"no-template": "No template",
			error: {
				"template-not-found": "Template not found",
				"processing-error": "Error during document processing",
			},
		},
	},
	pdf: {
		"component-parsing-failed": "Failed to process the component",
		"kanban-view-export-error": "The Kanban View will be exported to List View",
	},
	enterprise: {
		"user-not-found":
			"This email isn't set up for Gramax Enterprise Server. You can continue using the full features of the free version or contact your admin for further assistance.",
		"workspace-exit-warning": "Exiting the workspace will delete all directories and local changes will be lost.",
		"workspace-exit": "Exit Workspace",
		"check-if-user-editor-warning": "Make sure you have been issued an editor license.",
		"access-restricted": "Access restricted",
		"config-error": "Configuration issues. Contact your administrator.",
		"workspace-exists": "Enterprise workspace already exists.",
		"check-article": "Checking article",
		"ges-settings": "GES login settings",
		"init-repo": {
			error: "Error creating repository",
			forbidden: "Insufficient permissions to create repository",
			"already-exists": "Repository with this name already exists",
		},
		"add-reviews": {
			forbidden: "Insufficient permissions to add reviewers",
			"not-found": "Failed to find resource",
			"failed-to-add-title": "Failed to add reviewers",
			"failed-to-add-message": "Contact your administrator to add reviewers manually.",
		},
	},
	network: {
		error: {
			title: "No internet",
			body: "Reconnect and try again.",
		},
	},
	"experimental-features": {
		label: "Experimental Features",
		status: {
			"in-dev": "This feature is under development and not intended to be used",
			experimental: "This feature is experimental and may not work as expected",
			unstable: "This feature is unstable and likely contains bugs",
			beta: "This feature is not yet fully stabilized and still may contain bugs",
		},
	},
	export: {
		name: "Export",
		zip: {
			catalog: "Catalog to ZIP",
			article: "Article to ZIP",
			category: "Section to ZIP",
			process: "Preparing to export ZIP archive",
		},
		docx: {
			catalog: "Catalog to DOCX",
			article: "Article to DOCX",
			category: "Section to DOCX",
			process: "Preparing to export DOCX document",
		},
		pdf: {
			catalog: "Catalog to PDF",
			article: "Article to PDF",
			category: "Section to PDF",
			process: "Preparing to export PDF document",
		},
	},
	account: "Account",
	add: "Add",
	apply: "Apply",
	article2: "Article",
	article3: "article",
	article4: "articles",
	branch: "Branch",
	branches: "Branches",
	cancel: "Cancel",
	category2: "section",
	category3: "section",
	checking: "Checking",
	close: "Close",
	collapse: "Collapse",
	command: "Command",
	comment: "Comment",
	"comment-on": "Comment",
	company: "Internal documentation",
	configure: "Edit",
	confirm: "Confirm",
	continue: "Continue",
	copied: "Copied",
	copy: "Copy",
	count: "count",
	creating: "Creating",
	current: "English",
	delete: "Delete",
	description: "Description",
	edit2: "Edit",
	actions: "Actions",
	edit: "Edit",
	editing: "Editing",
	element: "Element",
	"enter-value": "Enter value",
	error: "Error",
	existing: "existing",
	exit: "Exit",
	expand: "Expand",
	field: "Field",
	file: "File",
	find: "Search",
	find2: "Find",
	replace: "Replace",
	replaceAll: "Replace all",
	caseSensitive: "Case sensitive",
	wholeWord: "Whole word",
	filter: "Filter",
	fn: "Functional blocks",
	formula: "Formulas",
	group2: "groups",
	group: "Group",
	healthcheck: "Error check",
	"check-errors": "Check for errors",
	hide: "Hide",
	icon: "Icon",
	image: "Image",
	in: "in",
	interface: "Interface",
	invalid2: "Invalid",
	invalid: "Invalid",
	link2: "Link",
	link: "Link",
	clickToViewDetails: "Click to view details",
	load: "Load",
	loading2: "Loading...",
	loading: "Loading...",
	loadWait: "Waiting for download",
	local: "Local branch",
	mail: "Email",
	more: "More",
	"read-more": "Read more..",
	name: "Name",
	ok: "Okay",
	open: "Open",
	"open-in-new-window": "Open in new window",
	other: "Other",
	page: "Page",
	products: "Products and services",
	projects: "Projects",
	pull: "Pull",
	refresh: "Refresh",
	remote: "Published",
	repository2: "repository",
	repository: "Repository",
	resolve: " Resolved ",
	save: "Save",
	see: "See",
	select: "Select",
	send: "Send",
	signature: "Caption",
	snippet: "Snippet",
	source2: "Source",
	source: "Source",
	space: "Section",
	storage2: "storage",
	storage: "Storage",
	strike: "Strikethrough",
	style: "Style",
	switch: "Switch",
	sync: "Synchronize",
	synchronization: "Synchronizing...",
	theme: "Theme",
	title: "Title",
	token: "token",
	type: "Type",
	unresolve: "Unresolved",
	user: "User",
	value: "value",
	values: "pcs",
	version: "Version",
	warning: "Warning",
	who: "Who",
	forward: "Forward",
	backward: "Backward",
	"add-account": "Add account",
	"add-annotation": "Add annotation",
	"add-new-branch": "Add new branch",
	"add-new-snippet": "Add new snippet",
	"add-new-source": "Add new source",
	"add-new-storage": "Add new storage",
	"add-square": "Add square",
	"add-storage": "Add storage",
	"add-to-continue-downloading": "Add it to continue downloading.",
	"add-value": "Add value",
	"admin-login": "Login",
	"admin-password": "Password",
	"admin-username": "Username",
	"after-merge": "After merging",
	"all-groups": "All groups",
	"and-sync-catalog": "And synchronize changes?",
	"annotation-text": "Annotation text",
	"article-titles": "Article titles",
	"authorization-by-mail": "Authorization by email",
	"bottom-left-pointer": "Bottom left annotation",
	"bottom-right-pointer": "Bottom right annotation",
	"branch-name-already-exists": "A branch with this name already exists",
	"branch-name-can-not-be-reserved-names": "Branch name cannot match reserved names HEAD",
	"branch-name-can-not-have-dot-and-slash-at-end-and-contain-sequences-of-slashes":
		"Branch name cannot end with '/' or '.', and contain sequences of '//' ",
	"branch-name-can-not-have-dots-sequence-and-leading-dot":
		"Branch name cannot start with a dot or contain a sequence of double dots '..'",
	"branch-name-can-not-have-encoding-symbols":
		'Branch name cannot contain special characters such as space, *, ?, [], ~, :, ", <, >, |, ^, \\',
	"branch-name-can-not-have-existing-prefix-branch": "Branch name cannot contain a prefix like an existing branch",
	"branch-name-not-end-with-lock": "Branch name cannot end with '.lock'",
	"branches-are-updated": "Branches updated",
	"by-azure": "By Azure",
	"by-mail": "By email",
	"cancel-crop": "Cancel crop",
	"space-name-min-length": "The space name must contain at least 2 characters",
	"repository-name-min-length": "The repository name must contain at least 2 characters",
	"directory-name-min-length": "The directory name must contain at least 2 characters",
	"cant-be-same-name": "The name must be unique",
	"cant-be-same-path": "The path must be unique",
	"cant-edit-this-line": "Cannot edit this line",
	"cant-get-snippet-data": "Check if the path is correct and if the snippet file is in the repository",
	"catalog-icons-title": "Catalog icons",
	"change-and-sync": "Change and synchronize",
	"check-diagrams": "Diagrams",
	"check-file-path": "Check if the file path is correct",
	"check-fs": "File Structure",
	"check-icons": "Icons",
	"check-images": "Images",
	"check-links": "Links",
	"check-unsupported": "Unsupported elements",
	"check-content": "Articles",
	"choose-header": "Choose header",
	"clarifying-tags": "Clarifying tags",
	"click-to-copy": "Click to copy",
	"clone-branch-not-found":
		"This can happen in two cases: the branch was deleted or created but not published. Request a new link.",
	"clone-error-desc1": "Check if the repository exists",
	"clone-error-desc2": "Also, make sure you have the rights to edit it.",
	"clone-fail": "Failed to load catalog",
	"close-comment": "Close comment",
	"exit-edit-mode": "Are you sure you want to exit edit mode?",
	"close-with-changes": "Are you sure you want to close the image editing window? Unsaved changes will be lost.",
	"comments-to-article": "Comment to article",
	"commit-message": "Comment",
	"confirm-answer-delete": "Delete comment?",
	"confirm-article-delete": "Delete the entire article?",
	"confirm-category-delete": "Delete the entire section?",
	"confirm-comment-delete": "Delete the entire discussion thread?",
	"confirm-create-catalog-on-clone":
		"Gramax will create a docs folder in the repository and add system catalog files to it. Then you can start working.",
	"confirm-create-catalog-on-clone-header": "No catalog in the repository. Create?",
	"connect-storage": "Connect storage",
	"connect-storage-to-leave-comment": "Connect storage to leave a comment",
	"continue-confirm": "Are you sure you want to continue?",
	"continue-locally": "Continue locally",
	"create-files-to-edit-markdown": "Add an article to edit",
	"create-new2": "Create catalog",
	"created-in-gramax": "Created in Gramax",
	"crop-image": "Crop image",
	"current-branch": "Displayed branch",
	"current-version": "Current version",
	"danger-text": "Error",
	"delete-answer": "Delete answer",
	"delete-as-resolved": "Delete as resolved",
	"delete-branch": "Delete branch",
	"delete-file": "Delete file",
	"delete-local-catalog": "This catalog is stored only in the app. You will not be able to restore it.",
	"delete-snippet-confirm": "Are you sure you want to delete the snippet?",
	"delete-snippet-confirm-not-use": "This snippet is not used in any articles",
	"delete-snippet-desc": "You are about to delete a snippet that is currently used in one or more articles",
	"delete-snippet-warn":
		"After deleting the snippet, articles where it was used will display errors instead of the removed snippet",
	"delete-storage-catalog": "The catalog will be deleted only from the app. But you can reload it from storage.",
	"deleting-snippet-in-use": "Deleting snippet in use",
	"desktop-settings.target-directory-description": "Folder on the local disk where catalogs for editing are located",
	"display-on-homepage": "Display on homepage",
	"dont-save": "Don't save",
	"edit-on": "Edit in",
	"empty-field": "Empty field",
	"enter-branch-name": "Enter branch name",
	"enter-snippet-text": "Enter snippet text",
	"error-expand": "Show details",
	"error-mail": "The email provided is incorrect.",
	"error-sing-in": "Ошибка входа",
	"error-occured": "An error occurred while displaying the documentation.",
	"export-disabled": "Add an article to export",
	"file-content": "File content",
	"file-download-error-message": "It may have been moved or deleted.",
	"file-download-error-title": "Failed to download file",
	"find-branch": "Search branch",
	"for-certain-users": "For certain users",
	"foreign-key": "Foreign key FK",
	"generate-link": "Generate link",
	"git-pull": "Git pull",
	"git-status": "Git status",
	"go-to-article": "Go to article",
	"go-to": "Go to",
	"icon-cone": "Icon code",
	"img-h": "Vertical image groups",
	"img-v": "Horizontal image groups",
	"in-article": "In the article",
	"in-branch": "To branch",
	"in-the-right-panel": "in the right panel",
	"incorrects-icons": "Incorrect icons",
	"incorrects-paths": "Incorrect paths",
	"incorrects-unsupported": "Elements",
	"incorrects-content": "Incorrect syntax",
	"markdown-error": "Incorrect markdown",
	"info-text": "Information",
	"init-git-version-control": "Initialize Git",
	"invalid-index": "Index does not meet the requirements!",
	"invalid-credentials-title": "Failed to connect",
	"invalid-credentials-text": "Please check the accuracy of the entered information.",
	"lab-text": "Note",
	"leads-to-the-branch": "You are following a link that leads to a different branch.",
	"leave-comment": "Leave a comment",
	"leave-file": "Keep file",
	"link-end-date": "Specify link expiration date",
	"mail-or-group": "Email or Group",
	"max-length": "Max characters - ",
	"move-sidebar-down": "Move panel down",
	"must-be-not-empty": "This field cannot be empty.",
	"no-access-to-storage": "No access to storage",
	"no-branch-found": "No branches found",
	"no-encoding-symbols-in-url": "URL can only contain Latin letters, numbers, and the symbols '-', '_'",
	"no-headers": "(No headers)",
	"no-schemas-block": "Do not display “Schemas” block",
	"no-such-function": "No such function!",
	"not-found": "Not found",
	"not-found2": "Not found",
	"note-text": "Warning",
	"numbero-of-unsolved-comments": "Number of unresolved comments",
	"on-the-same-version": "Is on the same version as this branch",
	"open-api": "OpenAPI",
	OpenApi: "OpenAPI",
	Html: "HTML",
	"Img-v": "Vertical group of images",
	"Img-h": "Horizontal group of images",
	Formula: "Formula",
	Icon: "Icon",
	Snippet: "Snippet",
	View: "View",
	"other-version": "Other version",
	"publish-changes": "Publish changes",
	"quote-text": "Quote",
	"remove-link": "Remove link",
	"repository-https-url": "Repository HTTPS URL",
	"repository-ssh-url": "Repository SSH URL",
	"required-parameter": "Required parameter",
	"resolve-conflict": "Resolve conflict",
	"return-sidebar": "Return panel",
	"save-and-exit": "Save and exit",
	"save-article-in": "Save article in",
	"save-changes": "Save changes",
	"schemas-block": "Display “Schemas” block",
	"select-all": "Select all",
	"select-or-add-new": "Select or add new",
	"share-access-token-not-installed": "Share Access Token not installed",
	"show-comment": "Show comment",
	"show-comments": "Comments",
	"show-diffs": "Changes",
	"sing-in": "Sign in",
	"sing-out": "Sign out",
	"snippet-already-exists": "A snippet with this id already exists",
	"snippet-render-error": "Failed to render snippet",
	"so-far-its-empty": "It's empty so far",
	"storage-not-connected": "Storage not connected",
	"submit-login-link": "Send login link",
	"switch-branch": "Switch branch",
	"sync-catalog": "Synchronize changes?",
	"sync-catalog-changed1": "file available for synchronization",
	"sync-catalog-changed2": "files available for synchronization",
	"sync-catalog-changed3": "files available for synchronization",
	"sync-catalog-desc": "The catalog version is outdated. Synchronize to get changes.",
	"sync-logs": "Synchronize logs",
	"sync-something-changed": "Something has changed in the repository, but the catalog is still up-to-date",
	"system-icons-title": "System icons",
	"takes-to-more-current-version": "Leads to a more current catalog version",
	"technical-details": "Technical Details",
	"tip-text": "Tip",
	"to-branch": "To branch",
	"to-navigate": "Navigation",
	click: "Click",
	"to-make-changes": "to make changes",
	"today-at": "Today at ",
	"top-left-pointer": "Top left annotation",
	"top-right-pointer": "Top right annotation",
	"unable-to-get-sync-count": "Unable to retrieve changes",
	"unsaved-changes": "Save changes?",
	"unsupported-elements-title": "Unsupported elements",
	"unsupported-elements-warning1":
		"DOCX does not support some elements of Gramax. The file will be saved without them.",
	"unsupported-elements-warning1-pdf":
		"PDF does not support some elements of Gramax. The file will be saved without them.",
	"unsupported-elements-warning2": "List of articles with unsupported elements",
	"update-branches": "Update branches list",
	"users-group": "Which group to give permissions",
	"view-usage": "View usage",
	"without-group": "Without group",
	"working-directory": "Working directory",
	"yesterday-at": "Yesterday at ",
	"your-branch": "Your branch",
	"edit-html": "Edit HTML",
	"do-not-show-again": "Do not show again",
	properties: {
		name: "Properties",
		all: "All",
		empty: "(empty)",
		"delete-property-confirm":
			"Are you sure you want to delete this property? It will be removed from all articles.",
		"select-all": "(select all)",
		"validation-errors": {
			"all-parameters-added": "All parameters added",
			"prop-creator": "Property with this name already exists or name is too short",
			"no-groupby": "Select a field for grouping",
			"no-defs": "Select at least one field for filtering",
			"no-content": "For selected fields, there are no items in the catalog",
		},
		system: {
			hierarchy: {
				name: "Hierarchy",
				values: {
					"child-to-current": "Child to current article",
				},
			},
		},
		warning: {
			"delete-tag-from-catalog": {
				title: "Confirm Property Deletion",
				body: "Are you sure you want to delete this property? It will be removed from all articles.",
			},
			"delete-value-from-catalog": {
				title: "Confirm Value Deletion",
				body: "Are you sure you want to delete this value? It will be removed from all articles.",
			},
		},
		view: {
			name: "View",
			"group-by": "Group by",
			"order-by": "Order by",
			filter: "Filter",
			select: "Select",
			displays: {
				name: "View",
				list: "List",
				table: "Table",
				kanban: "Kanban",
			},
		},
		types: {
			Numeric: "Number",
			Flag: "Flag",
			Date: "Date",
			Enum: "One from the list",
			Many: "Several from the list",
			Text: "Text",
			Array: "Array",
			BlockMd: "Block of text",
			InlineMd: "Inline Markdown",
		},
		selected: "Selected",
		"not-selected": "Not selected",
		article: "Article",
		archive: "Archive",
		"update-affected-articles": "articles will be affected",
		"add-property": "Add property",
		"no-values": "No values",
	},
	"create-new": "Create new",
	manage: "Manage",
	change: "Change",
	"enter-number": "Enter number",
	"enter-text": "Enter text",
	reset: "Reset",
	model: "Model",
	"goto-original": "Go to original",
	"select-table": "Select table",
	"no-date": "No date",
	inbox: {
		placeholders: {
			title: "Note title",
			content: "Note content",
		},
		notes: "Notes",
		"new-note": "New note",
		"no-catalog-notes": "No notes in the current catalog",
		"search-placeholder": "Search author...",
		"no-user-with-this-name": "Author not found",
	},
	"article-url": {
		title: "Article URL",
		description:
			"Customizable part of the link to your article. You can use Latin letters, numbers, and the symbols '-' and '_'",
	},
	template: {
		name: "Templates",
		placeholders: {
			title: "Template title",
			content: "Template content",
		},
		"new-template": "New template",
		"no-templates": "No templates in the current catalog",
		warning: {
			content: {
				name: "Insert template {{template}} into article?",
				body: "The article text will be replaced with the template. If you do not want to lose it — cancel the insertion and move the text to another article.",
			},
		},
		"choose-template": "Choose template",
		"select-property": "Select property",
	},
	clear: "Clear",
	yes: "Yes",
	no: "No",
	placeholder: "Placeholder",
	snippets: "Snippets",
	"new-snippet": "New snippet",
	"no-snippets": "No snippets in the current catalog",
	"snippet-no-usages": "Snippet is not used in any articles",
	ai: {
		"ai-prompts": "AI Prompts",
		"ask-ai": "Ask AI anything",
		generating: "Generating...",
		transcribe: {
			name: "Transcription",
			description: "Recognize speech from a media file",
			click: "Click to record",
			access: "Click to request access to the microphone",
			"browser-denied": "Microphone access is denied. Allow access in browser settings",
			"system-denied": "Microphone access is denied. Allow access in system settings",
			loading: "Checking microphone access...",
			notSupported: "Your browser does not support microphone access",
			recording: "Recording",
			reset: "Click to reset recorded audio",
			pause: "Click to pause",
			resume: "Click to resume",
			warningHomeSend: "You can't save audio from the home page",
			modal: "<p>After transcription, the recognized text will appear.</p><p>You can edit the text to improve its quality. To do this, click on the input field and edit it.</p>",
			"limit-reached":
				"The limit of 5 minutes has been reached. You can continue recording after saving the current audio.",
			history: "Audio history",
			modalAttention:
				"<p><strong>Attention!</strong> The recognized text is not saved anywhere. If you want to save it, you can copy it to the clipboard.</p>",
		},
		transcribtion: "Transcribtion...",
		placeholder: {
			prettify: "What to do with the selected text ✨",
			generate: "Write something beautiful ✨",
		},
		warning: {
			"generate-many-selection": "You can only work with the selected text through the popup editor",
		},
		prompt: {
			placeholder: {
				title: "Prompt title",
				content: "Prompt content",
			},
			"new-prompt": "New prompt",
			"no-prompts": "No prompts in the current catalog",
		},
	},
	"mark-as-read": "Mark as read",
	"mark-as-read-popover": "Great, you can move on to the next article!",
	"already-read": "Read",
	"add-favorite": "Add to favorites",
	"remove-favorite": "Remove from favorites",
	favorites: "Favorites",
	home: "Home",
	"groups-and-projects": "Groups and projects",
	"no-favorites-in-catalog": "No favorites article in the current catalog",
	"favorites-articles": "Favorites articles",
	"inline-to-block-image": "Inline to block image",
	"block-to-inline-image": "Block to inline image",
	"save-file": "Save file",
	"confirm-inbox-note-delete": "Are you sure you want to delete this note?",
	"confirm-prompts-delete": "Are you sure you want to delete this prompt?",
	"confirm-templates-delete": "Are you sure you want to delete this template?",
};

export default locale;
