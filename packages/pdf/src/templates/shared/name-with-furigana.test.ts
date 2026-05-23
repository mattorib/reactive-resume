import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("NameWithFurigana", () => {
	it("is exported from the shared module", () => {
		const source = readFileSync(fileURLToPath(new URL("./name-with-furigana.tsx", import.meta.url)), "utf8");

		expect(source).toContain("export const NameWithFurigana");
		expect(source).toContain('flexDirection: "column"');
	});
});
