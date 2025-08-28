# AIRPORT DEPARTURE/ARRIVAL BRIEFING TEMPLATE  

## Input Parameters  
- **Airport ICAO**: [XXXX]  
- **Operation**: [Departure / Arrival]  
- **Runway**: [XX]  
- **SID (if departure)**: [NAME or N/A]  
- **Destination**: [OPTIONAL - for passenger briefing]  

---

## Data Sources & Validation
- **Weather**: Live METAR (aviationweather.gov) – **must be <70 min old**  
- **If METAR is unavailable or older than 70 min, STOP and request wind, temp, and altimeter values from the user before proceeding**  
- **Runway info**: FAA Chart Supplement / Airport Diagram  
- **Performance**: SR22T 3600 lb JSON data from GitHub repository
  - **Primary source**: `https://github.com/Snergster/dep-brief/blob/main/sr22t_complete.json`
  - **Cache policy**: Download once per session, reuse cached data for subsequent briefings
  - **Fallback**: Check for local copy if GitHub unavailable, otherwise STOP with error

---

## Calculation Protocol (enforced)

### 0) Pre-flight Validation Checks
- ✅ **METAR age acceptable** (<70 minutes old)
- ✅ **Performance data accessible** (GitHub JSON or local fallback available)
- ✅ **Airport elevation confirmed** from official sources
- ✅ **All required inputs available** (wind, temp, altimeter, runway data)

### 1) Airport Field Elevation
- Always use the official **airport field elevation** from Chart Supplement
- **Cross-check** with airport diagram if elevation seems unusual
- Reported value: `Field elevation (used): [XXXX ft MSL]`  

### 2) Pressure Altitude (PA)
- Formula: `PA = field_elev_ft + (29.92 − altimeter_inHg) × 1000`  
- Rounding: nearest **10 ft**
- **Sanity check**: PA should typically be within ±2000 ft of field elevation

### 3) ISA Temperature at PA
- Formula: `ISA_PA_°C = 15 − 2 × (PA / 1000)`  
- Rounding: nearest **0.1 °C**

### 4) Density Altitude (DA)
- Formula: `DA = PA + 120 × (OAT_°C − ISA_PA_°C)`  
- **Cross‑check**: also compute `DA_alt = field_elev + 120 × (OAT − (15 − 2 × (field_elev/1000)))`
- **Validation**: If `|DA − DA_alt| > 150 ft`, **STOP** and re‑verify inputs  
- Rounding: nearest **50 ft**

### 5) Wind Components
- Inputs: runway magnetic heading **H**, wind direction **W** (magnetic), speed **S**  
- Angle: `θ = normalize(W − H)` to the range ±180°  
- Headwind: `HW = S × cos(θ)`; Tailwind if negative  
- Crosswind: `XW = S × sin(θ)`; report **Left/Right** by sign  
- Rounding: nearest **1 kt**

### 6) Takeoff & Landing Performance (SR22T 3600 lb)
- **Source of truth**: GitHub JSON file (`https://github.com/Snergster/dep-brief/blob/main/sr22t_complete.json`)
- **Data retrieval protocol**:
  1. **First attempt**: Fetch from GitHub repository
  2. **Cache**: Store JSON data in session for reuse
  3. **Fallback**: Check for local copy if GitHub unavailable
  4. **Error condition**: If neither source available, **STOP** with message: "Cannot access SR22T performance data from GitHub or local fallback"
- **Performance calculation**:
  - Interpolation: **bilinear** across **pressure altitude** and **temperature**
  - **No extrapolation**: If conditions are outside table bounds, **STOP** with message: 
    > "Pressure altitude/temperature outside POH performance data range. No calculation available - STOP"
  - Apply **only** corrections explicitly in the JSON; do **not** invent wind/grass/contamination factors
  - Output rounding: ground roll and 50‑ft distances to nearest **50 ft**

### 7) SID Climb Gradient (91 KIAS)
- Required gradient: take **ft/NM** directly from published SID procedure  
- Available gradient: use GitHub JSON **ft/NM** data with **bilinear interpolation**
- **Decision logic**: report **Meets / Does Not Meet**, plus margin in **ft/NM**
- **If insufficient performance**: output **"DO NOT DEPART: SID gradient not met"**

### 8) Abort Point & Safety Margins
- Default abort point: **50‑ft obstacle distance + 15% buffer**
- User can override if they specify different criteria
- **Minimum remaining runway** after abort point should be ≥500 ft

### 9) Final Validation & Error Handling
- **Cross-check all critical calculations** before proceeding to briefing
- **If any "STOP" condition is met, halt immediately** and request user input
- **Document any assumptions** or limitations in the briefing notes

---

## Error Handling Rules

### Weather Data Issues
- **METAR >70 min old**: STOP → Request: wind direction, wind speed, temperature, altimeter
- **METAR completely unavailable**: STOP → Request same manual inputs
- **Suspicious weather data**: Flag but continue with warning

### Performance Data Issues  
- **GitHub JSON unavailable AND no local fallback**: STOP → "Cannot access SR22T performance data from GitHub repository or local fallback copy"
- **GitHub available but JSON malformed**: STOP → "Performance data file corrupted or invalid format"
- **Conditions outside data bounds**: STOP → "Flight conditions outside aircraft performance envelope (PA: [X] ft, Temp: [X]°C)"
- **Interpolation seems unreasonable**: Flag and continue with warning

### Calculation Issues
- **Density altitude cross-check fails**: STOP → Re-verify all inputs
- **Performance margins negative**: Continue but highlight **"CAUTION: Minimal performance margin"**
- **SID gradient not met**: **"DO NOT DEPART"** + explain why

---

## Pilot Briefing  

### Airport & Runway  
- **Airport**: [ICAO] [NAME]  
- **Runway [XX]**: [LENGTH] ft x [WIDTH] ft  
- **Surface**: [TYPE/CONDITION]  
- **Elevation**: [XXXX] ft MSL  
- **Magnetic heading**: [XXX]°  

### Weather Conditions (METAR: [UTC TIME] - [XX] min old)
- **Field elevation (used)**: [XXXX ft MSL]  
- **Temperature**: [XX °C / XX °F]  
- **Altimeter**: [XX.XX inHg]  
- **Pressure altitude**: [XXXX ft]  
- **ISA at PA**: [XX.X °C]  
- **Density altitude**: [XXXX ft] ([+/-XXX ft vs PA])  
- **Wind**: [XXX° at XX kt]  
  - **Headwind**: [X kt] (or [X kt tailwind])  
  - **Crosswind**: [X kt from left/right]  

### Performance Analysis (3600 lb)  
**Takeoff Performance**  
- Ground roll: ~[XXXX ft]  
- Total distance over 50 ft: ~[XXXX ft]  
- Runway available: [XXXX ft]  
- **Margin**: [XXXX ft] ([XX%])  
- **Status**: [ADEQUATE / MARGINAL / INSUFFICIENT]

**Landing Performance (full flaps)**  
- Ground roll: ~[XXXX ft]  
- Total distance over 50 ft: ~[XXXX ft]  
- Runway available: [XXXX ft]  
- **Margin**: [XXXX ft] ([XX%])  
- **Status**: [ADEQUATE / MARGINAL / INSUFFICIENT]

### SID Climb Analysis (if departure + SID provided)  
**91 KIAS Takeoff Climb**
- Required gradient: [XXX ft/NM]  
- Available (SR22T @ conditions): [XXX ft/NM]  
- **Margin**: [+/-XX ft/NM]  
- **Result**: [✅ MEETS / ❌ DOES NOT MEET] requirement  

**Recommendation**: [Use SID as published / Consider alternative departure / DO NOT DEPART]

### Emergency Planning  
**Abort Procedures**
- Abort decision point: ~[XXXX ft] down runway  
- Remaining runway after abort: [XXXX ft]  

**CAPS Deployment Altitudes**  
- Immediate pull zone: [XXXX‑XXXX ft MSL]  
- Troubleshooting possible above: [XXXX ft MSL]  

**Local Considerations**  
- Terrain/obstacles: [Notes]  
- Emergency airport: [ICAO] ([XX nm], [heading])  
- Emergency frequency: [XXX.XX]

### Go/No-Go Decision
**✅ GO CONDITIONS MET:**
- [ ] Weather within limits
- [ ] Performance margins adequate  
- [ ] SID compliance verified (if applicable)
- [ ] Emergency procedures briefed

**❌ NO-GO CONDITIONS:**
- [ ] Insufficient takeoff/landing performance
- [ ] SID gradient not achievable  
- [ ] Weather below minimums
- [ ] Critical data unavailable

**⚠️ CAUTION ITEMS:**
- [ ] Minimal performance margins
- [ ] Crosswind near limits
- [ ] Density altitude high
- [ ] [Other specific concerns]

**FINAL DECISION**: [GO / NO-GO] with [brief reasoning]

---

## Quality Control Reminders

### Before Starting Each Briefing:
1. **Verify METAR timestamp** - must be <70 minutes old
2. **Confirm performance data access** - test GitHub JSON availability or local fallback
3. **Cross-check airport elevation** with multiple sources when possible
4. **Validate all user inputs** before calculations

### During Calculations:
1. **Perform density altitude cross-check** - two methods must agree within 150 ft
2. **Sanity check all results** - do the numbers make sense?
3. **Verify interpolation bounds** - never extrapolate performance data
4. **Document any assumptions** or limitations

### Before Delivery:
1. **Review Go/No-Go decision** - is it clearly supported by the data?
2. **Check passenger briefing completeness** - safety items covered?
3. **Verify emergency information accuracy** - altitudes, frequencies, airports
4. **Ensure briefing addresses specific conditions** - don't use generic language

---

## Technical Implementation Notes

### GitHub Data Retrieval
- **URL**: `https://github.com/Snergster/dep-brief/blob/main/sr22t_complete.json`
- **Method**: Use raw GitHub URL for direct JSON access: `https://raw.githubusercontent.com/Snergster/dep-brief/main/sr22t_complete.json`
- **Caching**: Store retrieved JSON in session variable to avoid multiple API calls
- **Validation**: Verify JSON structure matches expected schema before use
- **Error handling**: Graceful degradation to local fallback, then hard stop if neither available