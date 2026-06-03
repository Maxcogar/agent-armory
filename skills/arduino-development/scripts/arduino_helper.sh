#!/bin/bash

# Arduino Development Helper Script
# Provides common Arduino CLI commands and testing utilities

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_BAUD=115200
DEFAULT_FQBN="arduino:avr:uno"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to detect connected boards
detect_boards() {
    print_color "$BLUE" "=== Detecting Connected Boards ==="
    arduino-cli board list
}

# Function to install required cores
install_cores() {
    print_color "$BLUE" "=== Installing Arduino Cores ==="
    
    arduino-cli config init
    arduino-cli core update-index
    
    print_color "$YELLOW" "Installing AVR core (Arduino Uno, Nano, Mega)..."
    arduino-cli core install arduino:avr
    
    print_color "$YELLOW" "Installing ESP32 core..."
    arduino-cli board list --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
    arduino-cli core install esp32:esp32
    
    print_color "$YELLOW" "Installing ESP8266 core..."
    arduino-cli core install esp8266:esp8266
    
    print_color "$GREEN" "Cores installed successfully!"
}

# Function to create a test blink sketch
create_test_sketch() {
    local sketch_name="${1:-test_blink}"
    
    print_color "$BLUE" "=== Creating Test Sketch: $sketch_name ==="
    
    arduino-cli sketch new "$sketch_name"
    
    cat > "$sketch_name/$sketch_name.ino" << 'EOF'
// Test Blink Sketch with Serial Debug
#define LED_PIN LED_BUILTIN

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { 
    delay(10); 
  }
  
  // Print board info
  Serial.println("=== Board Test Started ===");
  Serial.print("Compiled: ");
  Serial.print(__DATE__);
  Serial.print(" ");
  Serial.println(__TIME__);
  
  #ifdef ESP32
    Serial.print("ESP32 Chip: ");
    Serial.println(ESP.getChipModel());
    Serial.print("Free Heap: ");
    Serial.println(ESP.getFreeHeap());
  #elif defined(ESP8266)
    Serial.println("Board: ESP8266");
    Serial.print("Free Heap: ");
    Serial.println(ESP.getFreeHeap());
  #else
    Serial.println("Board: Arduino AVR");
  #endif
  
  // Configure LED
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED configured on pin " + String(LED_PIN));
  Serial.println("Setup complete!");
}

void loop() {
  static unsigned long lastBlink = 0;
  static unsigned long lastHeartbeat = 0;
  static bool ledState = false;
  static uint32_t loopCount = 0;
  
  // Blink LED every second
  if (millis() - lastBlink >= 1000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
    
    Serial.print("[");
    Serial.print(millis() / 1000);
    Serial.print("s] LED: ");
    Serial.println(ledState ? "ON" : "OFF");
  }
  
  // Heartbeat every 5 seconds
  if (millis() - lastHeartbeat >= 5000) {
    Serial.print("=== Heartbeat === Loops: ");
    Serial.print(loopCount);
    Serial.print(", Free RAM: ");
    
    #ifdef ESP32
      Serial.print(ESP.getFreeHeap());
    #elif defined(ESP8266)
      Serial.print(ESP.getFreeHeap());
    #else
      // AVR free RAM calculation
      extern int __heap_start, *__brkval;
      int v;
      Serial.print((int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval));
    #endif
    
    Serial.println(" bytes");
    lastHeartbeat = millis();
  }
  
  loopCount++;
  
  // Yield for ESP boards
  #if defined(ESP32) || defined(ESP8266)
    yield();
  #endif
}
EOF
    
    print_color "$GREEN" "Test sketch created: $sketch_name"
}

# Function to compile sketch
compile_sketch() {
    local sketch_path="${1:-.}"
    local fqbn="${2:-$DEFAULT_FQBN}"
    
    print_color "$BLUE" "=== Compiling Sketch ==="
    print_color "$YELLOW" "Sketch: $sketch_path"
    print_color "$YELLOW" "Board: $fqbn"
    
    arduino-cli compile --fqbn "$fqbn" --warnings all "$sketch_path"
    
    if [ $? -eq 0 ]; then
        print_color "$GREEN" "Compilation successful!"
    else
        print_color "$RED" "Compilation failed!"
        return 1
    fi
}

# Function to upload sketch
upload_sketch() {
    local sketch_path="${1:-.}"
    local port="${2}"
    local fqbn="${3:-$DEFAULT_FQBN}"
    
    if [ -z "$port" ]; then
        print_color "$RED" "Error: Port not specified"
        print_color "$YELLOW" "Available ports:"
        arduino-cli board list
        return 1
    fi
    
    print_color "$BLUE" "=== Uploading Sketch ==="
    print_color "$YELLOW" "Sketch: $sketch_path"
    print_color "$YELLOW" "Port: $port"
    print_color "$YELLOW" "Board: $fqbn"
    
    arduino-cli upload -p "$port" --fqbn "$fqbn" "$sketch_path"
    
    if [ $? -eq 0 ]; then
        print_color "$GREEN" "Upload successful!"
    else
        print_color "$RED" "Upload failed!"
        return 1
    fi
}

# Function to monitor serial output
monitor_serial() {
    local port="${1}"
    local baud="${2:-$DEFAULT_BAUD}"
    
    if [ -z "$port" ]; then
        print_color "$RED" "Error: Port not specified"
        print_color "$YELLOW" "Available ports:"
        arduino-cli board list
        return 1
    fi
    
    print_color "$BLUE" "=== Serial Monitor ==="
    print_color "$YELLOW" "Port: $port"
    print_color "$YELLOW" "Baud: $baud"
    print_color "$GREEN" "Press Ctrl+C to exit"
    
    arduino-cli monitor -p "$port" --config "baudrate=$baud" --timestamp
}

# Function to run complete test cycle
test_cycle() {
    local port="${1}"
    local fqbn="${2:-$DEFAULT_FQBN}"
    
    if [ -z "$port" ]; then
        print_color "$RED" "Error: Port not specified"
        detect_boards
        return 1
    fi
    
    print_color "$BLUE" "=== Running Complete Test Cycle ==="
    
    # Create test sketch
    create_test_sketch "arduino_test_$$"
    
    # Compile
    if compile_sketch "arduino_test_$$" "$fqbn"; then
        # Upload
        if upload_sketch "arduino_test_$$" "$port" "$fqbn"; then
            # Monitor
            sleep 2
            monitor_serial "$port"
        fi
    fi
    
    # Cleanup
    print_color "$YELLOW" "Cleaning up test sketch..."
    rm -rf "arduino_test_$$"
}

# Function to scan I2C devices
create_i2c_scanner() {
    local sketch_name="i2c_scanner"
    
    print_color "$BLUE" "=== Creating I2C Scanner Sketch ==="
    
    arduino-cli sketch new "$sketch_name"
    
    cat > "$sketch_name/$sketch_name.ino" << 'EOF'
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { delay(10); }
  
  Serial.println("\n=== I2C Scanner ===");
  Serial.println("Scanning for I2C devices...");
  
  Wire.begin();
  
  byte error, address;
  int deviceCount = 0;
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("Device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      deviceCount++;
    } else if (error == 4) {
      Serial.print("Unknown error at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  
  if (deviceCount == 0) {
    Serial.println("\nNo I2C devices found!");
    Serial.println("Check connections:");
    Serial.println("- SDA to A4 (Uno) or GPIO21 (ESP32)");
    Serial.println("- SCL to A5 (Uno) or GPIO22 (ESP32)");
    Serial.println("- Power and GND connected");
    Serial.println("- Pull-up resistors installed");
  } else {
    Serial.print("\nFound ");
    Serial.print(deviceCount);
    Serial.println(" I2C device(s)");
  }
  
  Serial.println("\nScanning complete!");
}

void loop() {
  // Scan every 5 seconds
  delay(5000);
  Serial.println("\n--- Rescanning ---");
  setup();
}
EOF
    
    print_color "$GREEN" "I2C Scanner sketch created: $sketch_name"
}

# Main menu
show_menu() {
    echo
    print_color "$BLUE" "==================================="
    print_color "$BLUE" "   Arduino Development Helper"
    print_color "$BLUE" "==================================="
    echo
    echo "1. Detect connected boards"
    echo "2. Install Arduino cores"
    echo "3. Create test blink sketch"
    echo "4. Create I2C scanner sketch"
    echo "5. Compile sketch"
    echo "6. Upload sketch"
    echo "7. Monitor serial port"
    echo "8. Run complete test cycle"
    echo "9. Exit"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1)
            detect_boards
            ;;
        2)
            install_cores
            ;;
        3)
            read -p "Sketch name (default: test_blink): " name
            create_test_sketch "$name"
            ;;
        4)
            create_i2c_scanner
            ;;
        5)
            read -p "Sketch path (default: current dir): " path
            read -p "Board FQBN (default: $DEFAULT_FQBN): " fqbn
            compile_sketch "${path:-.}" "${fqbn:-$DEFAULT_FQBN}"
            ;;
        6)
            detect_boards
            read -p "Sketch path (default: current dir): " path
            read -p "Port: " port
            read -p "Board FQBN (default: $DEFAULT_FQBN): " fqbn
            upload_sketch "${path:-.}" "$port" "${fqbn:-$DEFAULT_FQBN}"
            ;;
        7)
            detect_boards
            read -p "Port: " port
            read -p "Baud rate (default: $DEFAULT_BAUD): " baud
            monitor_serial "$port" "${baud:-$DEFAULT_BAUD}"
            ;;
        8)
            detect_boards
            read -p "Port: " port
            read -p "Board FQBN (default: $DEFAULT_FQBN): " fqbn
            test_cycle "$port" "${fqbn:-$DEFAULT_FQBN}"
            ;;
        9)
            print_color "$GREEN" "Goodbye!"
            exit 0
            ;;
        *)
            print_color "$RED" "Invalid option!"
            ;;
    esac
}

# Check if arduino-cli is installed
if ! command -v arduino-cli &> /dev/null; then
    print_color "$RED" "Error: arduino-cli not found!"
    print_color "$YELLOW" "Install with: curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh"
    exit 1
fi

# Main loop
while true; do
    show_menu
done
