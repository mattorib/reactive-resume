# Furigana Field — Design Spec

**Date:** 2026-05-21
**Status:** Approved

## Summary

Add a `furigana` field to the resume basics section. When non-empty, it renders as small phonetic text above the name in the live preview and all PDF templates. The field is stored in the resume data model and edited via a plain text input in the editor sidebar.

---

## Data Model

**File:** `packages/schema/src/resume/data.ts`

Add to `basicsSchema`:

```ts
furigana: z.string().default("").describe(
  "Furigana (phonetic reading) for the author's name, displayed above the name in smaller text."
),
```

- Uses `.default("")` so existing resumes without the field deserialize cleanly.
- An empty string means "do not render" — no conditional schema required.

---

## Editor Form

**File:** `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/basics.tsx`

Add a `form.Field` for `furigana` placed directly **above** the existing `name` field. Pattern is identical to all other basics fields:

```tsx
<form.Field name="furigana">
  {(field) => (
    <FormItem>
      <FormLabel htmlFor="basics.furigana"><Trans>Furigana</Trans></FormLabel>
      <FormControl>
        <Input
          id="basics.furigana"
          value={field.state.value}
          onChange={(e) => { field.handleChange(e.target.value); void form.handleSubmit(); }}
          onBlur={() => void form.handleSubmit()}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
</form.Field>
```

Auto-saves on change and blur, consistent with all other basics fields.

---

## Shared PDF Component

**New file:** `packages/pdf/src/templates/shared/name-with-furigana.tsx`

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
        <Text style={{ fontSize: 9, letterSpacing: 1, opacity: 0.7 }}>
          {basics.furigana}
        </Text>
      )}
      <Heading style={nameStyle}>{basics.name}</Heading>
    </View>
  );
};
```

- Uses `Text` (not `Small`) to avoid inheriting template-specific "small" style overrides.
- `View` wrapper is layout-neutral; the existing outer `<View>` in each template remains unchanged.
- Furigana is conditionally rendered only when non-empty.

---

## Template Changes (15 templates)

Templates affected:
- azurill, bronzor, chikorita, ditgar, ditto, gengar, glalie, kakuna, lapras, leafish, meowth, onyx, pikachu, rhyhorn, scizor

In each template file, one import added and one line swapped:

```tsx
// Add import:
import { NameWithFurigana } from "../shared/name-with-furigana";

// Replace:
<Heading style={styles.headerName}>{basics.name}</Heading>

// With:
<NameWithFurigana nameStyle={styles.headerName} />
```

Where `basics` is no longer used after the swap, the destructure can be cleaned up — but only if no other usage remains in that template.

---

## Scope

- **In scope:** Schema field, editor input, PDF rendering, live preview (via PDF renderer).
- **Out of scope:** i18n translation of the "Furigana" label (can be added via Crowdin), DOCX export, MCP tools, OpenAPI schema.

---

## Success Criteria

1. A user can type furigana in the editor sidebar basics form.
2. When the furigana field is non-empty, small text appears above the name in all PDF templates.
3. When furigana is empty, all templates render identically to before.
4. Existing resumes without a `furigana` key deserialize without error (default `""`).
