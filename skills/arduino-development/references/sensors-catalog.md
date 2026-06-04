# Sensors Catalog

Tested, working implementations for common sensors. Each example includes validation and error handling.

## DHT Temperature/Humidity Sensors

```cpp
#include <DHT.h>

class DHTSensor {
private:
  DHT* dht;
  float lastTemp = 0;
  float lastHumidity = 0;
  unsigned long lastReadTime = 0;
  const unsigned long MIN_READ_INTERVAL = 2000; // DHT sensors need 2s between reads
  
public:
  DHTSensor(uint8_t pin, uint8_t type) {
    dht = new DHT(pin, type);
  }
  
  bool begin() {
    dht->begin();
    delay(2000); // DHT needs time to stabilize
    
    // Test read
    float h = dht->readHumidity();
    float t = dht->readTemperature();
    
    if (isnan(h) || isnan(t)) {
      Serial.println("[DHT] Sensor not responding");
      return false;
    }
    
    Serial.print("[DHT] Sensor initialized. Temp: ");
    Serial.print(t);
    Serial.print("°C, Humidity: ");
    Serial.print(h);
    Serial.println("%");
    
    lastTemp = t;
    lastHumidity = h;
    lastReadTime = millis();
    return true;
  }
  
  bool read(float &temperature, float &humidity) {
    // Enforce minimum read interval
    if (millis() - lastReadTime < MIN_READ_INTERVAL) {
      temperature = lastTemp;
      humidity = lastHumidity;
      return true;
    }
    
    float h = dht->readHumidity();
    float t = dht->readTemperature();
    
    if (isnan(h) || isnan(t)) {
      Serial.println("[DHT] Read error - returning last good values");
      temperature = lastTemp;
      humidity = lastHumidity;
      return false;
    }
    
    // Sanity check readings
    if (t < -40 || t > 80 || h < 0 || h > 100) {
      Serial.println("[DHT] Invalid readings detected");
      temperature = lastTemp;
      humidity = lastHumidity;
      return false;
    }
    
    lastTemp = t;
    lastHumidity = h;
    lastReadTime = millis();
    
    temperature = t;
    humidity = h;
    return true;
  }
};
```

## Ultrasonic Distance Sensor (HC-SR04)

```cpp
class UltrasonicSensor {
private:
  uint8_t trigPin;
  uint8_t echoPin;
  float lastDistance = 0;
  const unsigned long TIMEOUT = 30000; // 30ms timeout (~5m range)
  
public:
  UltrasonicSensor(uint8_t trig, uint8_t echo) : trigPin(trig), echoPin(echo) {}
  
  void begin() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    digitalWrite(trigPin, LOW);
    
    Serial.print("[ULTRASONIC] Initialized on pins ");
    Serial.print(trigPin);
    Serial.print("/");
    Serial.println(echoPin);
    
    // Test measurement
    float testDist = readDistance();
    Serial.print("[ULTRASONIC] Test reading: ");
    Serial.print(testDist);
    Serial.println(" cm");
  }
  
  float readDistance() {
    // Clear trigger
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    
    // Send pulse
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    // Read echo
    unsigned long duration = pulseIn(echoPin, HIGH, TIMEOUT);
    
    if (duration == 0) {
      Serial.println("[ULTRASONIC] Timeout - no echo received");
      return lastDistance; // Return last valid reading
    }
    
    // Calculate distance (speed of sound = 343 m/s)
    float distance = (duration * 0.0343) / 2.0;
    
    // Sanity check (HC-SR04 range: 2-400cm)
    if (distance < 2 || distance > 400) {
      Serial.print("[ULTRASONIC] Out of range: ");
      Serial.println(distance);
      return lastDistance;
    }
    
    lastDistance = distance;
    return distance;
  }
  
  float readFilteredDistance(uint8_t samples = 5) {
    float sum = 0;
    uint8_t validSamples = 0;
    
    for (uint8_t i = 0; i < samples; i++) {
      float dist = readDistance();
      if (dist > 0) {
        sum += dist;
        validSamples++;
      }
      delay(30); // Minimum delay between readings
    }
    
    if (validSamples == 0) {
      return 0;
    }
    
    return sum / validSamples;
  }
};
```

## BMP280/BME280 Pressure Sensor

```cpp
#include <Adafruit_BMP280.h>

class BMP280Sensor {
private:
  Adafruit_BMP280 bmp;
  bool initialized = false;
  float seaLevelPressure = 1013.25; // hPa
  
public:
  bool begin(uint8_t addr = 0x76) {
    if (!bmp.begin(addr)) {
      Serial.print("[BMP280] Not found at 0x");
      Serial.println(addr, HEX);
      
      // Try alternate address
      if (!bmp.begin(0x77)) {
        Serial.println("[BMP280] Not found at 0x77 either");
        return false;
      }
      addr = 0x77;
    }
    
    Serial.print("[BMP280] Found at 0x");
    Serial.println(addr, HEX);
    
    // Configure sensor
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,  // Temp
                    Adafruit_BMP280::SAMPLING_X16, // Pressure
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
    
    initialized = true;
    
    // Test read
    Serial.print("[BMP280] Temperature: ");
    Serial.print(bmp.readTemperature());
    Serial.println(" °C");
    Serial.print("[BMP280] Pressure: ");
    Serial.print(bmp.readPressure() / 100.0);
    Serial.println(" hPa");
    
    return true;
  }
  
  bool readData(float &temperature, float &pressure, float &altitude) {
    if (!initialized) {
      return false;
    }
    
    temperature = bmp.readTemperature();
    pressure = bmp.readPressure() / 100.0; // Convert to hPa
    altitude = bmp.readAltitude(seaLevelPressure);
    
    // Sanity checks
    if (temperature < -40 || temperature > 85) {
      Serial.println("[BMP280] Invalid temperature reading");
      return false;
    }
    
    if (pressure < 300 || pressure > 1100) {
      Serial.println("[BMP280] Invalid pressure reading");
      return false;
    }
    
    return true;
  }
  
  void setSeaLevelPressure(float pressure) {
    seaLevelPressure = pressure;
    Serial.print("[BMP280] Sea level pressure set to: ");
    Serial.println(pressure);
  }
};
```

## MPU6050 Accelerometer/Gyroscope

```cpp
#include <MPU6050.h>

class MPU6050Sensor {
private:
  MPU6050 mpu;
  bool initialized = false;
  
  // Calibration offsets
  int16_t ax_offset = 0;
  int16_t ay_offset = 0;
  int16_t az_offset = 0;
  int16_t gx_offset = 0;
  int16_t gy_offset = 0;
  int16_t gz_offset = 0;
  
public:
  bool begin() {
    Wire.begin();
    mpu.initialize();
    
    if (!mpu.testConnection()) {
      Serial.println("[MPU6050] Connection failed");
      return false;
    }
    
    Serial.println("[MPU6050] Connection successful");
    
    // Basic configuration
    mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
    mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_250);
    mpu.setDLPFMode(MPU6050_DLPF_BW_20);
    
    initialized = true;
    
    // Optional: Run calibration
    // calibrate();
    
    return true;
  }
  
  void calibrate(uint16_t samples = 1000) {
    Serial.println("[MPU6050] Starting calibration...");
    Serial.println("Keep sensor still!");
    
    int32_t ax_sum = 0, ay_sum = 0, az_sum = 0;
    int32_t gx_sum = 0, gy_sum = 0, gz_sum = 0;
    
    for (uint16_t i = 0; i < samples; i++) {
      int16_t ax, ay, az, gx, gy, gz;
      mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
      
      ax_sum += ax;
      ay_sum += ay;
      az_sum += az;
      gx_sum += gx;
      gy_sum += gy;
      gz_sum += gz;
      
      if (i % 100 == 0) {
        Serial.print(".");
      }
      
      delay(3);
    }
    Serial.println();
    
    ax_offset = ax_sum / samples;
    ay_offset = ay_sum / samples;
    az_offset = (az_sum / samples) - 16384; // 1g in z-axis
    gx_offset = gx_sum / samples;
    gy_offset = gy_sum / samples;
    gz_offset = gz_sum / samples;
    
    Serial.println("[MPU6050] Calibration complete");
    Serial.print("Offsets: ");
    Serial.print(ax_offset); Serial.print(", ");
    Serial.print(ay_offset); Serial.print(", ");
    Serial.print(az_offset); Serial.print(" | ");
    Serial.print(gx_offset); Serial.print(", ");
    Serial.print(gy_offset); Serial.print(", ");
    Serial.println(gz_offset);
  }
  
  bool readMotion(float &ax, float &ay, float &az, 
                   float &gx, float &gy, float &gz) {
    if (!initialized) return false;
    
    int16_t ax_raw, ay_raw, az_raw;
    int16_t gx_raw, gy_raw, gz_raw;
    
    mpu.getMotion6(&ax_raw, &ay_raw, &az_raw, 
                   &gx_raw, &gy_raw, &gz_raw);
    
    // Apply calibration offsets
    ax_raw -= ax_offset;
    ay_raw -= ay_offset;
    az_raw -= az_offset;
    gx_raw -= gx_offset;
    gy_raw -= gy_offset;
    gz_raw -= gz_offset;
    
    // Convert to real units
    ax = ax_raw / 16384.0; // g
    ay = ay_raw / 16384.0; // g
    az = az_raw / 16384.0; // g
    gx = gx_raw / 131.0;   // degrees/s
    gy = gy_raw / 131.0;   // degrees/s
    gz = gz_raw / 131.0;   // degrees/s
    
    return true;
  }
  
  float getTemperature() {
    if (!initialized) return 0;
    
    int16_t temp = mpu.getTemperature();
    return (temp / 340.0) + 36.53;
  }
};
```

## Light Sensor (LDR/Photoresistor)

```cpp
class LightSensor {
private:
  uint8_t pin;
  uint16_t darkValue = 1023;   // Calibration values
  uint16_t brightValue = 0;
  float emaAlpha = 0.1;         // EMA filter coefficient
  float emaValue = 0;
  bool firstReading = true;
  
public:
  LightSensor(uint8_t sensorPin) : pin(sensorPin) {}
  
  void begin() {
    pinMode(pin, INPUT);
    
    // Take initial reading
    uint16_t initial = analogRead(pin);
    emaValue = initial;
    
    Serial.print("[LIGHT] Sensor on pin ");
    Serial.print(pin);
    Serial.print(" initialized. Reading: ");
    Serial.println(initial);
  }
  
  uint16_t readRaw() {
    return analogRead(pin);
  }
  
  float readFiltered() {
    uint16_t raw = readRaw();
    
    if (firstReading) {
      emaValue = raw;
      firstReading = false;
    } else {
      // Exponential moving average
      emaValue = (emaAlpha * raw) + ((1 - emaAlpha) * emaValue);
    }
    
    return emaValue;
  }
  
  uint8_t readPercent() {
    float filtered = readFiltered();
    
    // Map to percentage based on calibration
    float percent = map(filtered, darkValue, brightValue, 0, 100);
    percent = constrain(percent, 0, 100);
    
    return (uint8_t)percent;
  }
  
  void calibrateDark() {
    darkValue = readRaw();
    Serial.print("[LIGHT] Dark calibrated: ");
    Serial.println(darkValue);
  }
  
  void calibrateBright() {
    brightValue = readRaw();
    Serial.print("[LIGHT] Bright calibrated: ");
    Serial.println(brightValue);
  }
  
  const char* getLightLevel() {
    uint8_t percent = readPercent();
    
    if (percent < 10) return "Very Dark";
    if (percent < 30) return "Dark";
    if (percent < 50) return "Dim";
    if (percent < 70) return "Normal";
    if (percent < 90) return "Bright";
    return "Very Bright";
  }
};
```

## Soil Moisture Sensor

```cpp
class SoilMoistureSensor {
private:
  uint8_t pin;
  uint16_t dryValue = 1023;    // Calibration in air
  uint16_t wetValue = 200;     // Calibration in water
  
  // History for trend detection
  static const uint8_t HISTORY_SIZE = 10;
  uint16_t history[HISTORY_SIZE];
  uint8_t historyIndex = 0;
  bool historyFull = false;
  
public:
  SoilMoistureSensor(uint8_t sensorPin) : pin(sensorPin) {}
  
  void begin() {
    pinMode(pin, INPUT);
    
    // Initialize history
    uint16_t initial = analogRead(pin);
    for (uint8_t i = 0; i < HISTORY_SIZE; i++) {
      history[i] = initial;
    }
    
    Serial.print("[SOIL] Sensor initialized on pin ");
    Serial.print(pin);
    Serial.print(". Reading: ");
    Serial.println(initial);
  }
  
  uint16_t readRaw() {
    uint16_t value = analogRead(pin);
    
    // Update history
    history[historyIndex] = value;
    historyIndex = (historyIndex + 1) % HISTORY_SIZE;
    if (historyIndex == 0) historyFull = true;
    
    return value;
  }
  
  uint8_t readPercent() {
    uint16_t raw = readRaw();
    
    // Map to percentage (0% = dry, 100% = wet)
    int percent = map(raw, dryValue, wetValue, 0, 100);
    percent = constrain(percent, 0, 100);
    
    return (uint8_t)percent;
  }
  
  const char* getMoistureLevel() {
    uint8_t percent = readPercent();
    
    if (percent < 20) return "Very Dry - Water Now!";
    if (percent < 40) return "Dry - Needs Water";
    if (percent < 60) return "Good";
    if (percent < 80) return "Moist";
    return "Very Wet - Stop Watering";
  }
  
  int8_t getTrend() {
    if (!historyFull) return 0;
    
    // Calculate average of first half vs second half
    uint32_t firstHalf = 0;
    uint32_t secondHalf = 0;
    
    for (uint8_t i = 0; i < HISTORY_SIZE/2; i++) {
      firstHalf += history[i];
      secondHalf += history[i + HISTORY_SIZE/2];
    }
    
    firstHalf /= (HISTORY_SIZE/2);
    secondHalf /= (HISTORY_SIZE/2);
    
    // Return trend direction
    if (secondHalf > firstHalf + 10) return 1;  // Getting wetter
    if (secondHalf < firstHalf - 10) return -1; // Getting drier
    return 0; // Stable
  }
  
  void calibrate(bool inWater) {
    uint16_t value = analogRead(pin);
    
    if (inWater) {
      wetValue = value;
      Serial.print("[SOIL] Wet calibration: ");
      Serial.println(wetValue);
    } else {
      dryValue = value;
      Serial.print("[SOIL] Dry calibration: ");
      Serial.println(dryValue);
    }
  }
};
```

## PIR Motion Sensor

```cpp
class PIRSensor {
private:
  uint8_t pin;
  bool lastState = false;
  unsigned long lastMotionTime = 0;
  unsigned long motionStartTime = 0;
  uint32_t motionCount = 0;
  
  // Cooldown period after motion detected
  const unsigned long COOLDOWN_MS = 2000;
  
public:
  PIRSensor(uint8_t sensorPin) : pin(sensorPin) {}
  
  void begin() {
    pinMode(pin, INPUT);
    
    Serial.print("[PIR] Motion sensor on pin ");
    Serial.print(pin);
    Serial.println(" warming up...");
    
    // PIR sensors need warmup time
    delay(30000); // 30 seconds warmup
    
    Serial.println("[PIR] Ready");
  }
  
  bool detectMotion() {
    bool motion = digitalRead(pin) == HIGH;
    
    // Debouncing
    if (motion && !lastState) {
      // Motion started
      if (millis() - lastMotionTime > COOLDOWN_MS) {
        motionStartTime = millis();
        lastMotionTime = millis();
        motionCount++;
        
        Serial.print("[PIR] Motion detected! Count: ");
        Serial.println(motionCount);
        
        lastState = true;
        return true;
      }
    } else if (!motion && lastState) {
      // Motion ended
      unsigned long duration = millis() - motionStartTime;
      Serial.print("[PIR] Motion ended. Duration: ");
      Serial.print(duration);
      Serial.println(" ms");
      
      lastState = false;
    }
    
    return false;
  }
  
  unsigned long getLastMotionTime() {
    return lastMotionTime;
  }
  
  unsigned long getTimeSinceMotion() {
    if (lastMotionTime == 0) return 0;
    return millis() - lastMotionTime;
  }
  
  uint32_t getMotionCount() {
    return motionCount;
  }
  
  void resetCount() {
    motionCount = 0;
    Serial.println("[PIR] Motion count reset");
  }
};
```

## Usage Pattern

Always follow this pattern when implementing sensors:

1. **Test sensor in isolation first**
2. **Include calibration methods**
3. **Add sanity checking on all readings**
4. **Provide both raw and filtered outputs**
5. **Include diagnostic methods**
6. **Handle sensor disconnection gracefully**

Example integration:

```cpp
// Global sensor instances
DHTSensor dht(4, DHT22);
UltrasonicSensor ultrasonic(5, 6);
LightSensor light(A0);

void setup() {
  Serial.begin(115200);
  
  // Initialize each sensor with error checking
  Serial.println("Initializing sensors...");
  
  if (!dht.begin()) {
    Serial.println("WARNING: DHT sensor failed");
  }
  
  ultrasonic.begin();
  light.begin();
  
  Serial.println("Sensor initialization complete");
}

void loop() {
  static unsigned long lastRead = 0;
  
  if (millis() - lastRead > 2000) {
    // Read all sensors
    float temp, humidity;
    if (dht.read(temp, humidity)) {
      Serial.print("Temp: ");
      Serial.print(temp);
      Serial.print("°C, Humidity: ");
      Serial.print(humidity);
      Serial.println("%");
    }
    
    float distance = ultrasonic.readFilteredDistance();
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");
    
    Serial.print("Light: ");
    Serial.print(light.readPercent());
    Serial.print("% - ");
    Serial.println(light.getLightLevel());
    
    lastRead = millis();
  }
}
```
