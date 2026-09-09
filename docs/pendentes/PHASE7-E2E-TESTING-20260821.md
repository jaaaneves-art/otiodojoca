# 🚀 Phase 7: End-to-End Testing Checklist
**Date**: 21/08/2026 às 10:21  
**Status**: Ready to Begin

## Step 1️⃣: Insert Test Data (On Your Machine)

### Option A: Web Interface (Easiest)
```bash
# In your project directory:
# 1. Make sure dev server is running (npm run dev)
# 2. Open this file in your browser:
file:///home/berze/Nextcloud/Projectos/otiodojoca/seed-data.html
# 3. Click the button: 🚀 Inserir Dados de Teste
# 4. Wait for confirmation with IDs
```

### Option B: Terminal (Fast)
```bash
curl -X POST http://localhost:3001/api/seed
```

### Option C: Browser Console (Developer Tools)
```javascript
fetch('http://localhost:3001/api/seed', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log(data))
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "localizacaoId": 1,
    "alojamentoId": 1,
    "message": "Test data inserted successfully"
  }
}
```

---

## Step 2️⃣: Test Data Being Inserted

### 📍 Location
- **Name**: Lisboa
- **Country**: Portugal
- **Coordinates**: 38.7223°N, 9.1393°W

### 🏨 Accommodation
- **Name**: Hotel Tio do Joca
- **Type**: hotel
- **Price**: €85/night
- **Description**: Charming hotel in the heart of Lisbon

### 🍽️ Meals
1. **Pequeno almoço** - €12
2. **Almoço** - €18
3. **Jantar** - €22

---

## Step 3️⃣: Test Reservation Form

Once data is inserted, go to:
```
http://localhost:3001/alojamento/1
```

### Form Fields to Test
- [ ] Guest name (nome do hóspede)
- [ ] Email address
- [ ] Phone number
- [ ] Check-in date (data de entrada)
- [ ] Check-out date (data de saída)
- [ ] Number of rooms (número de quartos)
- [ ] Number of people (número de pessoas)
- [ ] Meal plan (tipo de refeição)
- [ ] Notes/Observations (observações)

---

## Step 4️⃣: Validations to Check

### Price Calculation ✅
- [ ] Base price: €85 × nights × rooms
- [ ] Meal additions: meal price × nights × people
- [ ] Total shows correctly

### Date Validation ✅
- [ ] Can't select dates in the past
- [ ] Check-out must be after check-in
- [ ] Can't select same date for entry and exit

### Availability Checking ✅
- [ ] First reservation succeeds
- [ ] Second reservation with overlapping dates fails
- [ ] Reservations with different dates succeed

### Form Submission ✅
- [ ] All required fields show validation errors if empty
- [ ] Email format validation works
- [ ] Phone format validation works
- [ ] "Fazer Reserva" button submits to API

---

## Step 5️⃣: Database Verification

Check Supabase Dashboard:

### Check Tables Have Data
```sql
-- Run these in Supabase SQL Editor
SELECT COUNT(*) as total FROM localizacoes;
SELECT COUNT(*) as total FROM alojamentos;
SELECT COUNT(*) as total FROM refeicoes_alojamento;
SELECT COUNT(*) as total FROM reservas;
```

### Verify Relationships
```sql
-- Check accommodation is linked to location
SELECT a.nome, l.nome as localizacao
FROM alojamentos a
JOIN localizacoes l ON a.localizacao_id = l.id;

-- Check meals are linked to accommodation
SELECT r.nome, a.nome as alojamento
FROM refeicoes_alojamento r
JOIN alojamentos a ON r.alojamento_id = a.id;
```

---

## Step 6️⃣: Edge Cases to Test

### Test Double-Booking Prevention
1. Make reservation: Aug 25-27, 1 room
2. Try to make reservation: Aug 26-28, 1 room → **Should Fail** ❌
3. Try to make reservation: Aug 28-30, 1 room → **Should Succeed** ✅

### Test Price Calculations
- [ ] 1 night, 1 room, no meal: €85
- [ ] 1 night, 2 rooms, no meal: €170
- [ ] 1 night, 1 room, breakfast: €85 + €12 = €97
- [ ] 2 nights, 2 rooms, lunch (1 person): €170 + €36 = €206
- [ ] 3 nights, 1 room, dinner (2 people): €255 + €132 = €387

### Test Reservations with Same Dates
- [ ] Multiple rooms same dates: Should allow if enough rooms
- [ ] Full capacity reached: Should block new reservations

---

## Step 7️⃣: Document Results

After testing, note:
- ✅ What works
- ⚠️ What needs fixing
- 🐛 Any bugs found
- 💡 Improvements needed

---

## 📋 Testing Complete When:

- [x] Test data inserted successfully
- [x] Accommodation page loads
- [x] Reservation form displays all fields
- [x] Price calculation is accurate
- [x] Date validation works
- [x] Form submission succeeds
- [x] Reservations saved to database
- [x] Availability checking prevents double-booking
- [x] All edge cases tested
- [x] No console errors in browser DevTools

---

**Phase 7 Status**: Ready to Start  
**Dev Server**: Should be running on http://localhost:3001  
**Test Data**: Ready to insert  
**Next**: Run tests and report findings
