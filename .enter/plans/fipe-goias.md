# Plan: Car Characteristics + Mobile Profile Fix

## Context
Three requests:
1. Add "passagem por leilão" and "sinistro" flags when creating/editing an ad
2. Add full car characteristics to the ad form (like OLX): vehicle type, engine power, doors, steering, optionals
3. Fix profile picture change not working on mobile (iOS Safari blocks programmatic click on `display: none` inputs)

---

## 1 — Mobile Profile Picture Fix (`ProfileEditDialog.tsx`)

**Root cause:** `fileInputRef.current?.click()` on a `className="hidden"` input (display:none) is blocked by iOS Safari.

**Fix:** Replace the button+ref approach with a `<label htmlFor="avatar-file-input">` wrapping both the avatar circle and the camera button. Use `className="sr-only"` on the input (visually hidden but accessible + clickable via label on all mobile browsers).

```tsx
<label htmlFor="avatar-file-input" className="relative cursor-pointer">
  {/* avatar circle */}
  {/* camera button overlay */}
</label>
<input id="avatar-file-input" type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />
```

---

## 2 — New DB Columns (Migration)

Add to `cars` table:
```sql
ALTER TABLE cars
  ADD COLUMN vehicle_type    text    NOT NULL DEFAULT '',
  ADD COLUMN engine_power    text    NOT NULL DEFAULT '',
  ADD COLUMN doors           integer NOT NULL DEFAULT 0,
  ADD COLUMN steering        text    NOT NULL DEFAULT '',
  ADD COLUMN optionals       text[]  NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN auction_history boolean NOT NULL DEFAULT false,
  ADD COLUMN sinistro        boolean NOT NULL DEFAULT false;
```

---

## 3 — `src/lib/types.ts` Updates

Add optional new fields to `Car` interface + new constants:
```typescript
VEHICLE_TYPES: ['Hatchback', 'Sedan', 'SUV', 'Picape', 'Utilitário/Van', 'Esportivo', 'Conversível', 'Minivan']
ENGINE_POWER_OPTIONS: ['1.0', '1.0 Turbo', '1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.4', '3.0', 'Outro']
STEERING_OPTIONS: ['Mecânica', 'Hidráulica', 'Elétrica', 'Eletro-hidráulica']
OPTIONALS_LIST: Ar-condicionado, Vidros elétricos, Trava elétrica, Sensor de estacionamento, Câmera de ré, Rodas de liga leve, Banco de couro, Multimídia/Tela, Bluetooth, GPS, Alarme, Air bag, Freio ABS, Teto solar, Piloto automático, etc.
```

---

## 4 — `src/pages/AdminCarForm.tsx` Updates

Add a **new card section "Características do Veículo"** between "Informações do Veículo" and "Contato":

### Row 1: Tipo de Veículo + Potência do Motor + Portas
- Select for vehicle_type (Hatchback, Sedan, SUV, etc.)
- Select for engine_power (1.0, 1.4, 2.0, etc.)  
- Select for doors (2 portas / 4 portas)

### Row 2: Direção
- Select for steering (Mecânica, Hidráulica, Elétrica, Eletro-hidráulica)

### Histórico do Veículo (red warning section)
- Checkbox toggle for `auction_history` — "Passagem por leilão"
- Checkbox toggle for `sinistro` — "Veículo com histórico de sinistro"
- Note: shown in orange/red warning style since it affects value

### Opcionais (multi-select grid of checkboxes)
- 4-column grid of Checkbox + Label for each optional
- Toggles item in/out of `optionals` array

Also update `defaultForm()` and `useEffect` for editing to include new fields.
Also update `handleSubmit` payload to include new fields.

---

## 5 — `src/pages/CarDetail.tsx` Updates

Expand the specs grid with new fields (only show if value is set):
- Vehicle type (Tipo)
- Engine power (Motor)
- Doors (Portas)
- Steering (Direção)

Add **"Histórico"** warning badges (only if true):
- Orange badge: "Passagem por leilão" with Gavel icon
- Red badge: "Histórico de sinistro" with AlertTriangle icon

Add **"Opcionais"** section below specs (only if array has items):
- Tag-style list of optionals with Check icon

---

## Files to Modify
- `src/components/ProfileEditDialog.tsx`
- `src/lib/types.ts`
- `src/pages/AdminCarForm.tsx`
- `src/pages/CarDetail.tsx`

## Migration Required
- Add 7 new columns to `cars` table

## Verification
1. Mobile: open profile dialog → tap camera button → photo picker opens on iOS/Android
2. Form: new section "Características" appears with all fields
3. Form: "Passagem por leilão" and "Sinistro" checkboxes in "Histórico" section
4. Form: optionals multi-select checkboxes grid
5. Detail page: new specs visible + optional badges for leilão/sinistro + optionals list
