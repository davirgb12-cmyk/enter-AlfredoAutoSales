# Plano: Tabela FIPE + Goiás Only

## Contexto
- Usuário quer exibir preço FIPE e comparação ("preço popular" como OLX) em cards e na página do carro.
- Usuário quer restringir o marketplace apenas a Goiás.

---

## 1. Hook `useFipePrice` — `src/hooks/useFipePrice.ts` (NOVO)

Usa a FIPE API pública (CORS habilitado): `https://parallelum.com.br/fipe/api/v2/cars`

Fluxo:
1. `GET /brands` → fuzzy-match com `car.brand`
2. `GET /brands/{code}/models` → fuzzy-match com `car.model`
3. `GET /brands/{code}/models/{code}/years` → match com `car.year`
4. `GET /brands/{code}/models/{code}/years/{code}` → retorna `{ price: "R$ 14.870,00", ... }`

Cache com React Query: `staleTime: 1h`, `retry: 1`.

Helper `parseFipePrice(str)` → número float para comparação.
Helper `fipeComparison(askingPrice, fipePrice)` → `{ diff, pct, label, color }`.

---

## 2. Componente `FipeBadge` — `src/components/FipeBadge.tsx` (NOVO)

Props: `brand`, `model`, `year`, `sellingPrice`, `compact?: boolean`

- **compact=true** (para CarCard): linha simples com ícone + "FIPE R$ X.XXX" + badge % acima/abaixo
- **compact=false** (para CarDetail): bloco expandido com preço FIPE, preço pedido, diferença e texto explicativo

Estados: loading skeleton, error silencioso (não exibe nada se não encontrar).

---

## 3. `src/components/CarCard.tsx` — adicionar `FipeBadge` compact

Entre o preço e a grid de specs, inserir `<FipeBadge compact brand={car.brand} model={car.model} year={car.year} sellingPrice={car.selling_price} />`.

---

## 4. `src/pages/CarDetail.tsx` — adicionar bloco FIPE completo

Após specs grid, antes da descrição, inserir `<FipeBadge brand={car.brand} model={car.model} year={car.year} sellingPrice={car.selling_price} />`.

---

## 5. Goiás Only

### `src/lib/types.ts`
- `APP_TAGLINE = 'Compre e venda carros em Goiás'`
- `APP_STATE = 'GO'` (constante única)

### `src/pages/AdminCarForm.tsx`
- Remover `<Select>` de estado; mostrar campo fixo "Goiás (GO)" como texto
- `seller_state` sempre `'GO'` no form default e no payload

### `src/pages/Index.tsx`
- Remover filtro de estado (`stateFilter`)
- Filtrar query para `seller_state = 'GO'` (ou manter all já que só haverá GO)
- Atualizar hero tagline

### `src/components/Footer.tsx` + `Navbar.tsx`
- Atualizar taglines para mencionar Goiás

---

## Arquivos modificados
- `src/hooks/useFipePrice.ts` — NOVO
- `src/components/FipeBadge.tsx` — NOVO
- `src/components/CarCard.tsx`
- `src/pages/CarDetail.tsx`
- `src/lib/types.ts`
- `src/pages/AdminCarForm.tsx`
- `src/pages/Index.tsx`
- `src/components/Footer.tsx`
- `src/components/Navbar.tsx`

---

## Verificação
1. Abrir qualquer card → deve aparecer "FIPE R$ X.XXX" abaixo do preço
2. Abrir página do carro → bloco expandido com preço FIPE + % acima/abaixo
3. Formulário de anúncio → estado fixo "Goiás (GO)", sem dropdown
4. Hero e footer mencionam Goiás
