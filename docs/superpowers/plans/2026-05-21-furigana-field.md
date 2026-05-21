# Furigana Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `furigana` field to the resume basics section that renders as small phonetic text above the name in the live preview and all PDF templates.

**Architecture:** Add `furigana: z.string().default("")` to `basicsSchema`, wire up a form field in the basics editor, and create a shared `NameWithFurigana` component in `packages/pdf/src/templates/shared/` that each of the 15 templates delegates to with a one-line swap.

**Tech Stack:** Zod (schema), TanStack Form (editor), React PDF / `@react-pdf/renderer` (PDF templates), Vitest (tests), TypeScript / `tsgo` (typecheck).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `packages/schema/src/resume/data.ts:85-93` |
| Modify | `packages/schema/src/resume/default.ts:16-24` |
| Modify (tests) | `packages/schema/src/resume/data.test.ts` |
| Modify | `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/basics.tsx:53` |
| Create | `packages/pdf/src/templates/shared/name-with-furigana.tsx` |
| Modify | `packages/pdf/src/templates/azurill/AzurillPage.tsx:20,100` |
| Modify | `packages/pdf/src/templates/bronzor/BronzorPage.tsx:14,97` |
| Modify | `packages/pdf/src/templates/chikorita/ChikoritaPage.tsx:14,103` |
| Modify | `packages/pdf/src/templates/ditgar/DitgarPage.tsx:15,114` |
| Modify | `packages/pdf/src/templates/ditto/DittoPage.tsx:14,104` |
| Modify | `packages/pdf/src/templates/gengar/GengarPage.tsx:15,111` |
| Modify | `packages/pdf/src/templates/glalie/GlaliePage.tsx:14,103` |
| Modify | `packages/pdf/src/templates/kakuna/KakunaPage.tsx:14,80` |
| Modify | `packages/pdf/src/templates/lapras/LaprasPage.tsx:14,79` |
| Modify | `packages/pdf/src/templates/leafish/LeafishPage.tsx:14,93` |
| Modify | `packages/pdf/src/templates/meowth/MeowthPage.tsx:14,82` |
| Modify | `packages/pdf/src/templates/onyx/OnyxPage.tsx:14,79` |
| Modify | `packages/pdf/src/templates/pikachu/PikachuPage.tsx:14,105` |
| Modify | `packages/pdf/src/templates/rhyhorn/RhyhornPage.tsx:15,131` |
| Modify | `packages/pdf/src/templates/scizor/ScizorPage.tsx:14,70` |

---

### Task 1: Add `furigana` to the schema and default data

**Files:**
- Modify: `packages/schema/src/resume/data.ts:85-93`
- Modify: `packages/schema/src/resume/default.ts:16-24`
- Modify (tests): `packages/schema/src/resume/data.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the `describe("basicsSchema", ...)` block in `packages/schema/src/resume/data.test.ts`:

```ts
it("defaults furigana to empty string when field is absent", () => {
  const result = basicsSchema.safeParse(defaultResumeData.basics);
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.furigana).toBe("");
});

it("accepts a non-empty furigana string", () => {
  const result = basicsSchema.safeParse({
    ...defaultResumeData.basics,
    furigana: "やまだ たろう",
  });
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.furigana).toBe("やまだ たろう");
});

it("defaults furigana to empty string when field is missing from input", () => {
  const withoutFurigana = { ...defaultResumeData.basics };
  // @ts-expect-error intentionally testing parse-time default
  delete withoutFurigana.furigana;
  const result = basicsSchema.safeParse(withoutFurigana);
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.furigana).toBe("");
});
```

- [ ] **Step 2: Run the tests — expect them to fail**

```bash
pnpm --filter @reactive-resume/schema test -- src/resume/data.test.ts
```

Expected: FAIL — `result.data.furigana` is `undefined` because the field doesn't exist yet.

- [ ] **Step 3: Add the `furigana` field to `basicsSchema`**

In `packages/schema/src/resume/data.ts`, add `furigana` as the second line in `basicsSchema` (after `name`):

```ts
export const basicsSchema = z.object({
	name: z.string().describe("The full name of the author of the resume."),
	furigana: z.string().default("").describe("Furigana (phonetic reading) for the author's name, displayed above the name in smaller text."),
	headline: z.string().describe("The headline of the author of the resume."),
	email: z.string().describe("The email address of the author of the resume."),
	phone: z.string().describe("The phone number of the author of the resume."),
	location: z.string().describe("The location of the author of the resume."),
	website: websiteSchema.describe("The website of the author of the resume."),
	customFields: z.array(customFieldSchema).describe("The custom fields to display on the resume."),
});
```

- [ ] **Step 4: Add `furigana` to `defaultResumeData.basics`**

In `packages/schema/src/resume/default.ts`, update the `basics` object:

```ts
basics: {
  name: "",
  furigana: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: { url: "", label: "" },
  customFields: [],
},
```

- [ ] **Step 5: Run the tests — expect them to pass**

```bash
pnpm --filter @reactive-resume/schema test -- src/resume/data.test.ts
```

Expected: PASS — all three new tests green, existing tests unaffected.

- [ ] **Step 6: Run typecheck for the schema package**

```bash
pnpm --filter @reactive-resume/schema typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/schema/src/resume/data.ts packages/schema/src/resume/default.ts packages/schema/src/resume/data.test.ts
git commit -m "feat(schema): add furigana field to basicsSchema"
```

---

### Task 2: Add the furigana input to the editor form

**Files:**
- Modify: `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/basics.tsx:53`

- [ ] **Step 1: Insert the furigana `form.Field` before the name field**

In `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/basics.tsx`, insert the following block immediately before the existing `<form.Field name="name">` block (currently at line 53):

```tsx
<form.Field name="furigana">
  {(field) => (
    <FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
      <FormLabel>
        <Trans>Furigana</Trans>
      </FormLabel>
      <FormControl
        render={
          <Input
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => {
              field.handleChange(e.target.value);
              void form.handleSubmit();
            }}
          />
        }
      />
      <FormMessage errors={field.state.meta.errors} />
    </FormItem>
  )}
</form.Field>
```

No new imports are needed — `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, and `Trans` are already imported.

- [ ] **Step 2: Run typecheck for the web app**

```bash
pnpm --filter web typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/routes/builder/\$resumeId/-sidebar/left/sections/basics.tsx"
git commit -m "feat(web): add furigana input to basics editor form"
```

---

### Task 3: Create the shared `NameWithFurigana` PDF component

**Files:**
- Create: `packages/pdf/src/templates/shared/name-with-furigana.tsx`

- [ ] **Step 1: Create the component file**

Create `packages/pdf/src/templates/shared/name-with-furigana.tsx` with the following content:

```tsx
import type { Style } from "@react-pdf/types";
import { View } from "../../renderer";
import { useRender } from "../../context";
import { Heading, Text } from "./primitives";

type Props = { nameStyle?: Style };

export const NameWithFurigana = ({ nameStyle }: Props) => {
	const { basics } = useRender();

	return (
		<View>
			{basics.furigana && (
				<Text style={{ fontSize: 9, letterSpacing: 1, opacity: 0.7 }}>{basics.furigana}</Text>
			)}
			<Heading style={nameStyle}>{basics.name}</Heading>
		</View>
	);
};
```

- [ ] **Step 2: Run typecheck for the pdf package**

```bash
pnpm --filter @reactive-resume/pdf typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/pdf/src/templates/shared/name-with-furigana.tsx
git commit -m "feat(pdf): add NameWithFurigana shared component"
```

---

### Task 4: Update templates batch 1 (azurill, bronzor, chikorita, ditgar, ditto)

**Files:**
- Modify: `packages/pdf/src/templates/azurill/AzurillPage.tsx:20,100`
- Modify: `packages/pdf/src/templates/bronzor/BronzorPage.tsx:14,97`
- Modify: `packages/pdf/src/templates/chikorita/ChikoritaPage.tsx:14,103`
- Modify: `packages/pdf/src/templates/ditgar/DitgarPage.tsx:15,114`
- Modify: `packages/pdf/src/templates/ditto/DittoPage.tsx:14,104`

For each template, make exactly two changes:

1. In the `import { Heading, ... } from "../shared/primitives";` line, add `NameWithFurigana` from the new shared file.
2. Replace `<Heading style={styles.headerName}>{basics.name}</Heading>` with `<NameWithFurigana nameStyle={styles.headerName} />`.

- [ ] **Step 1: Update `AzurillPage.tsx`**

Change line 20:
```tsx
// Before:
import { Heading, Icon, Link, Text } from "../shared/primitives";
// After — add a new import line below it:
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Change line 100:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 2: Update `BronzorPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 97:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 3: Update `ChikoritaPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 103:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 4: Update `DitgarPage.tsx`**

After line 15 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 114:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 5: Update `DittoPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 104:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 6: Run typecheck for the pdf package**

```bash
pnpm --filter @reactive-resume/pdf typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/pdf/src/templates/azurill/AzurillPage.tsx packages/pdf/src/templates/bronzor/BronzorPage.tsx packages/pdf/src/templates/chikorita/ChikoritaPage.tsx packages/pdf/src/templates/ditgar/DitgarPage.tsx packages/pdf/src/templates/ditto/DittoPage.tsx
git commit -m "feat(pdf): use NameWithFurigana in azurill, bronzor, chikorita, ditgar, ditto"
```

---

### Task 5: Update templates batch 2 (gengar, glalie, kakuna, lapras, leafish)

**Files:**
- Modify: `packages/pdf/src/templates/gengar/GengarPage.tsx:15,111`
- Modify: `packages/pdf/src/templates/glalie/GlaliePage.tsx:14,103`
- Modify: `packages/pdf/src/templates/kakuna/KakunaPage.tsx:14,80`
- Modify: `packages/pdf/src/templates/lapras/LaprasPage.tsx:14,79`
- Modify: `packages/pdf/src/templates/leafish/LeafishPage.tsx:14,93`

For each template, add the import and swap the name line. (Same two-change pattern as Task 4.)

- [ ] **Step 1: Update `GengarPage.tsx`**

After line 15 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 111:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 2: Update `GlaliePage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 103:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 3: Update `KakunaPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 80:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 4: Update `LaprasPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 79:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 5: Update `LeafishPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 93:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 6: Run typecheck for the pdf package**

```bash
pnpm --filter @reactive-resume/pdf typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/pdf/src/templates/gengar/GengarPage.tsx packages/pdf/src/templates/glalie/GlaliePage.tsx packages/pdf/src/templates/kakuna/KakunaPage.tsx packages/pdf/src/templates/lapras/LaprasPage.tsx packages/pdf/src/templates/leafish/LeafishPage.tsx
git commit -m "feat(pdf): use NameWithFurigana in gengar, glalie, kakuna, lapras, leafish"
```

---

### Task 6: Update templates batch 3 (meowth, onyx, pikachu, rhyhorn, scizor)

**Files:**
- Modify: `packages/pdf/src/templates/meowth/MeowthPage.tsx:14,82`
- Modify: `packages/pdf/src/templates/onyx/OnyxPage.tsx:14,79`
- Modify: `packages/pdf/src/templates/pikachu/PikachuPage.tsx:14,105`
- Modify: `packages/pdf/src/templates/rhyhorn/RhyhornPage.tsx:15,131`
- Modify: `packages/pdf/src/templates/scizor/ScizorPage.tsx:14,70`

- [ ] **Step 1: Update `MeowthPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 82:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 2: Update `OnyxPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 79:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 3: Update `PikachuPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 105:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 4: Update `RhyhornPage.tsx`**

After line 15 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 131:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 5: Update `ScizorPage.tsx`**

After line 14 (`import { Heading, Icon, Link, Text } from "../shared/primitives";`), add:
```tsx
import { NameWithFurigana } from "../shared/name-with-furigana";
```

Replace line 70:
```tsx
// Before:
<Heading style={styles.headerName}>{basics.name}</Heading>
// After:
<NameWithFurigana nameStyle={styles.headerName} />
```

- [ ] **Step 6: Run full pdf package typecheck and tests**

```bash
pnpm --filter @reactive-resume/pdf typecheck && pnpm --filter @reactive-resume/pdf test
```

Expected: no typecheck errors, all tests pass.

- [ ] **Step 7: Run full schema tests and boundary check**

```bash
pnpm --filter @reactive-resume/schema test && pnpm exec turbo boundaries
```

Expected: all tests pass, no boundary violations.

- [ ] **Step 8: Commit**

```bash
git add packages/pdf/src/templates/meowth/MeowthPage.tsx packages/pdf/src/templates/onyx/OnyxPage.tsx packages/pdf/src/templates/pikachu/PikachuPage.tsx packages/pdf/src/templates/rhyhorn/RhyhornPage.tsx packages/pdf/src/templates/scizor/ScizorPage.tsx
git commit -m "feat(pdf): use NameWithFurigana in meowth, onyx, pikachu, rhyhorn, scizor"
```
