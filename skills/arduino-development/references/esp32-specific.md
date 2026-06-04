# ESP32 Platform Specifics

## ESP32 Board Variants

### Common ESP32 Boards and Their FQBNs

```bash
# ESP32 DevKit V1
arduino-cli compile --fqbn esp32:esp32:esp32

# ESP32-CAM
arduino-cli compile --fqbn esp32:esp32:esp32 \
  --build-property "build.extra_flags=-DBOARD_HAS_PSRAM -mfix-esp32-psram-cache-issue"

# ESP32-S2
arduino-cli compile --fqbn esp32:esp32:esp32s2

# ESP32-S3
arduino-cli compile --fqbn esp32:esp32:esp32s3

# ESP32-C3
arduino-cli compile --fqbn esp32:esp32:esp32c3
```

## Critical ESP32 Considerations

### 1. Pin Restrictions

```cpp
// ESP32 Pin Usage Guide
class ESP32Pins {
public:
  // Input only pins (no internal pullup)
  const uint8_t INPUT_ONLY[] = {34, 35, 36, 39};
  
  // Strapping pins (avoid or use carefully)
  const uint8_t STRAPPING[] = {0, 2, 5, 12, 15};
  
  // Touch capable pins
  const uint8_t TOUCH[] = {0, 2, 4, 12, 13, 14, 15, 27, 32, 33};
  
  // ADC1 pins (use these when WiFi is active)
  const uint8_t ADC1[] = {32, 33, 34, 35, 36, 39};
  
  // ADC2 pins (don't use when WiFi is active)
  const uint8_t ADC2[] = {0, 2, 4, 12, 13, 14, 15, 25, 26, 27};
  
  // Safe GPIO pins for general use
  const uint8_t SAFE_GPIO[] = {16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33};
  
  bool isSafePin(uint8_t pin) {
    for (uint8_t safe : SAFE_GPIO) {
      if (pin == safe) return true;
    }
    return false;
  }
  
  void printPinInfo(uint8_t pin) {
    Serial.print("Pin ");
    Serial.print(pin);
    Serial.print(": ");
    
    // Check restrictions
    for (uint8_t p : INPUT_ONLY) {
      if (pin == p) {
        Serial.println("INPUT ONLY - No pullup, no output");
        return;
      }
    }
    
    for (uint8_t p : STRAPPING) {
      if (pin == p) {
        Serial.println("STRAPPING PIN - May affect boot");
        return;
      }
    }
    
    if (isSafePin(pin)) {
      Serial.println("Safe for general use");
    } else {
      Serial.println("Check documentation for restrictions");
    }
  }
};
```

### 2. Watchdog Timer

```cpp
// ESP32 requires watchdog management
#include <esp_task_wdt.h>

void setupWatchdog() {
  // Configure watchdog for 10 seconds
  esp_task_wdt_init(10, true);
  esp_task_wdt_add(NULL); // Add current task to WDT
  
  Serial.println("[WDT] Watchdog timer configured for 10s");
}

void feedWatchdog() {
  esp_task_wdt_reset();
}

// Use in loop()
void loop() {
  feedWatchdog();  // Feed the watchdog
  
  // Your code here
  
  yield();  // Allow background tasks to run
}
```

### 3. Dual Core Usage

```cpp
// ESP32 has two cores - use them wisely
class DualCoreManager {
private:
  TaskHandle_t Task1;
  TaskHandle_t Task2;
  
public:
  void begin() {
    // Create task for core 0 (usually WiFi/BT)
    xTaskCreatePinnedToCore(
      core0Task,      // Function
      "Core0Task",    // Name
      10000,          // Stack size
      NULL,           // Parameters
      1,              // Priority
      &Task1,         // Task handle
      0);             // Core number
    
    // Create task for core 1 (usually user code)
    xTaskCreatePinnedToCore(
      core1Task,
      "Core1Task",
      10000,
      NULL,
      1,
      &Task2,
      1);
    
    Serial.println("[DUAL CORE] Tasks created");
  }
  
  static void core0Task(void *pvParameters) {
    Serial.print("[CORE 0] Task running on core ");
    Serial.println(xPortGetCoreID());
    
    for(;;) {
      // Sensor reading, WiFi handling, etc.
      
      vTaskDelay(10); // Delay in ticks
    }
  }
  
  static void core1Task(void *pvParameters) {
    Serial.print("[CORE 1] Task running on core ");
    Serial.println(xPortGetCoreID());
    
    for(;;) {
      // Main application logic
      
      vTaskDelay(10);
    }
  }
};
```

### 4. WiFi + ADC2 Conflict

```cpp
// ADC2 cannot be used while WiFi is active
class WiFiSafeADC {
private:
  bool wifiActive = false;
  
public:
  void setWiFiState(bool active) {
    wifiActive = active;
    Serial.print("[ADC] WiFi is ");
    Serial.println(active ? "ACTIVE - ADC2 disabled" : "INACTIVE - ADC2 enabled");
  }
  
  int readAnalog(uint8_t pin) {
    // Check if pin is ADC2
    uint8_t adc2Pins[] = {0, 2, 4, 12, 13, 14, 15, 25, 26, 27};
    bool isADC2 = false;
    
    for (uint8_t p : adc2Pins) {
      if (pin == p) {
        isADC2 = true;
        break;
      }
    }
    
    if (isADC2 && wifiActive) {
      Serial.print("[ADC] ERROR: Cannot read ADC2 pin ");
      Serial.print(pin);
      Serial.println(" while WiFi is active");
      return -1;
    }
    
    return analogRead(pin);
  }
};
```

## ESP32 Memory Management

```cpp
class ESP32Memory {
public:
  void printHeapInfo() {
    Serial.println("=== ESP32 Memory Info ===");
    Serial.print("Total heap: ");
    Serial.println(ESP.getHeapSize());
    Serial.print("Free heap: ");
    Serial.println(ESP.getFreeHeap());
    Serial.print("Min free heap: ");
    Serial.println(ESP.getMinFreeHeap());
    Serial.print("Max alloc heap: ");
    Serial.println(ESP.getMaxAllocHeap());
    
    #ifdef BOARD_HAS_PSRAM
    Serial.print("Total PSRAM: ");
    Serial.println(ESP.getPsramSize());
    Serial.print("Free PSRAM: ");
    Serial.println(ESP.getFreePsram());
    #endif
  }
  
  bool checkMemory(size_t required) {
    size_t available = ESP.getFreeHeap();
    
    if (available < required) {
      Serial.print("[MEMORY] ERROR: Need ");
      Serial.print(required);
      Serial.print(" bytes but only ");
      Serial.print(available);
      Serial.println(" available");
      return false;
    }
    
    if (available < 10000) {
      Serial.println("[MEMORY] WARNING: Less than 10KB free");
    }
    
    return true;
  }
  
  void* safeMalloc(size_t size) {
    if (!checkMemory(size + 1000)) { // Keep 1KB buffer
      return nullptr;
    }
    
    void* ptr = malloc(size);
    if (ptr == nullptr) {
      Serial.println("[MEMORY] Malloc failed!");
    }
    
    return ptr;
  }
};
```

## ESP32 Deep Sleep

```cpp
class DeepSleepManager {
private:
  RTC_DATA_ATTR int bootCount = 0;  // Survives deep sleep
  
public:
  void printWakeupReason() {
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    
    Serial.print("[SLEEP] Boot count: ");
    Serial.println(++bootCount);
    
    switch(wakeup_reason) {
      case ESP_SLEEP_WAKEUP_EXT0:
        Serial.println("[SLEEP] Wakeup by external signal RTC_IO");
        break;
      case ESP_SLEEP_WAKEUP_EXT1:
        Serial.println("[SLEEP] Wakeup by external signal RTC_CNTL");
        break;
      case ESP_SLEEP_WAKEUP_TIMER:
        Serial.println("[SLEEP] Wakeup by timer");
        break;
      case ESP_SLEEP_WAKEUP_TOUCHPAD:
        Serial.println("[SLEEP] Wakeup by touchpad");
        break;
      case ESP_SLEEP_WAKEUP_ULP:
        Serial.println("[SLEEP] Wakeup by ULP");
        break;
      default:
        Serial.println("[SLEEP] Wakeup not by deep sleep");
        break;
    }
  }
  
  void setupWakeupTimer(uint64_t seconds) {
    esp_sleep_enable_timer_wakeup(seconds * 1000000);
    Serial.print("[SLEEP] Timer wakeup configured for ");
    Serial.print(seconds);
    Serial.println(" seconds");
  }
  
  void setupWakeupPin(uint8_t pin, bool highToWake) {
    esp_sleep_enable_ext0_wakeup((gpio_num_t)pin, highToWake ? 1 : 0);
    Serial.print("[SLEEP] Pin wakeup configured on GPIO");
    Serial.println(pin);
  }
  
  void enterDeepSleep() {
    Serial.println("[SLEEP] Entering deep sleep...");
    Serial.flush();
    esp_deep_sleep_start();
  }
  
  void enterLightSleep(uint64_t milliseconds) {
    esp_sleep_enable_timer_wakeup(milliseconds * 1000);
    esp_light_sleep_start();
  }
};
```

## ESP32 Touch Sensors

```cpp
class TouchSensorManager {
private:
  struct TouchPin {
    uint8_t pin;
    uint16_t threshold;
    bool touched;
    uint16_t baseline;
  };
  
  TouchPin touchPins[10];  // ESP32 has 10 touch pins
  uint8_t numPins = 0;
  
public:
  void addTouchPin(uint8_t pin, uint16_t threshold = 20) {
    if (numPins >= 10) {
      Serial.println("[TOUCH] Maximum pins reached");
      return;
    }
    
    touchPins[numPins].pin = pin;
    touchPins[numPins].threshold = threshold;
    touchPins[numPins].touched = false;
    
    // Read baseline
    delay(100);
    uint16_t sum = 0;
    for (int i = 0; i < 10; i++) {
      sum += touchRead(pin);
      delay(10);
    }
    touchPins[numPins].baseline = sum / 10;
    
    Serial.print("[TOUCH] Pin ");
    Serial.print(pin);
    Serial.print(" configured. Baseline: ");
    Serial.println(touchPins[numPins].baseline);
    
    numPins++;
  }
  
  bool isTouched(uint8_t pin) {
    for (uint8_t i = 0; i < numPins; i++) {
      if (touchPins[i].pin == pin) {
        uint16_t value = touchRead(pin);
        
        // Touch detected when value drops below baseline - threshold
        bool touched = value < (touchPins[i].baseline - touchPins[i].threshold);
        
        // Edge detection
        if (touched && !touchPins[i].touched) {
          touchPins[i].touched = true;
          Serial.print("[TOUCH] Pin ");
          Serial.print(pin);
          Serial.print(" touched! Value: ");
          Serial.println(value);
          return true;
        } else if (!touched && touchPins[i].touched) {
          touchPins[i].touched = false;
          Serial.print("[TOUCH] Pin ");
          Serial.print(pin);
          Serial.println(" released");
        }
        
        return false;
      }
    }
    return false;
  }
  
  void calibrate() {
    Serial.println("[TOUCH] Calibrating... Don't touch!");
    
    for (uint8_t i = 0; i < numPins; i++) {
      uint16_t sum = 0;
      for (int j = 0; j < 20; j++) {
        sum += touchRead(touchPins[i].pin);
        delay(50);
      }
      touchPins[i].baseline = sum / 20;
      
      Serial.print("[TOUCH] Pin ");
      Serial.print(touchPins[i].pin);
      Serial.print(" baseline: ");
      Serial.println(touchPins[i].baseline);
    }
    
    Serial.println("[TOUCH] Calibration complete");
  }
};
```

## ESP32 PWM (LEDC)

```cpp
class ESP32PWM {
private:
  struct PWMChannel {
    uint8_t pin;
    uint8_t channel;
    uint32_t frequency;
    uint8_t resolution;
    bool inUse;
  };
  
  PWMChannel channels[16];  // ESP32 has 16 PWM channels
  
public:
  ESP32PWM() {
    for (int i = 0; i < 16; i++) {
      channels[i].inUse = false;
    }
  }
  
  int8_t setupPWM(uint8_t pin, uint32_t frequency = 5000, uint8_t resolution = 8) {
    // Find free channel
    int8_t channel = -1;
    for (int i = 0; i < 16; i++) {
      if (!channels[i].inUse) {
        channel = i;
        break;
      }
    }
    
    if (channel == -1) {
      Serial.println("[PWM] No free channels");
      return -1;
    }
    
    // Setup channel
    ledcSetup(channel, frequency, resolution);
    ledcAttachPin(pin, channel);
    
    // Store configuration
    channels[channel].pin = pin;
    channels[channel].channel = channel;
    channels[channel].frequency = frequency;
    channels[channel].resolution = resolution;
    channels[channel].inUse = true;
    
    Serial.print("[PWM] Pin ");
    Serial.print(pin);
    Serial.print(" on channel ");
    Serial.print(channel);
    Serial.print(" at ");
    Serial.print(frequency);
    Serial.print("Hz, ");
    Serial.print(resolution);
    Serial.println("-bit");
    
    return channel;
  }
  
  void setPWM(int8_t channel, uint32_t dutyCycle) {
    if (channel < 0 || channel >= 16 || !channels[channel].inUse) {
      Serial.println("[PWM] Invalid channel");
      return;
    }
    
    ledcWrite(channel, dutyCycle);
  }
  
  void fadePWM(int8_t channel, uint32_t from, uint32_t to, uint32_t duration) {
    if (channel < 0 || channel >= 16 || !channels[channel].inUse) {
      return;
    }
    
    uint32_t steps = 100;
    uint32_t stepDelay = duration / steps;
    int32_t stepSize = (to - from) / steps;
    
    for (uint32_t i = 0; i <= steps; i++) {
      uint32_t value = from + (stepSize * i);
      ledcWrite(channel, value);
      delay(stepDelay);
    }
  }
  
  void tone(int8_t channel, uint32_t frequency, uint32_t duration = 0) {
    if (channel < 0 || channel >= 16 || !channels[channel].inUse) {
      return;
    }
    
    ledcWriteTone(channel, frequency);
    
    if (duration > 0) {
      delay(duration);
      ledcWriteTone(channel, 0);
    }
  }
};
```

## ESP32-CAM Specific

```cpp
#ifdef CAMERA_MODEL_AI_THINKER
  #define PWDN_GPIO_NUM     32
  #define RESET_GPIO_NUM    -1
  #define XCLK_GPIO_NUM      0
  #define SIOD_GPIO_NUM     26
  #define SIOC_GPIO_NUM     27
  #define Y9_GPIO_NUM       35
  #define Y8_GPIO_NUM       34
  #define Y7_GPIO_NUM       39
  #define Y6_GPIO_NUM       36
  #define Y5_GPIO_NUM       21
  #define Y4_GPIO_NUM       19
  #define Y3_GPIO_NUM       18
  #define Y2_GPIO_NUM        5
  #define VSYNC_GPIO_NUM    25
  #define HREF_GPIO_NUM     23
  #define PCLK_GPIO_NUM     22
  #define LED_GPIO_NUM       4
#endif

class ESP32Camera {
private:
  bool initialized = false;
  
public:
  bool begin() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    
    // Init with high specs if PSRAM present
    if(psramFound()) {
      config.frame_size = FRAMESIZE_UXGA;
      config.jpeg_quality = 10;
      config.fb_count = 2;
      Serial.println("[CAM] PSRAM found - using high quality");
    } else {
      config.frame_size = FRAMESIZE_SVGA;
      config.jpeg_quality = 12;
      config.fb_count = 1;
      Serial.println("[CAM] No PSRAM - using lower quality");
    }
    
    // Camera init
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
      Serial.printf("[CAM] Init failed with error 0x%x\n", err);
      return false;
    }
    
    initialized = true;
    Serial.println("[CAM] Initialized successfully");
    return true;
  }
  
  bool capturePhoto() {
    if (!initialized) return false;
    
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[CAM] Capture failed");
      return false;
    }
    
    Serial.print("[CAM] Captured ");
    Serial.print(fb->len);
    Serial.println(" bytes");
    
    // Process or save photo here
    
    esp_camera_fb_return(fb);
    return true;
  }
};
```

## Common ESP32 Issues and Solutions

### Issue: Brownout Detector Triggered
```cpp
// Solution 1: Disable brownout detector (not recommended)
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

void disableBrownout() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
}

// Solution 2: Better - use adequate power supply
// Ensure 5V supply can provide at least 500mA
// Add capacitors near ESP32 power pins
```

### Issue: Stack Overflow
```cpp
// Increase stack size for tasks
xTaskCreate(
  taskFunction,
  "TaskName",
  8192,  // Increase stack size (default is often 4096)
  NULL,
  1,
  NULL
);
```

### Issue: WiFi Won't Connect
```cpp
// Common fixes
WiFi.disconnect(true);  // Clear old credentials
WiFi.mode(WIFI_STA);    // Station mode only
WiFi.setSleep(false);   // Disable power saving
delay(100);

// Set static IP if DHCP issues
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(local_IP, gateway, subnet);
```

### Issue: Slow Boot
```cpp
// Skip bootloader messages
void setup() {
  // Reduce boot time by skipping boot messages
  Serial.begin(115200);
  Serial.setDebugOutput(false);  // Disable debug output
  
  // Your code
}
```

## ESP32 Best Practices

1. **Always use RTOS delays in tasks**: `vTaskDelay(pdMS_TO_TICKS(1000))`
2. **Check PSRAM before using**: `if(psramFound()) { ... }`
3. **Use mutex for shared resources between cores**
4. **Keep WiFi and Bluetooth on Core 0**
5. **Run time-critical code on Core 1**
6. **Monitor heap fragmentation**
7. **Use hardware timers for precise timing**
8. **Implement watchdog for production code**
