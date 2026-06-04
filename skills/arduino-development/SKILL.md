---
name: arduino-development
description: Systematic Arduino/ESP32 development with validation, testing, and debugging strategies. Use when developing code for Arduino boards, ESP32, ESP8266, or other microcontrollers. Emphasizes incremental development, hardware abstraction, serial debugging, and pre-upload validation to avoid non-functional code. Includes Arduino CLI usage for compilation and upload.
---

# Arduino Development Skill

This skill provides systematic approaches for Arduino/microcontroller development that prioritize working, testable code through incremental development and validation strategies.

## Core Philosophy

**Never write complete applications in one go.** Arduino development must be incremental with validation at each step. Non-functional code that provides no debugging output is worthless and wastes time.

## Critical Pre-Development Steps

### 1. Hardware Inventory

Before writing ANY code, document:
```
Board: [exact model, e.g., "Arduino Uno R3", "ESP32-DevKitC V4"]
Core: [e.g., "arduino:avr", "esp32:esp32"]
FQBN: [e.g., "arduino:avr:uno", "esp32:esp32:esp32"]
Upload Port: [e.g., "/dev/ttyUSB0", "/dev/ttyACM0"]
Sensors/Modules: [list with exact model numbers]
Pin Connections: [detailed wiring diagram]
Power Requirements: [voltage/current for each component]
```

### 2. Development Environment Setup

```bash
# Install Arduino CLI if not present
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh

# Configure Arduino CLI
arduino-cli config init
arduino-cli core update-index

# Install required cores
arduino-cli core install arduino:avr  # For Arduino boards
arduino-cli core install esp32:esp32  # For ESP32

# List connected boards
arduino-cli board list

# Install libraries
arduino-cli lib install "Library Name"
```

## Development Strategy: Build-Test-Iterate

### Phase 1: Blink Test (ALWAYS START HERE)

```cpp
// ALWAYS start with basic board validation
#define LED_PIN 2  // Adjust for your board

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { delay(10); }
  Serial.println("Board initialization test starting...");
  Serial.print("Chip ID: ");
  #ifdef ESP32
    Serial.println(ESP.getChipModel());
  #else
    Serial.println("Arduino Board");
  #endif
  
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED pin configured");
}

void loop() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (millis() - lastBlink > 1000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    Serial.print("LED: ");
    Serial.println(ledState ? "ON" : "OFF");
    lastBlink = millis();
  }
}
```

Compile and upload:
```bash
arduino-cli compile --fqbn arduino:avr:uno blink_test
arduino-cli upload -p /dev/ttyUSB0 --fqbn arduino:avr:uno blink_test
arduino-cli monitor -p /dev/ttyUSB0 -c baudrate=115200
```

### Phase 2: Component Isolation Testing

For EACH sensor/component, create a standalone test BEFORE integration:

```cpp
// Template for component testing
#define COMPONENT_PIN A0  // Adjust as needed

class ComponentTester {
private:
  unsigned long lastTest = 0;
  const unsigned long TEST_INTERVAL = 1000;
  
public:
  void begin() {
    Serial.println("=== Component Test Started ===");
    Serial.println("Pin Configuration:");
    Serial.print("  Test Pin: ");
    Serial.println(COMPONENT_PIN);
    // Add component-specific initialization
  }
  
  void test() {
    if (millis() - lastTest < TEST_INTERVAL) return;
    lastTest = millis();
    
    Serial.println("--- Test Cycle ---");
    Serial.print("Timestamp: ");
    Serial.println(millis());
    
    // Component-specific test code
    int reading = analogRead(COMPONENT_PIN);
    Serial.print("Raw Reading: ");
    Serial.println(reading);
    Serial.print("Voltage: ");
    Serial.println(reading * (5.0 / 1023.0));
    
    // Add boundary checks
    if (reading < 10) {
      Serial.println("WARNING: Very low reading - check connection");
    }
    if (reading > 1013) {
      Serial.println("WARNING: Near maximum - possible short");
    }
  }
};

ComponentTester tester;

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { delay(10); }
  tester.begin();
}

void loop() {
  tester.test();
}
```

### Phase 3: Incremental Integration

**NEVER integrate multiple components simultaneously.** Add one component at a time:

```cpp
// Progressive integration template
class SystemIntegration {
private:
  enum State {
    INIT,
    TEST_COMPONENT_1,
    TEST_COMPONENT_2,
    INTEGRATED_TEST,
    RUNNING
  };
  
  State currentState = INIT;
  unsigned long stateTimer = 0;
  
public:
  void begin() {
    Serial.println("=== System Integration Test ===");
    Serial.println("States: INIT -> COMP1 -> COMP2 -> INTEGRATED -> RUNNING");
  }
  
  void update() {
    switch(currentState) {
      case INIT:
        Serial.println("[STATE] Initialization");
        // Basic setup
        changeState(TEST_COMPONENT_1);
        break;
        
      case TEST_COMPONENT_1:
        if (stateElapsed() < 5000) {
          // Test first component for 5 seconds
          testComponent1();
        } else {
          Serial.println("[STATE] Component 1 OK");
          changeState(TEST_COMPONENT_2);
        }
        break;
        
      case TEST_COMPONENT_2:
        if (stateElapsed() < 5000) {
          // Test second component for 5 seconds
          testComponent2();
        } else {
          Serial.println("[STATE] Component 2 OK");
          changeState(INTEGRATED_TEST);
        }
        break;
        
      case INTEGRATED_TEST:
        if (stateElapsed() < 5000) {
          // Test both components together
          testIntegrated();
        } else {
          Serial.println("[STATE] Integration OK");
          changeState(RUNNING);
        }
        break;
        
      case RUNNING:
        // Normal operation
        normalOperation();
        break;
    }
  }
  
private:
  void changeState(State newState) {
    currentState = newState;
    stateTimer = millis();
  }
  
  unsigned long stateElapsed() {
    return millis() - stateTimer;
  }
  
  void testComponent1() {
    // Component 1 specific tests
  }
  
  void testComponent2() {
    // Component 2 specific tests
  }
  
  void testIntegrated() {
    // Combined testing
  }
  
  void normalOperation() {
    // Final application logic
  }
};
```

## Debugging Framework

### Always Include Debug Infrastructure

```cpp
// Debug macro system - include in EVERY sketch
#define DEBUG 1

#if DEBUG
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINTF(fmt, ...) Serial.printf(fmt, __VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(fmt, ...)
#endif

// Timing diagnostics
class TimingDiagnostics {
private:
  unsigned long loopStart = 0;
  unsigned long maxLoopTime = 0;
  unsigned long totalLoops = 0;
  unsigned long lastReport = 0;
  
public:
  void startLoop() {
    loopStart = micros();
  }
  
  void endLoop() {
    unsigned long loopTime = micros() - loopStart;
    if (loopTime > maxLoopTime) {
      maxLoopTime = loopTime;
    }
    totalLoops++;
    
    if (millis() - lastReport > 5000) {
      Serial.println("=== Performance Report ===");
      Serial.print("Max Loop Time: ");
      Serial.print(maxLoopTime);
      Serial.println(" us");
      Serial.print("Avg Loop Frequency: ");
      Serial.print(totalLoops / 5);
      Serial.println(" Hz");
      
      // Reset counters
      maxLoopTime = 0;
      totalLoops = 0;
      lastReport = millis();
    }
  }
};

// Memory diagnostics (ESP32/ESP8266)
void printMemoryStats() {
  #ifdef ESP32
    Serial.print("Free Heap: ");
    Serial.println(ESP.getFreeHeap());
    Serial.print("Max Alloc Heap: ");
    Serial.println(ESP.getMaxAllocHeap());
  #elif defined(ESP8266)
    Serial.print("Free Heap: ");
    Serial.println(ESP.getFreeHeap());
    Serial.print("Heap Fragmentation: ");
    Serial.print(ESP.getHeapFragmentation());
    Serial.println("%");
  #endif
}
```

### Error Recovery Patterns

```cpp
class SafePeripheral {
private:
  bool initialized = false;
  unsigned long lastAttempt = 0;
  uint8_t retryCount = 0;
  const uint8_t MAX_RETRIES = 3;
  const unsigned long RETRY_DELAY = 5000;
  
public:
  bool begin() {
    Serial.println("[PERIPHERAL] Attempting initialization...");
    
    // Attempt initialization with retries
    for (int i = 0; i < MAX_RETRIES; i++) {
      if (attemptInit()) {
        initialized = true;
        Serial.println("[PERIPHERAL] Initialization successful");
        return true;
      }
      Serial.print("[PERIPHERAL] Attempt ");
      Serial.print(i + 1);
      Serial.println(" failed");
      delay(100);
    }
    
    Serial.println("[PERIPHERAL] Initialization failed - will retry later");
    lastAttempt = millis();
    return false;
  }
  
  bool isReady() {
    if (initialized) return true;
    
    // Try to reinitialize periodically
    if (millis() - lastAttempt > RETRY_DELAY) {
      Serial.println("[PERIPHERAL] Retrying initialization...");
      return begin();
    }
    
    return false;
  }
  
  bool read(float &value) {
    if (!isReady()) {
      Serial.println("[PERIPHERAL] Not ready - skipping read");
      return false;
    }
    
    // Attempt read with error checking
    if (!performRead(value)) {
      Serial.println("[PERIPHERAL] Read failed - marking as uninitialized");
      initialized = false;
      return false;
    }
    
    return true;
  }
  
private:
  bool attemptInit() {
    // Hardware-specific initialization
    // Return true if successful
    return false; // Placeholder
  }
  
  bool performRead(float &value) {
    // Hardware-specific read
    // Return true if successful
    return false; // Placeholder
  }
};
```

## Common Sensor Patterns

### I2C Device Template

```cpp
#include <Wire.h>

class I2CDevice {
private:
  uint8_t address;
  bool found = false;
  
public:
  I2CDevice(uint8_t addr) : address(addr) {}
  
  bool begin() {
    Wire.begin();
    
    // Scan for device
    Wire.beginTransmission(address);
    uint8_t error = Wire.endTransmission();
    
    if (error == 0) {
      found = true;
      Serial.print("[I2C] Device found at 0x");
      Serial.println(address, HEX);
      return true;
    } else {
      Serial.print("[I2C] Device NOT found at 0x");
      Serial.println(address, HEX);
      scanI2C(); // Scan bus to help debugging
      return false;
    }
  }
  
  void scanI2C() {
    Serial.println("[I2C] Scanning bus...");
    uint8_t count = 0;
    
    for (uint8_t addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      uint8_t error = Wire.endTransmission();
      
      if (error == 0) {
        Serial.print("  Found device at 0x");
        Serial.println(addr, HEX);
        count++;
      }
    }
    
    Serial.print("[I2C] Total devices found: ");
    Serial.println(count);
  }
  
  bool writeRegister(uint8_t reg, uint8_t value) {
    if (!found) return false;
    
    Wire.beginTransmission(address);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
  }
  
  bool readRegister(uint8_t reg, uint8_t &value) {
    if (!found) return false;
    
    Wire.beginTransmission(address);
    Wire.write(reg);
    if (Wire.endTransmission() != 0) return false;
    
    Wire.requestFrom(address, (uint8_t)1);
    if (Wire.available()) {
      value = Wire.read();
      return true;
    }
    
    return false;
  }
};
```

### Analog Sensor Template

```cpp
class AnalogSensor {
private:
  uint8_t pin;
  float calibrationOffset = 0;
  float calibrationScale = 1.0;
  
  // Moving average filter
  static const uint8_t FILTER_SIZE = 10;
  float readings[FILTER_SIZE];
  uint8_t readIndex = 0;
  float total = 0;
  bool filterInitialized = false;
  
public:
  AnalogSensor(uint8_t sensorPin) : pin(sensorPin) {}
  
  void begin() {
    pinMode(pin, INPUT);
    
    // Initialize filter with current reading
    int initialReading = analogRead(pin);
    for (int i = 0; i < FILTER_SIZE; i++) {
      readings[i] = initialReading;
      total += initialReading;
    }
    filterInitialized = true;
    
    Serial.print("[ANALOG] Sensor on pin ");
    Serial.print(pin);
    Serial.print(" initialized. Initial reading: ");
    Serial.println(initialReading);
  }
  
  float readFiltered() {
    if (!filterInitialized) {
      begin();
    }
    
    // Update moving average
    total -= readings[readIndex];
    readings[readIndex] = analogRead(pin);
    total += readings[readIndex];
    readIndex = (readIndex + 1) % FILTER_SIZE;
    
    float average = total / FILTER_SIZE;
    float calibrated = (average + calibrationOffset) * calibrationScale;
    
    return calibrated;
  }
  
  void calibrate(float offset, float scale) {
    calibrationOffset = offset;
    calibrationScale = scale;
    Serial.print("[ANALOG] Calibration set - Offset: ");
    Serial.print(offset);
    Serial.print(", Scale: ");
    Serial.println(scale);
  }
  
  void debug() {
    int raw = analogRead(pin);
    float filtered = readFiltered();
    
    Serial.print("[ANALOG] Pin ");
    Serial.print(pin);
    Serial.print(" - Raw: ");
    Serial.print(raw);
    Serial.print(", Filtered: ");
    Serial.print(filtered);
    Serial.print(", Voltage: ");
    Serial.println(raw * (5.0 / 1023.0));
  }
};
```

## Arduino CLI Workflow

### Project Structure

```
project/
├── project.ino          # Main sketch
├── config.h            # Configuration and pin definitions
├── debug.h             # Debug macros and utilities
├── sensors.cpp         # Sensor implementations
├── sensors.h           # Sensor interfaces
└── test/
    ├── test_blink/
    │   └── test_blink.ino
    ├── test_sensor1/
    │   └── test_sensor1.ino
    └── test_integration/
        └── test_integration.ino
```

### Compilation and Testing Commands

```bash
# Create sketch
arduino-cli sketch new MyProject

# Compile with verbose output for debugging
arduino-cli compile --fqbn esp32:esp32:esp32 \
  --warnings all \
  --verbose \
  MyProject

# Upload with verbose output
arduino-cli upload -p /dev/ttyUSB0 \
  --fqbn esp32:esp32:esp32 \
  --verbose \
  MyProject

# Monitor serial output
arduino-cli monitor -p /dev/ttyUSB0 \
  --config baudrate=115200 \
  --timestamp

# Combined compile, upload, and monitor
arduino-cli compile --fqbn esp32:esp32:esp32 MyProject && \
arduino-cli upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32 MyProject && \
arduino-cli monitor -p /dev/ttyUSB0 --config baudrate=115200
```

### Board-Specific Configurations

```bash
# ESP32
arduino-cli compile --fqbn esp32:esp32:esp32 \
  --build-property "build.partitions=huge_app" \
  --build-property "upload.speed=921600"

# ESP32-CAM
arduino-cli compile --fqbn esp32:esp32:esp32 \
  --build-property "build.extra_flags=-DBOARD_HAS_PSRAM -mfix-esp32-psram-cache-issue"

# Arduino Uno with optimization
arduino-cli compile --fqbn arduino:avr:uno \
  --build-property "compiler.optimization_flags=-Os"

# Arduino Mega
arduino-cli compile --fqbn arduino:avr:mega \
  --build-property "build.extra_flags=-DMEGA2560"
```

## Validation Checklist

Before EVERY upload, verify:

1. **Serial Debug Output**: Every major function has Serial.print statements
2. **LED Feedback**: Visual indication of program state (blink patterns)
3. **Watchdog Timer**: For ESP32/ESP8266, include watchdog feeds
4. **Error Handling**: Every sensor read has failure handling
5. **Safe Defaults**: All pins have defined initial states
6. **Timing Checks**: No blocking delays in main loop
7. **Memory Monitoring**: For larger programs, include heap monitoring

## Testing Protocol

### Never Skip These Steps:

1. **Compile Test**: Verify no syntax errors
2. **Blink Integration**: Add LED blink to confirm code is running
3. **Serial Heartbeat**: Print timestamp every second minimum
4. **Component Isolation**: Test each component individually first
5. **Progressive Integration**: Add one feature at a time
6. **Stress Testing**: Run for extended periods checking for memory leaks

## Common Pitfall Prevention

### Power Issues
- Always check total current draw vs supply capability
- Use separate power for motors/servos
- Add capacitors near sensor power pins
- Monitor voltage levels during operation

### Timing Issues
- Never use delay() in interrupt handlers
- Use millis() for non-blocking delays
- Account for timer overflow (every ~50 days)
- Keep loop() execution under 100ms

### Memory Issues
- Avoid String class on AVR boards
- Use PROGMEM for constant data
- Monitor stack/heap collision
- Preallocate buffers

### Communication Issues
- Always set timeout for serial reads
- Check buffer sizes for I2C/SPI
- Validate data with checksums
- Include connection retry logic

## Example: Complete Sensor System

```cpp
// Complete example with all best practices
#include <Wire.h>

// Configuration
#define LED_PIN 2
#define SENSOR_PIN A0
#define I2C_ADDR 0x68
#define DEBUG 1

// Debug macros
#if DEBUG
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINT(x) Serial.print(x)
#else
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINT(x)
#endif

// System state
enum SystemState {
  STATE_INIT,
  STATE_TEST_LED,
  STATE_TEST_ANALOG,
  STATE_TEST_I2C,
  STATE_RUNNING,
  STATE_ERROR
};

class SensorSystem {
private:
  SystemState state = STATE_INIT;
  unsigned long stateStartTime = 0;
  unsigned long lastHeartbeat = 0;
  
  // Components
  bool ledWorking = false;
  bool analogWorking = false;
  bool i2cWorking = false;
  
public:
  void begin() {
    Serial.begin(115200);
    while (!Serial && millis() < 3000) { delay(10); }
    
    Serial.println("=================================");
    Serial.println("   Sensor System Starting v1.0   ");
    Serial.println("=================================");
    
    printSystemInfo();
    changeState(STATE_TEST_LED);
  }
  
  void update() {
    // Heartbeat
    if (millis() - lastHeartbeat > 1000) {
      Serial.print("[HEARTBEAT] ");
      Serial.print(millis() / 1000);
      Serial.print("s - State: ");
      Serial.println(stateToString(state));
      lastHeartbeat = millis();
    }
    
    // State machine
    switch(state) {
      case STATE_TEST_LED:
        testLED();
        break;
        
      case STATE_TEST_ANALOG:
        testAnalog();
        break;
        
      case STATE_TEST_I2C:
        testI2C();
        break;
        
      case STATE_RUNNING:
        runNormal();
        break;
        
      case STATE_ERROR:
        handleError();
        break;
    }
  }
  
private:
  void changeState(SystemState newState) {
    Serial.print("[STATE CHANGE] ");
    Serial.print(stateToString(state));
    Serial.print(" -> ");
    Serial.println(stateToString(newState));
    
    state = newState;
    stateStartTime = millis();
  }
  
  String stateToString(SystemState s) {
    switch(s) {
      case STATE_INIT: return "INIT";
      case STATE_TEST_LED: return "TEST_LED";
      case STATE_TEST_ANALOG: return "TEST_ANALOG";
      case STATE_TEST_I2C: return "TEST_I2C";
      case STATE_RUNNING: return "RUNNING";
      case STATE_ERROR: return "ERROR";
      default: return "UNKNOWN";
    }
  }
  
  void testLED() {
    if (millis() - stateStartTime < 3000) {
      // Blink LED for 3 seconds
      static unsigned long lastBlink = 0;
      if (millis() - lastBlink > 500) {
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        lastBlink = millis();
      }
    } else {
      ledWorking = true;
      Serial.println("[TEST] LED test passed");
      changeState(STATE_TEST_ANALOG);
    }
  }
  
  void testAnalog() {
    if (millis() - stateStartTime < 3000) {
      // Read analog sensor for 3 seconds
      static unsigned long lastRead = 0;
      if (millis() - lastRead > 500) {
        int reading = analogRead(SENSOR_PIN);
        Serial.print("[ANALOG] Reading: ");
        Serial.println(reading);
        
        if (reading > 10 && reading < 1013) {
          analogWorking = true;
        }
        lastRead = millis();
      }
    } else {
      if (analogWorking) {
        Serial.println("[TEST] Analog test passed");
      } else {
        Serial.println("[TEST] Analog test FAILED - continuing anyway");
      }
      changeState(STATE_TEST_I2C);
    }
  }
  
  void testI2C() {
    if (millis() - stateStartTime < 2000) {
      // Test I2C once
      static bool tested = false;
      if (!tested) {
        Wire.begin();
        Wire.beginTransmission(I2C_ADDR);
        uint8_t error = Wire.endTransmission();
        
        if (error == 0) {
          i2cWorking = true;
          Serial.println("[TEST] I2C device found");
        } else {
          Serial.println("[TEST] I2C device not found - continuing anyway");
        }
        tested = true;
      }
    } else {
      // All tests complete
      Serial.println("[TEST] All component tests complete");
      Serial.print("  LED: ");
      Serial.println(ledWorking ? "OK" : "FAIL");
      Serial.print("  Analog: ");
      Serial.println(analogWorking ? "OK" : "FAIL");
      Serial.print("  I2C: ");
      Serial.println(i2cWorking ? "OK" : "FAIL");
      
      changeState(STATE_RUNNING);
    }
  }
  
  void runNormal() {
    static unsigned long lastSensorRead = 0;
    
    // Read sensors every second
    if (millis() - lastSensorRead > 1000) {
      if (analogWorking) {
        int reading = analogRead(SENSOR_PIN);
        Serial.print("[DATA] Analog: ");
        Serial.println(reading);
      }
      
      // Add I2C reads here if working
      
      lastSensorRead = millis();
    }
    
    // Blink LED to show we're alive
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 2000) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      lastBlink = millis();
    }
  }
  
  void handleError() {
    // Fast blink to indicate error
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 100) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      lastBlink = millis();
    }
  }
  
  void printSystemInfo() {
    #ifdef ESP32
      Serial.print("Board: ESP32 - ");
      Serial.println(ESP.getChipModel());
      Serial.print("Free Heap: ");
      Serial.println(ESP.getFreeHeap());
    #elif defined(ESP8266)
      Serial.println("Board: ESP8266");
      Serial.print("Free Heap: ");
      Serial.println(ESP.getFreeHeap());
    #else
      Serial.println("Board: Arduino");
    #endif
    
    Serial.print("Compile Date: ");
    Serial.print(__DATE__);
    Serial.print(" ");
    Serial.println(__TIME__);
  }
};

// Global instance
SensorSystem system;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  system.begin();
}

void loop() {
  system.update();
  
  // Watchdog feed for ESP32
  #ifdef ESP32
    yield();
  #endif
}
```

## Critical Rules

1. **NEVER** write more than 50 lines without testing
2. **ALWAYS** include serial debug output in every function
3. **NEVER** integrate multiple new components at once
4. **ALWAYS** test with simple blink first
5. **NEVER** assume pin connections are correct
6. **ALWAYS** include error recovery mechanisms
7. **NEVER** use blocking delays in production code
8. **ALWAYS** validate sensor readings are within expected ranges

## References

See the following files for specific scenarios:
- `references/sensors-catalog.md` - Common sensor implementations
- `references/esp32-specific.md` - ESP32 platform details
- `references/troubleshooting.md` - Common issues and solutions
