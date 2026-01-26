# Airtable Formulas - Pounce Map

## Total_Score (0-100 Heat Score)

```javascript
IF({Deceased}, 45, 0) +
IF({Tax_Auction}, 35, 0) +
IF({Vacant}, 25, 0) +
IF({Distressed}, 15, 0) +
IF({Utility_Shutoff}, 10, 0) +
IF({D4D}, 10, 0) +
IF({Owner_Distance} > 75, 5, 0)
```

**Logic:**
- Deceased Owner: +45 points (highest priority)
- Tax/Foreclosure Auction: +35 points
- Vacant Property: +25 points
- Distressed Condition: +15 points
- Utility Shutoff: +10 points
- D4D Tagged: +10 points
- Owner Distance >75 miles: +5 points

**Cap:** Display as "99+" if score exceeds 99

---

## Pin_Color (Visual Precedence)

```javascript
IF(
  AND(
    {Days_Until_Auction} <= 7,
    {Days_Until_Auction} >= 0,
    {Lead_Status} != "Sold",
    {Lead_Status} != "Dead"
  ),
  "flash",
  IF(
    AND(
      {Total_Score} >= 50,
      OR(
        BLANK({Phone}),
        BLANK({Mailing_Address})
      )
    ),
    "purple",
    IF(
      {Total_Score} >= 80,
      "red",
      IF(
        {Total_Score} >= 50,
        "orange",
        "blue"
      )
    )
  )
)
```

**Visual Rules (Top to Bottom - First Match Wins):**

1. 🔥 **FLASH** - Auction <7 days AND status is Active (overrides all)
2. 🟣 **PURPLE** - Score ≥50 AND missing phone OR mailing address (data gap)
3. 🔴 **RED** - Score ≥80 (hot lead)
4. 🟠 **ORANGE** - Score 50-79 (warm lead)
5. 🔵 **BLUE** - Score <50 (cold lead)

---

## Badge_Letter (Context Priority)

```javascript
IF({Tax_Auction}, "T",
  IF({Probate}, "H",
    IF({Vacant}, "V",
      IF({Distressed}, "D",
        IF({Utility_Shutoff}, "C",
          IF({Code_Violation}, "C", "")
        )
      )
    )
  )
)
```

**Priority Order:**
1. **T** - Tax/Foreclosure (highest)
2. **H** - Heir/Probate
3. **V** - Vacant
4. **D** - Distressed/D4D
5. **C** - Code Violation/Utility Shutoff

---

## Days_Until_Auction

```javascript
IF(
  {Auction_Date},
  DATETIME_DIFF({Auction_Date}, TODAY(), 'days'),
  ""
)
```

**Logic:**
- If Auction_Date exists, calculate days from today
- Returns blank if no auction date

---

## Data_Gap (Purple Pin Trigger)

```javascript
AND(
  {Total_Score} >= 50,
  OR(
    BLANK({Phone}),
    BLANK({Mailing_Address})
  )
)
```

**Logic:**
- TRUE if lead has high score (≥50) but missing critical contact info
- Used to trigger purple pins for "VA Fix-Me" tasks

---

## Display_Score (Capped at 99+)

```javascript
IF(
  {Total_Score} > 99,
  "99+",
  {Total_Score} & ""
)
```

**Logic:**
- If score exceeds 99, display "99+"
- Otherwise show actual score as text

---

## Notes

### Field Update Rules
- When Lead_Status changes to "Dead", GHL should also receive tag update
- Last_Note_Date should auto-populate when Field_Notes record is created
- Attempt_Count should increment when Note_Type = "Left Note"

### Performance Considerations
- Total_Score is calculated, not stored - no manual updates needed
- Pin_Color and Badge_Letter are deterministic - always consistent
- Formula complexity is acceptable for <10,000 records
