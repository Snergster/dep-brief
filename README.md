# SR22T Performance Calculator

A comprehensive performance calculation system for the Cirrus SR22T aircraft at maximum gross weight (3600 lbs).

## Features

- **Accurate Performance Calculations**: Takeoff, landing, and climb performance based on official Cirrus POH data
- **Atmospheric Calculations**: Pressure altitude, density altitude, ISA temperature calculations
- **Wind Component Analysis**: Headwind and crosswind calculations for runway operations
- **SID Compliance Checking**: Verifies aircraft can meet published departure procedure climb gradients
- **Professional Briefing Templates**: Standardized pilot and passenger briefing formats
- **Data Validation**: Built-in error checking and validation for all inputs

## Files Structure

### Performance Data
- `sr22t_3600lb_all_performance_data.yaml` - Complete performance dataset (original format)
- `sr22t_briefing_performance_enhanced.yaml` - Essential data for routine briefings
- `sr22t_complete_performance_enhanced.yaml` - Enhanced complete dataset with metadata

### Code & Utilities
- `performance_calculator.js` - JavaScript utility functions for performance calculations
- `briefing_template.md` - Comprehensive briefing template with calculation protocols

## Usage

### Basic Performance Calculation
```javascript
const calculator = new SR22TPerformanceCalculator(yamlData);

// Calculate takeoff performance
const takeoffPerf = calculator.getTakeoffDistance(
    pressureAltitudeFt, 
    temperatureCelsius
);

// Calculate landing performance
const landingPerf = calculator.getLandingDistance(
    pressureAltitudeFt, 
    temperatureCelsius
);

// Calculate atmospheric conditions
const pressureAltitude = calculator.calculatePressureAltitude(fieldElevationFt, altimeterInHg);
const densityAltitude = calculator.calculateDensityAltitude(pressureAltitudeFt, oatCelsius);
const windComponents = calculator.calculateWindComponents(runwayHeading, windDirection, windSpeed);
```

### Briefing Generation
Use the provided briefing template to generate comprehensive departure/arrival briefings with:
- Atmospheric condition analysis
- Performance calculations with safety margins
- SID compliance verification
- Emergency procedure planning
- Passenger safety briefing

## Data Sources

- **Aircraft Performance**: Cirrus SR22T Pilot's Operating Handbook (POH)
- **Weight Configuration**: Maximum gross weight (3600 lbs)
- **Runway Condition**: Dry, hard surface
- **Weather Data**: Live METAR (must be <70 minutes old)

## Safety Features

- **Input Validation**: Ensures all parameters are within aircraft operational limits
- **Error Handling**: Stops calculations if critical data is missing or invalid
- **Cross-Validation**: Multiple calculation methods for density altitude verification
- **Conservative Margins**: Built-in safety factors for performance planning
- **No Extrapolation**: Will not calculate performance outside published data ranges

## Requirements

- Performance data must be within validated ranges:
  - Pressure Altitude: 0-25,000 ft (briefing version: 0-10,000 ft)
  - Temperature: -40°C to +50°C (briefing version: 0°C to 40°C)
- Weather data must be current (<70 minutes old)
- JavaScript environment for utility functions

## File Descriptions

| File | Purpose | Use Case |
|------|---------|----------|
| `sr22t_3600lb_all_performance_data.yaml` | Original complete dataset | Development, analysis, extreme conditions |
| `sr22t_briefing_performance_enhanced.yaml` | Routine briefing data | Daily operations, common conditions |
| `sr22t_complete_performance_enhanced.yaml` | Enhanced complete dataset | Advanced planning, full range operations |
| `performance_calculator.js` | Core calculation functions | Integration into applications |
| `briefing_template.md` | Standardized briefing format | Operational procedures |

## Contributing

This system is designed for safety-critical flight operations. All modifications should:
1. Maintain data integrity with official POH sources
2. Include comprehensive validation and error handling
3. Follow established aviation calculation standards
4. Be thoroughly tested before operational use

## Disclaimer

This tool is for flight planning assistance only. Pilots remain responsible for:
- Verifying all calculations independently
- Using current and official performance data
- Making final operational decisions based on conditions and experience
- Complying with all applicable regulations and procedures

Always cross-reference with official aircraft documentation and current weather information before flight operations.

## License

MIT License - See LICENSE file for details