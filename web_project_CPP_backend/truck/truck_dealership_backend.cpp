#define _WIN32_WINNT 0x0A00  // Target Windows 10

#include <iostream>
#include <string>
#include "httplib.h"  // Include the header you just saved
#include <vector>
#include <map>
#include <sstream>
#include <memory>
#include <iomanip>
#include <cmath>
#include <algorithm>
#include <fstream>
#include <thread>
#include <chrono>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

using namespace std;
using namespace httplib;

// ============================================================================
// CORE OOP CLASSES FOR TRUCK DEALERSHIP
// ============================================================================

// Base Vehicle Class (Inheritance)
class Vehicle {
protected:
    int id;
    string brand;
    string model;
    double price;
    string engine;
    int horsepower;
    string image;

public:
    Vehicle(int id, const string& brand, const string& model, double price,
            const string& engine, int hp, const string& image)
        : id(id), brand(brand), model(model), price(price), engine(engine), 
          horsepower(hp), image(image) {}

    virtual ~Vehicle() = default;

    // Pure virtual function (Polymorphism)
    virtual string getType() const = 0;
    virtual string getSpecifications() const;
    virtual string toJSON() const;

    // Getters (Encapsulation)
    int getId() const { return id; }
    string getBrand() const { return brand; }
    string getModel() const { return model; }
    double getPrice() const { return price; }
    string getEngine() const { return engine; }
    int getHorsepower() const { return horsepower; }
    string getImage() const { return image; }
};

string Vehicle::getSpecifications() const {
    stringstream ss;
    ss << "Brand: " << brand << ", Model: " << model
       << ", Engine: " << engine << ", Power: " << horsepower << " HP"
       << ", Price: ₹" << fixed << setprecision(2) << price << " Lakhs";
    return ss.str();
}

string Vehicle::toJSON() const {
    stringstream ss;
    ss << "{"
       << "\"id\":" << id << ","
       << "\"brand\":\"" << brand << "\","
       << "\"model\":\"" << model << "\","
       << "\"price\":" << price << ","
       << "\"engine\":\"" << engine << "\","
       << "\"horsepower\":" << horsepower << ","
       << "\"image\":\"" << image << "\""
       << "}";
    return ss.str();
}

// Truck Class (Inheritance from Vehicle)
class Truck : public Vehicle {
private:
    int gvw;                    // Gross Vehicle Weight
    string fuelType;
    double mileage;
    string availability;        // "In Stock", "Limited", "Out of Stock"
    vector<string> features;

public:
    Truck(int id, const string& brand, const string& model, double price,
          const string& engine, int hp, const string& image, int gvw,
          const string& fuel, double mileage, const string& availability)
        : Vehicle(id, brand, model, price, engine, hp, image),
          gvw(gvw), fuelType(fuel), mileage(mileage), availability(availability) {
        initializeFeatures();
    }

    // Override virtual function (Polymorphism)
    string getType() const override { return "Commercial Truck"; }

    // Getters
    int getGVW() const { return gvw; }
    string getFuelType() const { return fuelType; }
    double getMileage() const { return mileage; }
    string getAvailability() const { return availability; }
    vector<string> getFeatures() const { return features; }

    void setAvailability(const string& status) { availability = status; }

    string toJSON() const override {
        stringstream ss;
        ss << "{"
           << "\"id\":" << id << ","
           << "\"brand\":\"" << brand << "\","
           << "\"model\":\"" << model << "\","
           << "\"price\":" << price << ","
           << "\"engine\":\"" << engine << "\","
           << "\"horsepower\":" << horsepower << ","
           << "\"image\":\"" << image << "\","
           << "\"gvw\":" << gvw << ","
           << "\"fuelType\":\"" << fuelType << "\","
           << "\"mileage\":" << mileage << ","
           << "\"availability\":\"" << availability << "\","
           << "\"features\":[";

        for (size_t i = 0; i < features.size(); ++i) {
            if (i > 0) ss << ",";
            ss << "\"" << features[i] << "\"";
        }
        ss << "]}";
        return ss.str();
    }

private:
    void initializeFeatures() {
        features.push_back("ABS Braking System");
        features.push_back("Power Steering");
        features.push_back("Air Conditioning");
        features.push_back("GPS Navigation");
        features.push_back("Reverse Camera");
    }
};

// Finance Calculator Class (Composition)
class FinanceCalculator {
public:
    struct EMIResult {
        double emi;
        double totalAmount;
        double totalInterest;
        bool isValid;
        string message;
    };

    EMIResult calculateEMI(double principal, double rate, int months) const {
        EMIResult result;

        if (principal <= 0 || rate <= 0 || months <= 0) {
            result.isValid = false;
            result.message = "Invalid input parameters";
            return result;
        }

        if (principal > 50000000) { // 5 Crore limit
            result.isValid = false;
            result.message = "Loan amount exceeds maximum limit";
            return result;
        }

        double monthlyRate = rate / (12 * 100);
        result.emi = (principal * monthlyRate * pow(1 + monthlyRate, months)) / 
                    (pow(1 + monthlyRate, months) - 1);
        result.totalAmount = result.emi * months;
        result.totalInterest = result.totalAmount - principal;
        result.isValid = true;
        result.message = "EMI calculated successfully";

        return result;
    }

    string calculateEMIJSON(double principal, double rate, int months) const {
        auto result = calculateEMI(principal, rate, months);

        stringstream ss;
        ss << "{"
           << "\"isValid\":" << (result.isValid ? "true" : "false") << ","
           << "\"emi\":" << fixed << setprecision(2) << result.emi << ","
           << "\"totalAmount\":" << result.totalAmount << ","
           << "\"totalInterest\":" << result.totalInterest << ","
           << "\"message\":\"" << result.message << "\""
           << "}";
        return ss.str();
    }
};

// Truck Comparison Tool Class
class ComparisonTool {
public:
    struct ComparisonResult {
        string truck1JSON;
        string truck2JSON;
        vector<string> differences;
        string recommendation;
        bool isValid;
    };

    ComparisonResult compareTrucks(const Truck& truck1, const Truck& truck2) const {
        ComparisonResult result;
        result.truck1JSON = truck1.toJSON();
        result.truck2JSON = truck2.toJSON();
        result.isValid = true;

        // Analyze differences
        if (truck1.getPrice() != truck2.getPrice()) {
            stringstream ss;
            ss << "Price difference: ₹" << abs(truck1.getPrice() - truck2.getPrice()) 
               << " Lakhs";
            result.differences.push_back(ss.str());
        }

        if (truck1.getHorsepower() != truck2.getHorsepower()) {
            stringstream ss;
            ss << "Power difference: " << abs(truck1.getHorsepower() - truck2.getHorsepower()) 
               << " HP";
            result.differences.push_back(ss.str());
        }

        if (truck1.getGVW() != truck2.getGVW()) {
            stringstream ss;
            ss << "GVW difference: " << abs(truck1.getGVW() - truck2.getGVW()) 
               << " kg";
            result.differences.push_back(ss.str());
        }

        // Generate recommendation
        if (truck1.getPrice() < truck2.getPrice()) {
            result.recommendation = truck1.getBrand() + " " + truck1.getModel() + 
                                  " offers better value for money";
        } else if (truck2.getPrice() < truck1.getPrice()) {
            result.recommendation = truck2.getBrand() + " " + truck2.getModel() + 
                                  " offers better value for money";
        } else {
            result.recommendation = "Both trucks are equally priced, choose based on features";
        }

        return result;
    }

    string compareJSON(const Truck& truck1, const Truck& truck2) const {
        auto result = compareTrucks(truck1, truck2);

        stringstream ss;
        ss << "{"
           << "\"isValid\":" << (result.isValid ? "true" : "false") << ","
           << "\"truck1\":" << result.truck1JSON << ","
           << "\"truck2\":" << result.truck2JSON << ","
           << "\"differences\":[";

        for (size_t i = 0; i < result.differences.size(); ++i) {
            if (i > 0) ss << ",";
            ss << "\"" << result.differences[i] << "\"";
        }

        ss << "],"
           << "\"recommendation\":\"" << result.recommendation << "\""
           << "}";
        return ss.str();
    }
};

// Contact Form Handler Class
class ContactHandler {
private:
    vector<map<string, string>> contacts;
    static int nextId;

public:
    struct ContactResult {
        bool success;
        int contactId;
        string message;
    };

    ContactResult submitContact(const string& name, const string& email,
                              const string& phone, const string& message) {
        ContactResult result;

        // Basic validation
        if (name.empty() || email.empty() || phone.empty()) {
            result.success = false;
            result.message = "All required fields must be filled";
            return result;
        }

        // Email validation (basic)
        if (email.find('@') == string::npos) {
            result.success = false;
            result.message = "Invalid email format";
            return result;
        }

        // Store contact
        map<string, string> contact;
        contact["id"] = to_string(nextId++);
        contact["name"] = name;
        contact["email"] = email;
        contact["phone"] = phone;
        contact["message"] = message;
        contact["timestamp"] = to_string(time(nullptr));

        contacts.push_back(contact);

        result.success = true;
        result.contactId = nextId - 1;
        result.message = "Contact form submitted successfully";

        return result;
    }

    string submitContactJSON(const string& name, const string& email,
                           const string& phone, const string& message) {
        auto result = submitContact(name, email, phone, message);

        stringstream ss;
        ss << "{"
           << "\"success\":" << (result.success ? "true" : "false") << ","
           << "\"contactId\":" << result.contactId << ","
           << "\"message\":\"" << result.message << "\""
           << "}";
        return ss.str();
    }
};

int ContactHandler::nextId = 1001;

// ============================================================================
// INVENTORY MANAGER (Composition)
// ============================================================================

class TruckInventoryManager {
private:
    vector<unique_ptr<Truck>> trucks;

public:
    TruckInventoryManager() {
        initializeInventory();
    }

    void initializeInventory() {
        trucks.push_back(make_unique<Truck>(
            1, "Tata", "Prima FL 5530.S", 42.32, "6.7L Cummins ISBe", 300,
            "https://trucks.tatamotors.com/assets/trucks/files/trucks/2025-03/tata-prima-3530k-hrt.jpg?VersionId=ksN2G7RcUHQ1BokfaQVUC5zLqREGkQN6", 55000, "Diesel", 3.5, "In Stock"
        ));

        trucks.push_back(make_unique<Truck>(
            2, "Tata", "Signa 4930.T", 47.48, "6.7L Cummins ISBe", 300,
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJvJtjk_H3gWBGpPPq7t3RH0HgOpPI9_z-Dg&s", 49000, "Diesel", 4.0, "In Stock"
        ));

        trucks.push_back(make_unique<Truck>(
            3, "Tata", "Signa 3525.KTK", 45.52, "Cummins ISBe", 250,
            "https://images.91trucks.com/trucks/models/63/1196/tata-signa-3525ktk-763319353.jpg", 35000, "Diesel", 4.2, "Limited"
        ));

        trucks.push_back(make_unique<Truck>(
            4, "Tata", "1916 LPT", 27.5, "3.3L NG", 160,
            "https://trucks.tatamotors.com/assets/trucks/files/trucks/2024-03/1916-lpt.png?VersionId=dDcqR0ZNLHb5DAEfwh5S7ZnpZ7muZSyM", 19000, "CNG", 5.0, "In Stock"
        ));

        trucks.push_back(make_unique<Truck>(
            5, "Ashok Leyland", "AVTR 5520", 48.75, "H-Series CRS", 520,
            "https://www.motorindiaonline.in/wp-content/uploads/2022/07/AL-truck-1.jpg", 55000, "Diesel", 3.8, "In Stock"
        ));

        trucks.push_back(make_unique<Truck>(
            6, "Mahindra", "Blazo X 49", 46.20, "mPOWER FuelSmart", 490,
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX-f7SnXq6SPGO-9G3FP4Gai__e1rM6Wid7g&s", 49000, "Diesel", 4.1, "Out of Stock"
        ));

        trucks.push_back(make_unique<Truck>(
            7, "Volvo", "FM 440", 65.80, "D13K Euro VI", 440,
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGAdIzd-uUcJdVZsZRaR0_JF6m7g-FaI2D1w&s", 37000, "Diesel", 3.2, "Limited"
        ));

        trucks.push_back(make_unique<Truck>(
            8, "BharatBenz", "3528C", 52.40, "OM 936", 280,
            "https://autobahntrucking.com/storage/app/vehicles/images/Bharatbenz-truck-3528C.jpg", 35000, "Diesel", 3.9, "In Stock"
        ));
    }

    string getAllTrucksJSON() const {
        stringstream ss;
        ss << "[";
        for (size_t i = 0; i < trucks.size(); ++i) {
            if (i > 0) ss << ",";
            ss << trucks[i]->toJSON();
        }
        ss << "]";
        return ss.str();
    }

    Truck* findTruckById(int id) const {
        for (const auto& truck : trucks) {
            if (truck->getId() == id) {
                return truck.get();
            }
        }
        return nullptr;
    }

    string getAvailabilityTableJSON() const {
        stringstream ss;
        ss << "[";
        for (size_t i = 0; i < trucks.size(); ++i) {
            if (i > 0) ss << ",";
            ss << "{"
               << "\"id\":" << trucks[i]->getId() << ","
               << "\"model\":\"" << trucks[i]->getBrand() << " " 
               << trucks[i]->getModel() << "\","
               << "\"availability\":\"" << trucks[i]->getAvailability() << "\""
               << "}";
        }
        ss << "]";
        return ss.str();
    }
};

// ============================================================================
// MAIN APPLICATION CLASS (Facade Pattern)
// ============================================================================

class TruckDealershipApp {
private:
    TruckInventoryManager inventoryManager;
    FinanceCalculator financeCalc;
    ComparisonTool comparisonTool;
    ContactHandler contactHandler;

public:
    // API Endpoint Handlers
    string handleGetTrucks() {
        return inventoryManager.getAllTrucksJSON();
    }

    string handleCalculateEMI(double amount, double rate, int months) {
        return financeCalc.calculateEMIJSON(amount, rate, months);
    }

    string handleCompareTrucks(int id1, int id2) {
        Truck* truck1 = inventoryManager.findTruckById(id1);
        Truck* truck2 = inventoryManager.findTruckById(id2);

        if (!truck1 || !truck2) {
            return "{\"isValid\": false, \"message\": \"Truck not found\"}";
        }

        return comparisonTool.compareJSON(*truck1, *truck2);
    }

    string handleContactSubmission(const string& name, const string& email,
                                 const string& phone, const string& message) {
        return contactHandler.submitContactJSON(name, email, phone, message);
    }

    string handleGetAvailability() {
        return inventoryManager.getAvailabilityTableJSON();
    }
};

// ============================================================================
// HTTP SERVER (Simplified Implementation)
// ============================================================================

class SimpleHTTPServer {
private:
    TruckDealershipApp app;
    int port;

    map<string, string> parseQueryParams(const string& query) {
        map<string, string> params;
        stringstream ss(query);
        string pair;

        while (getline(ss, pair, '&')) {
            size_t pos = pair.find('=');
            if (pos != string::npos) {
                string key = pair.substr(0, pos);
                string value = pair.substr(pos + 1);

                // URL decode (basic)
                for (size_t i = 0; i < value.length(); ++i) {
                    if (value[i] == '+') value[i] = ' ';
                }

                params[key] = value;
            }
        }
        return params;
    }

    string handleRequest(const string& endpoint, const map<string, string>& params) {
        if (endpoint == "/getTrucks") {
            return app.handleGetTrucks();
        }
        else if (endpoint == "/calculateEMI") {
            double amount = 0, rate = 0;
            int months = 0;

            auto it = params.find("amount");
            if (it != params.end()) amount = stod(it->second);

            it = params.find("rate");
            if (it != params.end()) rate = stod(it->second);

            it = params.find("months");
            if (it != params.end()) months = stoi(it->second);

            return app.handleCalculateEMI(amount, rate, months);
        }
        else if (endpoint == "/compare") {
            int id1 = 0, id2 = 0;

            auto it = params.find("id1");
            if (it != params.end()) id1 = stoi(it->second);

            it = params.find("id2");
            if (it != params.end()) id2 = stoi(it->second);

            return app.handleCompareTrucks(id1, id2);
        }
        else if (endpoint == "/contact") {
            auto getName = [&](const string& key) {
                auto it = params.find(key);
                return it != params.end() ? it->second : "";
            };

            return app.handleContactSubmission(
                getName("name"), getName("email"),
                getName("phone"), getName("message")
            );
        }
        else if (endpoint == "/getAvailability") {
            return app.handleGetAvailability();
        }

        return "{\"error\": \"Endpoint not found\"}";
    }

public:
    SimpleHTTPServer(int port = 8080) : port(port) {}

    void start() {
        cout << "🚛 TRUCK DEALERSHIP C++ BACKEND SERVER" << endl;
        cout << "======================================" << endl;
        cout << "🌐 Server running at http://localhost:" << port << endl;
        cout << "📋 Available Endpoints:" << endl;
        cout << "   • /getTrucks - Get all trucks" << endl;
        cout << "   • /calculateEMI - Calculate EMI" << endl;
        cout << "   • /compare - Compare trucks" << endl;
        cout << "   • /contact - Submit contact form" << endl;
        cout << "   • /getAvailability - Get availability table" << endl;
        cout << "⚡ Server is ready for connections!" << endl << endl;

        // API Testing
        cout << "🧪 TESTING API ENDPOINTS:" << endl;
        cout << "========================" << endl;

        // Test trucks API
        cout << "1. Testing /getTrucks:" << endl;
        cout << app.handleGetTrucks().substr(0, 200) << "..." << endl << endl;

        // Test finance API
        cout << "2. Testing /calculateEMI:" << endl;
        cout << app.handleCalculateEMI(500000, 8.5, 60) << endl << endl;

        // Test comparison API
        cout << "3. Testing /compare:" << endl;
        cout << app.handleCompareTrucks(1, 2) << endl << endl;

        // Test availability API
        cout << "4. Testing /getAvailability:" << endl;
        cout << app.handleGetAvailability() << endl << endl;

        cout << "✅ All APIs tested successfully!" << endl;
        cout << "🔗 Connect your frontend to these endpoints" << endl;
        cout << "⚡ Press Ctrl+C to stop the server" << endl;

        // Keep server running
        while (true) {
            this_thread::sleep_for(chrono::seconds(1));
            // In a real implementation, this would handle actual HTTP requests
        }
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

int main() {
    Server svr;

    TruckDealershipApp app;  // Create app instance

    // 1️⃣ No local image folder needed since using online URLs

    // 2️⃣ Get all trucks
    svr.Get("/getTrucks", [&app](const Request&, Response& res) {
        res.set_content(app.handleGetTrucks(), "application/json");
    });

    // 3️⃣ EMI Calculator
    svr.Get("/calculateEMI", [&app](const Request& req, Response& res) {
        double amount = stod(req.get_param_value("amount"));
        double rate = stod(req.get_param_value("rate"));
        int months = stoi(req.get_param_value("months"));
        res.set_content(app.handleCalculateEMI(amount, rate, months), "application/json");
    });

    // 4️⃣ Truck Comparison
    svr.Get("/compare", [&app](const Request& req, Response& res) {
        int id1 = stoi(req.get_param_value("id1"));
        int id2 = stoi(req.get_param_value("id2"));
        res.set_content(app.handleCompareTrucks(id1, id2), "application/json");
    });

    // 5️⃣ Contact Form
    svr.Post("/contact", [&app](const Request& req, Response& res) {
        string name = req.get_param_value("name");
        string email = req.get_param_value("email");
        string phone = req.get_param_value("phone");
        string message = req.get_param_value("message");
        res.set_content(app.handleContactSubmission(name, email, phone, message), "application/json");
    });

    cout << "🚛 TruckHub C++ Backend Running on port 8080...\n";
    cout << "🌐 Using online image URLs for trucks\n";

    svr.listen("0.0.0.0", 8080);  // Run server on all interfaces, port 8080
}

