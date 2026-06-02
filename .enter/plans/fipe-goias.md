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

### New Component: `AvatarUploadDialog.tsx`
- A `Dialog` (shadcn) triggered by a menu item in the Navbar dropdown
- Contains:
  - Current avatar preview (circle with photo or initial)
  - File input button (accepts `image/*`, max 2 MB)
  - Upload flow: `supabase.storage.from('avatars').upload(path, file, { upsert: true })`
  - After upload → call `supabase.auth.updateUser({ data: { avatar_url: publicUrl } })`
  - Show loading state during upload
  - Show success/error toast

### Navbar changes (`src/components/Navbar.tsx`)
- Read `user?.user_metadata?.avatar_url` for the avatar
- If it exists → show `<img>` in the avatar circle (both in button trigger and dropdown label)
- If not → fallback to the current letter initial
- Add "Alterar foto de perfil" `DropdownMenuItem` that opens the `AvatarUploadDialog`
- Import `Camera` icon from lucide-react for the menu item

---

## Feature 2 — FIPE Price Prominently on Cards

### `src/components/CarCard.tsx`
- Move `<FipeBadge compact .../>` from the bottom of the card **to right below the selling price** (between price and specs row)
- Remove the bottom border separator in compact mode since it's now mid-card

### `src/components/FipeBadge.tsx` — compact mode update
- When `compact`, instead of a full-width row at the bottom, render a compact inline row:
  ```
  TABELA FIPE  R$ XX.XXX    [badge: X% abaixo]
  ```
- Use smaller, muted text for the FIPE label, cleaner layout

---

## Files to Modify
- `src/components/Navbar.tsx` — avatar display + new menu item
- `src/components/CarCard.tsx` — move FipeBadge position
- `src/components/FipeBadge.tsx` — update compact mode styling

## Files to Create
- `src/components/AvatarUploadDialog.tsx` — upload dialog component

## Migration Required
- Create `avatars` storage bucket + RLS policies

---

## Verification
1. Login → open navbar dropdown → "Alterar foto de perfil" appears
2. Upload an image → avatar updates in navbar immediately
3. Reload page → avatar persists (stored in user metadata)
4. On home page listing → each card shows FIPE price clearly below the selling price
5. Compact FIPE badge shows the comparison badge correctly
