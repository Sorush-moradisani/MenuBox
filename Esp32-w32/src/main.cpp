#include <Arduino.h>
#include <esp_sleep.h>
#include <WiFi.h>
#include "esp_wifi.h" 
#include <lwip/inet.h> 
#include <ESPmDNS.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include "LittleFS.h"
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <HTTPClient.h>
#include <Update.h>
#include <cmath>

String version = "1.0.0";

#define VBAT_PIN 35
#define BATTV_MAX 4.2
#define BATTV_MIN 3.3
#define BATTV_LOW 3.4
#define CHARGING_PIN 13

#define LED_PIN 2

struct DeviceInfo {
  uint8_t mac[6];
  String ip;
  unsigned long connectTime;
  unsigned long disconnectTime;
};

const int MAX_DEVICES = 20;
DeviceInfo connectedDevices[MAX_DEVICES];
int deviceCount = 0;

const unsigned long disconnectTime = 300000;
const unsigned long blockTime = 10000;

const unsigned long notifDeleteTime = 900000;

String adminsIp[MAX_DEVICES];
int adminIpCount = 0;

const char* hostname = "menu";

const char* ssid = "";
const char* pass = "";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

const char* updatePath = "/update.json";
const char* configPath = "/config.json";
const char* menuPath = "/menu.json";
const char* ordersPath = "/orders.json";
const char* notificationsPath = "/notifications.json";
const char* defaultUpdatePath = "/defaultUpdate.json";
const char* defaultConfigPath = "/defaultConfig.json";
const char* defaultMenuPath = "/defaultMenu.json";

const char* updateMode = "false";

const char* mainUrl = "http://192.168.137.1/esp";

const char* filePaths[] = {
  "/index.html",
  "/dashboard.html",
  "/login.html",
  "/css/styles.css",
  "/css/sign-in.css",
  "/js/config.js",
  "/js/dashboard.js",
  "/js/index.js",
  "/js/login.js",
  "/js/orders.js",
  "/js/sidebars.js",
  "/js/menu.js",
  "/js/all.js",
  "/config.json",
  "/update.json",
  "/menu.json",
  "/defaultConfig.json",
  "/defaultUpdate.json",
  "/defaultMenu.json",
  "/orders.json",
};

void initLittleFS() {
  if (!LittleFS.begin(true)) {
    Serial.println("An error has occurred while mounting LittleFS");
  }
  Serial.println("LittleFS mounted successfully");
}

boolean saveJson(JsonDocument doc, const char * path) {
  File file = LittleFS.open(path, "w");
  if (!file) {
    Serial.println("Failed to open file for writing");
    return false;
  }

  if (serializeJson(doc, file) == 0) {
    Serial.println("Failed to write to file");
  }

  file.close();

  return true;
}

JsonDocument readJson(const char * path) {
  JsonDocument doc;
  File file = LittleFS.open(path, "r");
  if (!file) {
    Serial.println("Failed to open file for reading");
    deserializeJson(doc, "{}");
    return doc;
  }

  DeserializationError error = deserializeJson(doc, file);
  if (error) {
    Serial.print(F("Failed to read file, using default configuration"));
    Serial.println(error.c_str());
    deserializeJson(doc, "{}");
    return doc;
  }

  file.close();

  return doc;
}

String getWSJsonData(String data){
  String parts[2];
  int previousIndex = 0;
  int currentIndex = 0;

  for (int i = 0; i < 2; i++) {
    currentIndex = data.indexOf("::", previousIndex);
    if (currentIndex == -1) {
      parts[i] = data.substring(previousIndex);
      break;
    }
    parts[i] = data.substring(previousIndex, currentIndex);
    previousIndex = currentIndex + 1;
  }
  return parts[0];
}

void cleanMaxOrdersData() {
  JsonDocument orders = readJson(ordersPath);
  JsonArray ordersArray = orders.as<JsonArray>();
  int readyCount = 0;
  for(int i=0; i<ordersArray.size();i++){
    if(ordersArray[i]["status"] == "isReady"){
      readyCount++;
    }
  }
  if(readyCount > 500){
    for(int i=ordersArray.size()-1; i==0;i--){
      if(orders[i]["status"] == "isReady"){
        orders.remove(i);
        break;
      }
    }
  }
  saveJson(orders,ordersPath);
}

void deleteOldNotifications() {
  JsonDocument notifs = readJson(notificationsPath);
  JsonArray notifsArray = notifs.as<JsonArray>();
  bool edited = false;
  for(int i=0; i<notifsArray.size();i++){
    if(millis() - (long)notifsArray[i]["millis"] > notifDeleteTime){
      notifsArray.remove(i);
      edited = true;
    }
  }
  if(edited){
    saveJson(notifs, notificationsPath);
    JsonDocument notifs2;
    notifs2["title"] = "notifs";
    notifs2["data"] = notifs;
    String json;
    serializeJson(notifs2, json);
    ws.textAll(json);
  }
}

void WiFiEvent(WiFiEvent_t event, arduino_event_info_t info) {
  if(event == ARDUINO_EVENT_WIFI_AP_STACONNECTED){
    for (int i = 0; i < deviceCount; i++) {
      if (memcmp(connectedDevices[i].mac, info.wifi_ap_stadisconnected.mac, 6) == 0) {
        connectedDevices[i].connectTime = millis();
        break;
      }
    }
  }
  if(event == ARDUINO_EVENT_WIFI_AP_STADISCONNECTED){
    for (int i = 0; i < deviceCount; i++) {
      if (memcmp(connectedDevices[i].mac, info.wifi_ap_stadisconnected.mac, 6) == 0) {
        for (int j = 0; j < adminIpCount; j++) {
          if (adminsIp[j] == connectedDevices[i].ip) {
            for (int k = j; k < adminIpCount - 1; k++) {
              adminsIp[k] = adminsIp[k + 1];
            }
            adminIpCount--;
            break;
          }
        }
        connectedDevices[i].disconnectTime = millis();
        break;
      }
    }
  }
}

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT){
    IPAddress ip = client->remoteIP();
    adminsIp[adminIpCount] = ip.toString();
    adminIpCount++;
  }
  if (type == WS_EVT_DATA) {
    String jsonData = String((char*)data);
    JsonDocument cmd;
    deserializeJson(cmd, jsonData);
    if(cmd["command"] == "seen"){
      JsonDocument notifs = readJson(notificationsPath);
      JsonArray notifsArray = notifs.as<JsonArray>();
      for(int i=0; i<notifsArray.size();i++){
        if(notifsArray[i]["id"] == cmd["id"]){
          notifsArray[i]["status"] = "seen";
        }
      }
      saveJson(notifs, notificationsPath);
      JsonDocument notifs2;
      notifs2["title"] = "notifs";
      notifs2["data"] = notifs;
      String json;
      serializeJson(notifs2, json);
      ws.textAll(json);
    } else if (cmd["command"] == "cancel" || cmd["command"] == "inProgress" || cmd["command"] == "isReady"){
      JsonDocument orders = readJson(ordersPath);
      JsonArray ordersArray = orders.as<JsonArray>();
      for(int i=0; i<ordersArray.size();i++){
        if(ordersArray[i]["id"] == cmd["id"]){
          if(cmd["command"] == "cancel"){
            ordersArray.remove(i);
          } else {
            ordersArray[i]["status"] = cmd["command"];
          }
        }
      }
      saveJson(orders, ordersPath);
      JsonDocument notRedayOrders;
      JsonArray notReadyOrdersArray = notRedayOrders.to<JsonArray>();
      for(JsonVariant v : ordersArray){
        if(v["status"] != "isReady"){
          notReadyOrdersArray.add(v);
        }
      }
  
      JsonDocument notRedayOrders2;
      notRedayOrders2["title"] = "orders";
      notRedayOrders2["data"] = notRedayOrders;
      String json;
      serializeJson(notRedayOrders2, json);
      ws.textAll(json);
    } else {
      JsonDocument orders = readJson(ordersPath);
      JsonArray ordersArray = orders.as<JsonArray>();
      for(int i=0; i<ordersArray.size();i++){
        if(ordersArray[i]["id"] == cmd["id"]){
          if(cmd["command"] == "cancel"){
            ordersArray.remove(i);
          } else {
            ordersArray[i]["status"] = cmd["command"];
          }
        }
      }
      saveJson(orders, ordersPath);
      JsonDocument notRedayOrders;
      JsonArray notReadyOrdersArray = notRedayOrders.to<JsonArray>();
      for(JsonVariant v : ordersArray){
        if(v["status"] != "isReady"){
          notReadyOrdersArray.add(v);
        }
      }
  
      JsonDocument notRedayOrders2;
      notRedayOrders2["title"] = "orders";
      notRedayOrders2["data"] = notRedayOrders;
      String json;
      serializeJson(notRedayOrders2, json);
      ws.textAll(json);
      JsonDocument notifs = readJson(notificationsPath);
      JsonDocument notifs2;
      notifs2["title"] = "notifs";
      notifs2["data"] = notifs;
      String json2;
      serializeJson(notifs2, json2);
      ws.textAll(json2);
    }
  }
}

void disableUpadteMode() {
    JsonDocument update = readJson(updatePath);
    update["updateMode"] = "false";
    saveJson(update,updatePath);
}

bool downloadAndUpdateFile(const char* url, const char* path) {
  HTTPClient http;
  http.begin(url);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    File file = LittleFS.open(path, "w");
    if (!file) {
      Serial.println("Failed to open file for writing");
      http.end();
      return false;
    }

    int len = http.getSize();
    uint8_t buff[128] = { 0 };

    WiFiClient* stream = http.getStreamPtr();
    while (http.connected() && (len > 0 || len == -1)) {
      size_t size = stream->available();
      if (size) {
        int c = stream->readBytes(buff, ((size > sizeof(buff)) ? sizeof(buff) : size));
        file.write(buff, c);
        if (len > 0) {
          len -= c;
        }
      }
      delay(1);
    }

    file.close();
    http.end();
    return true;
  } else {
    Serial.printf("HTTP request failed, error: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }
}

void startOTA() {
    ArduinoOTA.setHostname("esp32-device");

    ArduinoOTA.onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH) {
            type = "sketch";
        } else { // U_FS
            type = "filesystem";
        }
        Serial.println("Start updating " + type);
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\nEnd");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    });

    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("End Failed");
    });

    ArduinoOTA.begin();

    Serial.println("Ready for OTA updates");
}

void firmwareUpdate() {
    startOTA();

    HTTPClient http;

    http.begin(mainUrl + *"/firmware.bin");
    int httpCode = http.GET();

    if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
            size_t contentLength = http.getSize();
            WiFiClient * stream = http.getStreamPtr();

            if (Update.begin(contentLength)) {
                size_t written = Update.writeStream(*stream);

                if (written == contentLength) {
                    Serial.println("Written : " + String(written) + " successfully");
                } else {
                    Serial.println("Written only : " + String(written) + "/" + String(contentLength) + ". Retry?");
                }

                if (Update.end()) {
                    Serial.println("OTA done!");
                    if (Update.isFinished()) {
                        Serial.println("Update successfully completed. Rebooting.");
                    } else {
                        Serial.println("Update not finished? Something went wrong!");
                    }
                } else {
                    Serial.println("Error Occurred. Error #: " + String(Update.getError()));
                }
            } else {
                Serial.println("Not enough space to begin OTA");
            }
        }
    } else {
        Serial.printf("HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
    disableUpadteMode();
    ESP.restart();
}

void updateAllFiles() {
  for (int i = 0; i < sizeof(filePaths) / sizeof(filePaths[0]); i++) {
    const char* url = mainUrl + *"/data" + *filePaths[i];
    const char* path = filePaths[i];

    Serial.printf("Updating file: %s\n", path);

    if (!downloadAndUpdateFile(url, path)) {
      Serial.printf("Failed to update file: %s\n", path);
    } else {
      Serial.printf("File updated successfully: %s\n", path);
    }
  }
  
  firmwareUpdate();
}

void setup() {
  pinMode(VBAT_PIN, INPUT);
  pinMode(CHARGING_PIN, INPUT);
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);

  initLittleFS();
  
  JsonDocument update = readJson(updatePath);
  updateMode = update["updateMode"];
  
  if(String(updateMode) == "true"){
    const char* ssid = update["ssid"];
    const char* pass = update["pass"];
    
    WiFi.begin(ssid, pass);

    char i = 0;

    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
      i++;
      if(i > 20){
        disableUpadteMode();
        delay(1000);
        ESP.restart();
      }
    }

    digitalWrite(LED_PIN, HIGH);

    updateAllFiles();
    
    return;
  }

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  digitalWrite(LED_PIN, LOW);

  JsonDocument config = readJson(configPath);
  ssid = config["ssid"];
  pass = config["pass"];

  Serial.println("Setting AP (Access Point)");
  
  if(ssid==""){
    WiFi.softAP("MenuBox V1.0", "");
  } else{
    WiFi.softAP(ssid, pass, 1, 0, MAX_DEVICES);
  }

  WiFi.onEvent(WiFiEvent);

  delay(1000);

  if (!MDNS.begin(hostname)) {
    Serial.println("Error setting up mDNS responder!");
    while(1) {
        delay(1000);
    }
  }
  MDNS.addService("http", "tcp", 80);

  esp_wifi_set_inactive_time(WIFI_IF_AP, 10);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(LittleFS, "/index.html", "text/html");
  });
  
  server.serveStatic("/", LittleFS, "/");

  server.on("/getSiteData", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    JsonDocument siteData;
    siteData["siteTitle"] = config["siteTitle"];
    siteData["orderActive"] = config["orderActive"];
    siteData["theme"] = config["theme"];
    siteData["primaryColor"] = config["primaryColor"];
    String json;
    serializeJson(siteData, json);
    request->send(200, "application/json", json);
  });

  server.on("/login", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int params = request->params();
    for(int i=0;i<params;i++){
      const AsyncWebParameter* p = request->getParam(i);
      if(p->isPost()){
        if (p->name() == "username") {
          adminUsername = p->value();
        }
        if (p->name() == "password") {
          adminPassword = p->value();
        }
      }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      String json;
      serializeJson(config, json);
      request->send(200, "application/json", json);
    } else {
      request->send(403, "application/json", "{\"status\":\"نام کاربری یا رمز عبور اشتباه است!\"}");
    }
  });

  server.on("/getConfig", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      config["version"] = version;
      String json;
      serializeJson(config, json);
      request->send(200, "application/json", json);
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/setConfig", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String jsonn;
    serializeJson(config, jsonn);
    JsonDocument config2;
    deserializeJson(config2,jsonn);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      String data;
      int params = request->params();
      for(int i=0;i<params;i++){
        const AsyncWebParameter* p = request->getParam(i);
        if(p->isPost()){
          if (p->name() == "data") {
            data = p->value();
          }
        }
      }
      deserializeJson(config,data);
      saveJson(config, configPath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
      const char* ssid = config2["ssid"];
      const char* pass = config2["pass"];
      const char* ssidNew = config["ssid"];
      const char* passNew = config["pass"];
      if(String(ssidNew) != String(ssid) || String(passNew) != String(pass)){
        delay(1000);
        ESP.restart();
      }
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/setUpdateMode", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      JsonDocument update = readJson(updatePath);
      String ssid;
      String pass;
      int params = request->params();
      for(int i=0;i<params;i++){
        const AsyncWebParameter* p = request->getParam(i);
        if(p->isPost()){
          if (p->name() == "ssid") {
            ssid = p->value();
          }
          if (p->name() == "pass") {
            pass = p->value();
          }
        }
      }
      update["updateMode"] = "true";
      update["updateFilesMode"] = "true";
      update["ssid"] = ssid;
      update["pass"] = pass;
      saveJson(update, updatePath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
      delay(1000);
      ESP.restart();
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/resetFactory", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
      if (h->name() == "adminUsername") {
        adminUsername = h->value();
      }
      if (h->name() == "adminPassword") {
        adminPassword = h->value();
      }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      String menu;
      String orders;
      int params = request->params();
      for(int i=0;i<params;i++){
        const AsyncWebParameter* p = request->getParam(i);
        if(p->isPost()){
          if (p->name() == "menu") {
            menu = p->value();
          }
          if (p->name() == "orders") {
            orders = p->value();
          }
        }
      }
      JsonDocument defaultConfig = readJson(defaultConfigPath);
      saveJson(defaultConfig, configPath);
      JsonDocument defaultUpdate = readJson(defaultUpdatePath);
      saveJson(defaultUpdate, updatePath);
      if(menu == "true"){
        JsonDocument defaultMenu = readJson(defaultMenuPath);
        saveJson(defaultMenu, menuPath);
      }
      if(orders == "true"){
        JsonDocument defaultOrders;
        deserializeJson(defaultOrders, "[]");
        saveJson(defaultOrders, ordersPath);
      }
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
      delay(1000);
      ESP.restart();
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/getMenu", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument menu = readJson(menuPath);
    String json;
    serializeJson(menu, json);
    request->send(200, "application/json", json);
  });

  server.on("/clearMenu", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      JsonDocument menu;
      deserializeJson(menu,"[]");
      saveJson(menu, menuPath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/setMenu", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      String data;
      int params = request->params();
      for(int i=0;i<params;i++){
        const AsyncWebParameter* p = request->getParam(i);
        if(p->isPost()){
          if (p->name() == "data") {
            data = p->value();
          }
        }
      }
      JsonDocument menu;
      deserializeJson(menu,data);
      JsonDocument menus = readJson(menuPath);
      JsonArray menusArray = menus.as<JsonArray>();
      bool exist = false;
      for(int i=0; i< menusArray.size(); i++){
        if(menu["id"] == menusArray[i]["id"]){
          exist = true;
          menusArray[i] = menu;
        }
      }
      if(!exist){
        menusArray.add(menu);
      }
      saveJson(menus, menuPath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/addOrder", HTTP_POST, [](AsyncWebServerRequest *request) {
    String data;
    int params = request->params();
    for(int i=0;i<params;i++){
      const AsyncWebParameter* p = request->getParam(i);
      if(p->isPost()){
        if (p->name() == "data") {
          data = p->value();
        }
      }
    }
    JsonDocument order;
    deserializeJson(order,data);
    JsonDocument orders = readJson(ordersPath);
    JsonDocument orders2;
    JsonArray array = orders.as<JsonArray>();
    JsonArray array2 = orders2.to<JsonArray>();
    array2.add(order);
    for (JsonVariant v : array) {
      array2.add(v);
    }
    array.clear();
    for (JsonVariant v : array2) {
      array.add(v);
    }
    saveJson(orders, ordersPath);
    JsonDocument orders3;
    orders3["title"] = "orders";
    orders3["data"] = orders;
    String json;
    serializeJson(orders3, json);
    ws.textAll(json);
    cleanMaxOrdersData();
    request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
  });

  server.on("/deleteOrders", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      JsonDocument orders;
      deserializeJson(orders,"[]");
      saveJson(orders, ordersPath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/addNotif", HTTP_POST, [](AsyncWebServerRequest *request) {
    String data;
    int params = request->params();
    for(int i=0;i<params;i++){
      const AsyncWebParameter* p = request->getParam(i);
      if(p->isPost()){
        if (p->name() == "data") {
          data = p->value();
        }
      }
    }
    JsonDocument notif;
    deserializeJson(notif,data);
    notif["millis"] = millis();
    JsonDocument notifs = readJson(notificationsPath);
    JsonDocument notifs2;
    JsonArray array = notifs.as<JsonArray>();
    JsonArray array2 = notifs2.to<JsonArray>();
    array2.add(notif);
    for (JsonVariant v : array) {
      array2.add(v);
    }
    array.clear();
    for (JsonVariant v : array2) {
      array.add(v);
    }
    saveJson(notifs, notificationsPath);
    JsonDocument notifs3;
    notifs3["title"] = "notifs";
    notifs3["data"] = notifs;
    String json;
    serializeJson(notifs3, json);
    ws.textAll(json);
    request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
  });

  server.on("/deleteNotifications", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      JsonDocument notifications;
      deserializeJson(notifications,"[]");
      saveJson(notifications, notificationsPath);
      request->send(200, "application/json", "{\"status\":\"انجام شد\"}");
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  server.on("/getReadyOrders", HTTP_POST, [](AsyncWebServerRequest *request) {
    JsonDocument config = readJson(configPath);
    String adminUsername;
    String adminPassword;
    int headersCount = request->headers();
    for (int i = 0; i < headersCount; i++) {
      const AsyncWebHeader* h = request->getHeader(i);
        if (h->name() == "adminUsername") {
          adminUsername = h->value();
        }
        if (h->name() == "adminPassword") {
          adminPassword = h->value();
        }
    }
    JsonDocument orders = readJson(ordersPath);
    int length;
    int params = request->params();
    for(int i=0;i<params;i++){
      const AsyncWebParameter* p = request->getParam(i);
      if(p->isPost()){
        if (p->name() == "length") {
          length = p->value().toInt();
        }
      }
    }
    if(adminUsername == config["username"] && adminPassword == config["password"]){
      JsonDocument orders = readJson(ordersPath);
      JsonDocument readyOrders;
      JsonDocument readyOrders20;
      JsonArray ordersArray = orders.as<JsonArray>();
      JsonArray readyOrdersArray = readyOrders.to<JsonArray>();
      JsonArray readyOrders20Array = readyOrders20.to<JsonArray>();
      for (JsonVariant v : ordersArray) {
        if(v["status"] == "isReady"){
          readyOrdersArray.add(v);
        }
      }
      int max = length + 20;
      if(max > readyOrdersArray.size()){
        max = readyOrdersArray.size();
      }
      for (int i=length; i<max; i++) {
          readyOrders20Array.add(readyOrdersArray[i]);
      }
      String json;
      serializeJson(readyOrders20Array, json);
      request->send(200, "application/json", json);
    } else {
      request->send(403, "application/json", "{\"status\":\"شما دسترسی لازم رو ندارید!\"}");
    }
  });

  ws.onEvent(onWebSocketEvent);
  server.addHandler(&ws);
  server.begin();
}

int calculateBatteryPercentage(float voltage) {
  int percentage = (int)ceil(((voltage - BATTV_MIN) / (BATTV_MAX - BATTV_MIN)) * 100);
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  return percentage;
}

void loop() {
  if(String(updateMode) == "true") {
    ArduinoOTA.handle();
  } else {
    float batteryVoltage = ((float)analogRead(VBAT_PIN) / 4095) * 3.3 * 2 * 1.05;
    int batteryPercentage = calculateBatteryPercentage(batteryVoltage);
    bool isCharging = digitalRead(CHARGING_PIN);
    JsonDocument batteryStatus;
    batteryStatus["batteryPercentage"] = batteryPercentage;
    batteryStatus["isCharging"] = isCharging;
    String json;
    serializeJson(batteryStatus, json);
    ws.textAll(json);
    
    ws.cleanupClients();

    if (batteryVoltage < BATTV_LOW) {
      //esp_sleep_enable_ext0_wakeup(GPIO_NUM_13, HIGH);
      //esp_deep_sleep_start();
    }
  }

  wifi_sta_list_t sta_list;
  memset(&sta_list, 0, sizeof(sta_list));
  esp_wifi_ap_get_sta_list(&sta_list);
  tcpip_adapter_sta_list_t adapter_sta_list;
  memset(&adapter_sta_list, 0, sizeof(adapter_sta_list));
  tcpip_adapter_get_sta_list(&sta_list, &adapter_sta_list);

  for (int i = 0; i < sta_list.num; i++) {
    wifi_sta_info_t sta = sta_list.sta[i];
    bool deviceFound = false;

    for (int j = 0; j < deviceCount; j++) {
      if (memcmp(connectedDevices[j].mac, sta.mac, 6) == 0) {
        deviceFound = true;
        if (millis() - connectedDevices[j].connectTime >= disconnectTime || (connectedDevices[i].disconnectTime > 0 && (millis() - connectedDevices[i].disconnectTime) < blockTime)) {
          uint16_t aid;
          esp_wifi_ap_get_sta_aid(sta.mac, &aid);
          bool exist = false;
          for (int k = 0; k < adminIpCount; k++) {
            if (adminsIp[k] == connectedDevices[j].ip) {
              exist = true;
            }
          }
          if(!exist){
            esp_wifi_deauth_sta(aid);
            Serial.print("disconnected ");
            Serial.println(connectedDevices[j].ip);
          }
        } else if (connectedDevices[i].disconnectTime > 0 && (millis() - connectedDevices[i].disconnectTime) >= blockTime) {
          connectedDevices[i].disconnectTime = 0;
        }
        break;
      }
    }

    if (!deviceFound && deviceCount < MAX_DEVICES) {
      memcpy(connectedDevices[deviceCount].mac, sta.mac, 6);
      for (int i = 0; i < adapter_sta_list.num; i++) {
        tcpip_adapter_sta_info_t station = adapter_sta_list.sta[i];
        String ip = String(ip4addr_ntoa((const ip4_addr_t*)&station.ip));
        if(memcmp(station.mac, sta.mac, 6) == 0 && !ip.startsWith("0")){
          connectedDevices[deviceCount].ip = ip;
        }
      }
      connectedDevices[deviceCount].connectTime = millis();
      connectedDevices[deviceCount].disconnectTime = 0;
      deviceCount++;
    }
  }

  deleteOldNotifications();

  delay(3000);
}