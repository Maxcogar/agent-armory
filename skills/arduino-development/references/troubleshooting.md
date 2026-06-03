# Arduino Troubleshooting Guide

## Upload Issues

### "avrdude: stk500_recv(): programmer is not responding"

**Causes and Solutions:**

1. **Wrong Board Selected**
```bash
# List available boards
arduino-cli board list

# Verify correct FQBN
arduino-cli board listall | grep -i "uno"  # or your board type
```

2. **Wrong Port**
```bash
# Find correct port
arduino-cli board list
# Linux: usually /dev/ttyUSB0 or /dev/ttyACM0
# Mac: /dev/cu.usbmodem* or /dev/cu.usbserial*
# Windows: COM3, COM4, etc.

# Set correct port
arduino-cli upload -p /dev/ttyUSB0 --fqbn arduino:avr:uno sketch
```

3. **Driver Issues**
```bash
# Linux: Add user to dialout group
sudo usermod -a -G dialout $USER
# Log out and back in

# Install CH340 driver if using clone boards
# Linux:
sudo apt-get install ch34x

# Check device recognition
dmesg | tail -20  # After plugging in Arduino
```

4. **Board in Use**
```cpp
// Add delay in setup to allow upload window
void setup() {
  delay(2000);  // 2 second window for upload
  // Rest of setup
}
```

### "Sketch too big"

```cpp
// Solution 1: Optimize code size
// Before:
Serial.println("Temperature: " + String(temp) + " degrees");

// After:
Serial.print(F("Temperature: "));  // F() stores in flash
Serial.print(temp);
Serial.println(F(" degrees"));

// Solution 2: Remove unused libraries
// Solution 3: Use smaller board profile if available
```

### Permission Denied (Linux/Mac)

```bash
# Linux fix
sudo chmod 666 /dev/ttyUSB0
# OR better - add to dialout group
sudo usermod -a -G dialout $USER

# Mac fix
sudo chmod 666 /dev/cu.usbmodem*
```

## Serial Monitor Issues

### No Output in Serial Monitor

```cpp
void setup() {
  Serial.begin(115200);
  
  // CRITICAL: Wait for Serial to be ready
  while (!Serial) {
    ; // Wait for serial port to connect (needed for native USB)
  }
  
  // OR with timeout for production:
  unsigned long serialTimeout = millis() + 3000;
  while (!Serial && millis() < serialTimeout) {
    delay(10);
  }
  
  Serial.println("Serial ready!");
}
```

### Garbage Characters in Serial

```cpp
// Check baud rate matches
void setup() {
  Serial.begin(115200);  // Must match monitor setting
}

// Arduino CLI monitor with correct baud:
arduino-cli monitor -p /dev/ttyUSB0 -c baudrate=115200
```

### Serial Buffer Overflow

```cpp
// Solution: Process serial data promptly
void loop() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    // Process immediately
  }
  
  // DON'T do this:
  // delay(1000);  // Buffer might overflow during delay
}

// Better pattern for reading lines:
String readSerialLine() {
  static String buffer = "";
  
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      String line = buffer;
      buffer = "";
      return line;
    } else if (c != '\r') {
      buffer += c;
      if (buffer.length() > 100) {  // Prevent overflow
        buffer = "";
      }
    }
  }
  
  return "";  // No complete line yet
}
```

## Sensor Reading Issues

### Analog Reading Always 0 or 1023

```cpp
// Check pin mode
void setup() {
  pinMode(A0, INPUT);  // Explicitly set as input
  
  // DON'T accidentally set as output:
  // pinMode(A0, OUTPUT);  // This will damage the pin!
}

// Check for floating pin
void testAnalogPin(uint8_t pin) {
  pinMode(pin, INPUT_PULLUP);  // Enable pullup
  delay(10);
  int pullupReading = analogRead(pin);
  
  pinMode(pin, INPUT);  // Disable pullup
  delay(10);
  int normalReading = analogRead(pin);
  
  Serial.print("Pin A");
  Serial.print(pin - A0);
  Serial.print(" - Pullup: ");
  Serial.print(pullupReading);
  Serial.print(", Normal: ");
  Serial.println(normalReading);
  
  if (abs(pullupReading - normalReading) < 50) {
    Serial.println("WARNING: Pin appears to be floating!");
  }
}
```

### I2C Device Not Found

```cpp
// Comprehensive I2C debugging
#include <Wire.h>

void scanI2C() {
  Serial.println("\n=== I2C Scanner ===");
  Serial.println("Scanning...");
  
  byte error, address;
  int nDevices = 0;
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("Device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      nDevices++;
    } else if (error == 4) {
      Serial.print("Unknown error at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  
  if (nDevices == 0) {
    Serial.println("No I2C devices found");
    Serial.println("\nCheck:");
    Serial.println("1. SDA connected to A4 (Uno) or 21 (ESP32)");
    Serial.println("2. SCL connected to A5 (Uno) or 22 (ESP32)");
    Serial.println("3. Device powered (3.3V or 5V + GND)");
    Serial.println("4. Pull-up resistors (4.7kΩ) on SDA/SCL");
  } else {
    Serial.print("\nFound ");
    Serial.print(nDevices);
    Serial.println(" devices");
  }
}

// Test I2C communication
bool testI2CDevice(uint8_t address) {
  Serial.print("Testing device at 0x");
  Serial.print(address, HEX);
  Serial.print("... ");
  
  // Try to read one byte
  Wire.beginTransmission(address);
  byte error = Wire.endTransmission();
  
  if (error == 0) {
    Wire.requestFrom(address, (uint8_t)1);
    if (Wire.available()) {
      byte data = Wire.read();
      Serial.print("Success! Read: 0x");
      Serial.println(data, HEX);
      return true;
    } else {
      Serial.println("Device found but not responding");
      return false;
    }
  } else {
    Serial.print("Error: ");
    Serial.println(error);
    return false;
  }
}
```

### SPI Communication Failure

```cpp
// SPI debugging setup
#include <SPI.h>

class SPIDebugger {
public:
  void begin() {
    SPI.begin();
    
    Serial.println("=== SPI Debug Info ===");
    Serial.print("MOSI: Pin ");
    Serial.println(MOSI);
    Serial.print("MISO: Pin ");
    Serial.println(MISO);
    Serial.print("SCK: Pin ");
    Serial.println(SCK);
    Serial.print("SS: Pin ");
    Serial.println(SS);
  }
  
  void testDevice(uint8_t csPin) {
    pinMode(csPin, OUTPUT);
    digitalWrite(csPin, HIGH);
    
    Serial.print("Testing SPI device on CS pin ");
    Serial.println(csPin);
    
    // Configure SPI settings
    SPISettings settings(1000000, MSBFIRST, SPI_MODE0);
    
    SPI.beginTransaction(settings);
    digitalWrite(csPin, LOW);
    
    // Send test byte
    byte sent = 0xAA;
    byte received = SPI.transfer(sent);
    
    digitalWrite(csPin, HIGH);
    SPI.endTransaction();
    
    Serial.print("Sent: 0x");
    Serial.print(sent, HEX);
    Serial.print(", Received: 0x");
    Serial.println(received, HEX);
    
    if (received == 0xFF || received == 0x00) {
      Serial.println("WARNING: Check MISO connection");
    }
  }
  
  void analyzeTiming() {
    // Test different SPI speeds
    uint32_t speeds[] = {125000, 250000, 500000, 1000000, 2000000, 4000000};
    
    for (int i = 0; i < 6; i++) {
      Serial.print("Testing ");
      Serial.print(speeds[i]);
      Serial.print(" Hz: ");
      
      SPISettings settings(speeds[i], MSBFIRST, SPI_MODE0);
      SPI.beginTransaction(settings);
      
      unsigned long start = micros();
      for (int j = 0; j < 100; j++) {
        SPI.transfer(0xAA);
      }
      unsigned long elapsed = micros() - start;
      
      SPI.endTransaction();
      
      Serial.print(elapsed);
      Serial.println(" us for 100 transfers");
    }
  }
};
```

## Memory Issues

### Finding Memory Leaks

```cpp
// Memory monitoring for AVR boards
#ifdef __AVR__
int freeRam() {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}

void checkMemory(const char* location) {
  Serial.print(F("[MEM] "));
  Serial.print(location);
  Serial.print(F(": "));
  Serial.print(freeRam());
  Serial.println(F(" bytes free"));
  
  if (freeRam() < 200) {
    Serial.println(F("WARNING: Low memory!"));
  }
}
#endif

// Usage:
void loop() {
  checkMemory("Loop start");
  
  // Your code here
  
  checkMemory("Loop end");
  delay(1000);
}
```

### String Causing Crashes

```cpp
// Problem: String concatenation uses heap
String message = "";
for (int i = 0; i < 100; i++) {
  message += String(i) + ", ";  // BAD: Fragments memory
}

// Solution 1: Use char arrays
char message[200];
snprintf(message, sizeof(message), "Value: %d", sensorValue);

// Solution 2: Reserve String space
String message;
message.reserve(200);  // Pre-allocate
for (int i = 0; i < 100; i++) {
  message += String(i);
  message += ", ";
}

// Solution 3: Use F() macro for constants
Serial.println(F("This string stays in flash"));
```

## Timing Issues

### Millis() Overflow

```cpp
// WRONG - will fail after ~50 days
unsigned long nextTime = millis() + 1000;
if (millis() > nextTime) {  // BAD: Fails on overflow
  // Do something
}

// CORRECT - handles overflow properly
unsigned long previousTime = millis();
unsigned long interval = 1000;

void loop() {
  if (millis() - previousTime >= interval) {
    previousTime = millis();
    // Do something
  }
}
```

### Interrupt Issues

```cpp
// Interrupt safe variable access
volatile bool flag = false;
volatile uint32_t counter = 0;

void IRAM_ATTR myISR() {  // IRAM_ATTR for ESP32
  flag = true;
  counter++;
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), myISR, RISING);
}

void loop() {
  if (flag) {
    noInterrupts();  // Critical section
    flag = false;
    uint32_t currentCount = counter;
    interrupts();
    
    Serial.print("Count: ");
    Serial.println(currentCount);
  }
}
```

## Power Issues

### Detecting Brown-outs

```cpp
// Check if reset was caused by power issue
void checkResetReason() {
  #ifdef ESP32
    esp_reset_reason_t reason = esp_reset_reason();
    
    Serial.print("Reset reason: ");
    switch(reason) {
      case ESP_RST_POWERON:
        Serial.println("Power on");
        break;
      case ESP_RST_SW:
        Serial.println("Software reset");
        break;
      case ESP_RST_PANIC:
        Serial.println("Panic/Exception");
        break;
      case ESP_RST_BROWNOUT:
        Serial.println("Brownout detected!");
        Serial.println("CHECK POWER SUPPLY!");
        break;
      default:
        Serial.println("Unknown");
    }
  #endif
}

// Monitor voltage (if voltage divider connected)
float readVoltage(uint8_t pin) {
  // Assumes voltage divider: Vin --[10k]--|--[10k]-- GND
  //                                        |
  //                                      A0/pin
  
  int raw = analogRead(pin);
  float voltage = (raw / 1023.0) * 5.0 * 2.0;  // *2 for divider
  
  if (voltage < 4.5) {
    Serial.println("WARNING: Low voltage detected!");
  }
  
  return voltage;
}
```

## Common Library Issues

### Multiple Libraries Conflict

```cpp
// Solution: Use namespace or rename
// If two libraries define 'Timer':

// Option 1: Namespace (if library supports it)
namespace LibA {
  #include <LibraryA.h>
}
namespace LibB {
  #include <LibraryB.h>
}

// Use: LibA::Timer timer1;

// Option 2: Edit library headers (last resort)
// Rename conflicting classes in one library
```

### Library Not Found

```bash
# Search for library
arduino-cli lib search "library name"

# Install specific version
arduino-cli lib install "LibraryName@1.2.3"

# List installed libraries
arduino-cli lib list

# Update all libraries
arduino-cli lib upgrade
```

## Debugging Strategies

### Progressive Debugging Template

```cpp
// Debug levels
#define DEBUG_NONE 0
#define DEBUG_ERROR 1
#define DEBUG_WARNING 2
#define DEBUG_INFO 3
#define DEBUG_VERBOSE 4

#define DEBUG_LEVEL DEBUG_VERBOSE

#define DEBUG_PRINT(level, msg) \
  if (level <= DEBUG_LEVEL) { \
    Serial.print(F("[L")); \
    Serial.print(level); \
    Serial.print(F("] ")); \
    Serial.print(F(__FILE__)); \
    Serial.print(F(":")); \
    Serial.print(__LINE__); \
    Serial.print(F(" - ")); \
    Serial.println(msg); \
  }

// Usage:
void setup() {
  Serial.begin(115200);
  DEBUG_PRINT(DEBUG_INFO, "Setup starting");
  
  if (!sensor.begin()) {
    DEBUG_PRINT(DEBUG_ERROR, "Sensor init failed");
  }
  
  DEBUG_PRINT(DEBUG_VERBOSE, "Setup complete");
}
```

### Hardware Test Mode

```cpp
// Add test mode for hardware validation
bool testMode = false;

void setup() {
  Serial.begin(115200);
  
  // Check if test pin is grounded
  pinMode(12, INPUT_PULLUP);
  if (digitalRead(12) == LOW) {
    testMode = true;
    runHardwareTests();
  }
  
  // Normal setup
}

void runHardwareTests() {
  Serial.println("=== HARDWARE TEST MODE ===");
  
  // Test all outputs
  testAllOutputs();
  
  // Test all inputs
  testAllInputs();
  
  // Test communication
  scanI2C();
  // testSPI();
  
  // Test sensors
  testAllSensors();
  
  Serial.println("=== TESTS COMPLETE ===");
  while(1);  // Stop here
}

void testAllOutputs() {
  uint8_t outputPins[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13};
  
  Serial.println("Testing outputs - watch for LED blinks");
  
  for (uint8_t pin : outputPins) {
    pinMode(pin, OUTPUT);
    Serial.print("Pin ");
    Serial.print(pin);
    Serial.print(": ");
    
    digitalWrite(pin, HIGH);
    delay(500);
    digitalWrite(pin, LOW);
    delay(500);
    
    Serial.println("OK");
  }
}

void testAllInputs() {
  uint8_t inputPins[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
  
  Serial.println("Testing inputs - ground each pin to test");
  
  for (uint8_t pin : inputPins) {
    pinMode(pin, INPUT_PULLUP);
    
    Serial.print("Waiting for pin ");
    Serial.print(pin);
    Serial.println(" to be grounded...");
    
    unsigned long timeout = millis() + 5000;
    while (digitalRead(pin) == HIGH && millis() < timeout) {
      delay(10);
    }
    
    if (digitalRead(pin) == LOW) {
      Serial.println("OK - Input detected");
    } else {
      Serial.println("TIMEOUT - No input detected");
    }
  }
}

void testAllSensors() {
  // Add sensor-specific tests here
  Serial.println("Testing sensors...");
  // testDHT();
  // testUltrasonic();
  // etc.
}
```

## Performance Optimization

### Loop Timing Analysis

```cpp
class LoopProfiler {
private:
  unsigned long loopCount = 0;
  unsigned long totalTime = 0;
  unsigned long maxTime = 0;
  unsigned long minTime = 999999;
  unsigned long lastReport = 0;
  unsigned long loopStart = 0;
  
public:
  void begin() {
    Serial.println("[PROFILER] Loop profiling started");
    lastReport = millis();
  }
  
  void loopBegin() {
    loopStart = micros();
  }
  
  void loopEnd() {
    unsigned long loopTime = micros() - loopStart;
    
    totalTime += loopTime;
    loopCount++;
    
    if (loopTime > maxTime) maxTime = loopTime;
    if (loopTime < minTime) minTime = loopTime;
    
    // Report every 5 seconds
    if (millis() - lastReport > 5000) {
      report();
      reset();
    }
  }
  
  void report() {
    Serial.println("\n=== Loop Performance Report ===");
    Serial.print("Loops: ");
    Serial.println(loopCount);
    
    if (loopCount > 0) {
      Serial.print("Avg: ");
      Serial.print(totalTime / loopCount);
      Serial.println(" us");
      
      Serial.print("Min: ");
      Serial.print(minTime);
      Serial.println(" us");
      
      Serial.print("Max: ");
      Serial.print(maxTime);
      Serial.println(" us");
      
      Serial.print("Frequency: ");
      Serial.print(loopCount / 5);
      Serial.println(" Hz");
    }
  }
  
  void reset() {
    loopCount = 0;
    totalTime = 0;
    maxTime = 0;
    minTime = 999999;
    lastReport = millis();
  }
};
```

## Quick Reference Checklist

### Before Upload
- [ ] Correct board selected
- [ ] Correct port selected
- [ ] Serial baud rate matches code
- [ ] No blocking delays in setup()
- [ ] Watchdog configured (ESP32)
- [ ] Debug output included
- [ ] Power supply adequate

### First Upload - Test Program
```cpp
// Always test with this first
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { delay(10); }
  
  Serial.println("=== Board Test ===");
  Serial.print("Millis: ");
  Serial.println(millis());
  
  #ifdef ESP32
    Serial.print("ESP32 Model: ");
    Serial.println(ESP.getChipModel());
    Serial.print("Free Heap: ");
    Serial.println(ESP.getFreeHeap());
  #endif
}

void loop() {
  static unsigned long lastBlink = 0;
  
  // Heartbeat
  if (millis() - lastBlink > 1000) {
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    Serial.print("Alive: ");
    Serial.println(millis() / 1000);
    lastBlink = millis();
  }
}
```

### When Nothing Works
1. Test with simple blink sketch
2. Check power (measure with multimeter)
3. Try different cable
4. Try different computer/port
5. Check for shorts on board
6. Try different board
7. Reinstall Arduino CLI/drivers
8. Check board for physical damage

### Emergency Recovery (ESP32)
```bash
# Erase flash completely
esptool.py --port /dev/ttyUSB0 erase_flash

# Flash with known good firmware
esptool.py --port /dev/ttyUSB0 write_flash 0x1000 bootloader.bin 0x8000 partitions.bin 0x10000 firmware.bin
```

## Golden Rules

1. **Always include serial debug** - You can't fix what you can't see
2. **Test incrementally** - Never add multiple features at once
3. **Use heartbeat LED** - Visual confirmation code is running
4. **Check power first** - Most "weird" issues are power-related
5. **Read error messages carefully** - They usually tell you exactly what's wrong
6. **Keep a known-good sketch** - For testing hardware
7. **Document what works** - Build your own reference library
8. **Use version control** - Git commit working versions before changes
