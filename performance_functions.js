/**
 * SR22T Performance Data Utility Functions
 * Enhanced version with validation, interpolation, and error handling
 * 
 * Compatible with enhanced YAML structure
 */

class SR22TPerformanceCalculator {
    constructor(yamlData) {
        this.data = yamlData;
        this.metadata = yamlData.metadata;
        this.validation = yamlData.validation;
        this.interpolation = yamlData.interpolation;
        this.performanceData = yamlData.performance_data;
        
        // Validate the loaded data structure
        this.validateDataStructure();
    }

    /**
     * Validate that the loaded YAML data has the expected structure
     */
    validateDataStructure() {
        const requiredSections = ['metadata', 'validation', 'performance_data'];
        const requiredPerformanceSections = ['takeoff_distance', 'landing_distance', 'takeoff_climb_gradient'];
        
        for (const section of requiredSections) {
            if (!this.data[section]) {
                throw new Error(`Missing required section: ${section}`);
            }
        }
        
        for (const perfSection of requiredPerformanceSections) {
            if (!this.performanceData[perfSection]) {
                throw new Error(`Missing required performance section: ${perfSection}`);
            }
        }
    }

    /**
     * Calculate pressure altitude from field elevation and altimeter setting
     * @param {number} fieldElevationFt - Airport field elevation in feet
     * @param {number} altimeterInHg - Altimeter setting in inches of mercury
     * @returns {number} Pressure altitude in feet, rounded to nearest 10 ft
     */
    calculatePressureAltitude(fieldElevationFt, altimeterInHg) {
        const pressureAltitude = fieldElevationFt + (29.92 - altimeterInHg) * 1000;
        return Math.round(pressureAltitude / 10) * 10;
    }

    /**
     * Calculate ISA temperature at given pressure altitude
     * @param {number} pressureAltitudeFt - Pressure altitude in feet
     * @returns {number} ISA temperature in Celsius, rounded to nearest 0.1°C
     */
    calculateISATemperature(pressureAltitudeFt) {
        const isaTemp = 15 - 2 * (pressureAltitudeFt / 1000);
        return Math.round(isaTemp * 10) / 10;
    }

    /**
     * Calculate density altitude
     * @param {number} pressureAltitudeFt - Pressure altitude in feet
     * @param {number} oatCelsius - Outside air temperature in Celsius
     * @returns {number} Density altitude in feet, rounded to nearest 50 ft
     */
    calculateDensityAltitude(pressureAltitudeFt, oatCelsius) {
        const isaTemp = this.calculateISATemperature(pressureAltitudeFt);
        const densityAltitude = pressureAltitudeFt + 120 * (oatCelsius - isaTemp);
        return Math.round(densityAltitude / 50) * 50;
    }

    /**
     * Calculate wind components
     * @param {number} runwayHeading - Runway magnetic heading in degrees
     * @param {number} windDirection - Wind direction magnetic in degrees
     * @param {number} windSpeed - Wind speed in knots
     * @returns {Object} Wind components with headwind and crosswind
     */
    calculateWindComponents(runwayHeading, windDirection, windSpeed) {
        // Normalize angle to ±180°
        let angle = windDirection - runwayHeading;
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        
        const angleRad = angle * Math.PI / 180;
        const headwindComponent = Math.round(windSpeed * Math.cos(angleRad));
        const crosswindComponent = Math.round(Math.abs(windSpeed * Math.sin(angleRad)));
        const crosswindDirection = angle > 0 ? 'right' : 'left';
        
        return {
            headwind: headwindComponent, // positive = headwind, negative = tailwind
            crosswind: crosswindComponent,
            crosswindDirection: crosswindDirection,
            angle: Math.round(angle)
        };
    }

    /**
     * Validate inputs are within acceptable bounds
     * @param {number} pressureAltitudeFt - Pressure altitude in feet
     * @param {number} temperatureCelsius - Temperature in Celsius
     * @throws {Error} If inputs are out of bounds
     */
    validateInputs(pressureAltitudeFt, temperatureCelsius) {
        const [minPA, maxPA] = this.validation.pressure_altitude_range_ft;
        const [minTemp, maxTemp] = this.validation.temperature_range_celsius;
        
        if (pressureAltitudeFt < minPA || pressureAltitudeFt > maxPA) {
            throw new Error(`Pressure altitude ${pressureAltitudeFt} ft outside valid range [${minPA}, ${maxPA}] ft`);
        }
        
        if (temperatureCelsius < minTemp || temperatureCelsius > maxTemp) {
            throw new Error(`Temperature ${temperatureCelsius}°C outside valid range [${minTemp}, ${maxTemp}]°C`);
        }
    }

    /**
     * Get takeoff distance performance
     * @param {number} pressureAltitudeFt - Pressure altitude in feet
     * @param {number} temperatureCelsius - Temperature in Celsius
     * @returns {Object} Takeoff distances with ground roll and total distance
     */
    getTakeoffDistance(pressureAltitudeFt, temperatureCelsius) {
        this.validateInputs(pressureAltitudeFt, temperatureCelsius);
        
        const conditions = this.performanceData.takeoff_distance.conditions;
        
        const groundRoll = this.interpolatePerformance(
            conditions, pressureAltitudeFt, temperatureCelsius, 'ground_roll_ft'
        );
        const totalDistance = this.interpolatePerformance(
            conditions, pressureAltitudeFt, temperatureCelsius, 'total_distance_ft'
        );
        
        return {
            groundRoll: Math.round(groundRoll / 50) * 50,
            totalDistance: Math.round(totalDistance / 50) * 50,
            conditions: {
                pressureAltitude: pressureAltitudeFt,
                temperature: temperatureCelsius,
                weight: this.metadata.weight_lb
            }
        };
    }

    /**
     * Get landing distance performance
     * @param {number} pressureAltitudeFt - Pressure altitude in feet
     * @param {number} temperatureCelsius - Temperature in Celsius
     * @returns {Object} Landing distances with ground roll and total distance
     */
    getLandingDistance(pressureAltitudeFt, temperatureCelsius) {
        this.validateInputs(pressureAltitudeFt, temperatureCelsius);
        
        const conditions = this.performanceData.landing_distance.conditions;
        
        const groundRoll = this.interpolatePerformance(
            conditions, pressureAltitudeFt, temperatureCelsius, 'ground_roll_ft'
        );
        const totalDistance = this.interpolatePerformance(
            conditions, pressureAltitudeFt, temperatureCelsius, 'total_distance_ft'
        );
        
        return {
            groundRoll: Math.round(groundRoll / 50) * 50,
            totalDistance: Math.round(totalDistance / 50) * 50,
            conditions: {
                pressureAltitude: pressureAltitudeFt,
                temperature: temperatureCelsius,
                weight: this.metadata.weight_lb
            }
        };
    }

    /**
     * Perform bilinear interpolation for performance data
     */
    interpolatePerformance(conditions, targetPA, targetTemp, performanceField) {
        // Find surrounding pressure altitudes
        const sortedByPA = conditions.sort((a, b) => a.pressure_altitude_ft - b.pressure_altitude_ft);
        
        // Find bounding pressure altitudes
        let lowerPA = null, upperPA = null;
        for (let i = 0; i < sortedByPA.length - 1; i++) {
            if (sortedByPA[i].pressure_altitude_ft <= targetPA && 
                sortedByPA[i + 1].pressure_altitude_ft >= targetPA) {
                lowerPA = sortedByPA[i];
                upperPA = sortedByPA[i + 1];
                break;
            }
        }
        
        if (!lowerPA || !upperPA) {
            throw new Error(`Target pressure altitude ${targetPA} ft outside available data range`);
        }
        
        // If exact match on pressure altitude, do linear interpolation on temperature
        if (lowerPA.pressure_altitude_ft === upperPA.pressure_altitude_ft) {
            return this.interpolateTemperature(lowerPA.performance, targetTemp, performanceField);
        }
        
        // Bilinear interpolation
        const lowerTempValue = this.interpolateTemperature(lowerPA.performance, targetTemp, performanceField);
        const upperTempValue = this.interpolateTemperature(upperPA.performance, targetTemp, performanceField);
        
        // Linear interpolation between pressure altitudes
        const paRatio = (targetPA - lowerPA.pressure_altitude_ft) / 
                       (upperPA.pressure_altitude_ft - lowerPA.pressure_altitude_ft);
        
        return lowerTempValue + paRatio * (upperTempValue - lowerTempValue);
    }

    /**
     * Interpolate performance value for temperature
     */
    interpolateTemperature(performance, targetTemp, field) {
        // Extract temperature data points
        const tempPoints = [];
        
        // Handle different temperature field formats
        for (const [key, value] of Object.entries(performance)) {
            const tempMatch = key.match(/temp_(-?\d+)c/i);
            if (tempMatch && value && typeof value === 'object' && value[field] !== undefined) {
                tempPoints.push({
                    temperature: parseInt(tempMatch[1]),
                    value: value[field]
                });
            }
        }
        
        if (tempPoints.length === 0) {
            throw new Error(`No temperature data found for field: ${field}`);
        }
        
        tempPoints.sort((a, b) => a.temperature - b.temperature);
        
        // Find bounding temperatures
        for (let i = 0; i < tempPoints.length - 1; i++) {
            if (tempPoints[i].temperature <= targetTemp && 
                tempPoints[i + 1].temperature >= targetTemp) {
                
                const lowerPoint = tempPoints[i];
                const upperPoint = tempPoints[i + 1];
                
                if (lowerPoint.temperature === upperPoint.temperature) {
                    return lowerPoint.value;
                }
                
                const tempRatio = (targetTemp - lowerPoint.temperature) / 
                                (upperPoint.temperature - lowerPoint.temperature);
                
                return lowerPoint.value + tempRatio * (upperPoint.value - lowerPoint.value);
            }
        }
        
        throw new Error(`Target temperature ${targetTemp}°C outside available data range`);
    }
}