export function getLanguageDisplayName(langCode: string): string {
	const languageNames: Record<string, string> = {
		en: "English",
		english: "English",
	};

	return languageNames[langCode] || langCode;
}
