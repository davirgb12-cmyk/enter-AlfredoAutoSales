# Plan: Profile Picture + FIPE Price on Cards

## Context
Two features requested:
1. **Foto de perfil** — the navbar avatar is currently just a letter initial. The user wants to upload a real photo via the dropdown menu.
2. **Preço FIPE nos cards** — the `FipeBadge compact` already exists at the bottom of each `CarCard` but is small and hidden. Move it directly below the selling price to make it prominent.

---

## Feature 1 — Profile Picture

### Storage Setup (Migration)
- Create Supabase Storage bucket `avatars` (public)
- Add RLS policy: authenticated users can insert/update `avatars/{user.id}/*`

### New Component: `ProfileEditDialog.tsx`
- A `Dialog` (shadcn) triggered by a menu item in the Navbar dropdown ("Editar Perfil")
- Contains:
  - Current avatar preview (circle with photo or initial)
  - File input button to upload photo (accepts `image/*`, max 2 MB)
  - Text input for **Nome de exibição** (`display_name`)
  - Save button
  - Upload flow: `supabase.storage.from('avatars').upload(path, file, { upsert: true })`
  - After upload → call `supabase.auth.updateUser({ data: { avatar_url: publicUrl, display_name: name } })`
  - Show loading state during save
  - Show success/error toast

### Navbar changes (`src/components/Navbar.tsx`)
- Read `user?.user_metadata?.avatar_url` and `user?.user_metadata?.display_name` for the avatar/name
- If avatar exists → show `<img>` in the avatar circle; otherwise fallback to letter initial
- Show `display_name` (or email) in the dropdown label
- Add "Editar Perfil" `DropdownMenuItem` (Camera + User icons) that opens `ProfileEditDialog`

---

## Feature 2 — Preço Popular nos Cards

O "Preço Popular" já é calculado na página de detalhe (FipeBadge full mode) como a faixa FIPE ±12% — o preço que as pessoas normalmente praticam no mercado.

### `src/components/FipeBadge.tsx` — novo modo `card`
- Adicionar prop `card?: boolean` ao FipeBadge
- No modo `card`, exibir a faixa "Preço Popular" (popLow a popHigh = FIPE ±12%) abaixo do preço de venda
- Layout:
  ```
  Preço popular: R$ 35.000 – R$ 45.000
  ```
- Texto pequeno e muted, sem bordas pesadas, discreto mas visível

### `src/components/CarCard.tsx`
- Substituir `<FipeBadge compact .../>` por `<FipeBadge card .../>` 
- Posicionar logo abaixo do preço de venda (antes dos specs)
- Adicionar também um badge de comparação (acima/abaixo/na média) para indicar se o preço anunciado está dentro da faixa popular

---

## Files to Modify
- `src/components/Navbar.tsx` — avatar display + new menu item
- `src/components/CarCard.tsx` — move FipeBadge position
- `src/components/FipeBadge.tsx` — update compact mode styling

## Files to Create
- `src/components/ProfileEditDialog.tsx` — combined photo + name edit dialog

## Migration Required
- Create `avatars` storage bucket + RLS policies

---

## Verification
1. Login → open navbar dropdown → "Alterar foto de perfil" appears
2. Upload an image → avatar updates in navbar immediately
3. Reload page → avatar persists (stored in user metadata)
4. On home page listing → each card shows FIPE price clearly below the selling price
5. Compact FIPE badge shows the comparison badge correctly
