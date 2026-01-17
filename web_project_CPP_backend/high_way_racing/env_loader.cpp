// env_loader.cpp - example: load environments.json using nlohmann/json
// This is a lightweight example; add nlohmann/json single header or link the library.

#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#if defined(__has_include)
#  if __has_include(<nlohmann/json.hpp>)
#    include <nlohmann/json.hpp>
#    define HW_HAS_NLOHMANN_JSON 1
#  elif __has_include("json.hpp")
#    include "json.hpp"
#    define HW_HAS_NLOHMANN_JSON 1
#  else
#    define HW_HAS_NLOHMANN_JSON 0
#  endif
#else
#  include <nlohmann/json.hpp>
#  define HW_HAS_NLOHMANN_JSON 1
#endif

#if HW_HAS_NLOHMANN_JSON
using json = nlohmann::json;
#else
// If nlohmann/json.hpp is not available at compile time, provide a graceful runtime fallback.
// The loader will print a helpful message and return an empty list so the program still builds.
inline void require_nlohmann_notice() {
    std::cerr << "nlohmann/json.hpp not found. To enable environment loading, download the single-header 'json.hpp' from https://github.com/nlohmann/json and place it in the project folder or install the library.\n";
}
#endif

struct EnvConfig {
    std::string id;
    std::string name;
    int seed;
    float friction;
    float speedMultiplier;
    float obstacleDensity;
    float powerupDensity;
    std::string bgType;
};

std::vector<EnvConfig> loadEnvironments(const std::string &path) {
#if HW_HAS_NLOHMANN_JSON
    std::ifstream in(path);
    if(!in) {
        std::cerr << "Cannot open " << path << std::endl;
        return {};
    }
    json arr;
    try {
        in >> arr;
    } catch (const std::exception &ex) {
        std::cerr << "Failed to parse JSON: " << ex.what() << std::endl;
        return {};
    }
    if (!arr.is_array()) {
        std::cerr << "Expected JSON array in " << path << std::endl;
        return {};
    }
    std::vector<EnvConfig> envs;
    for(auto &e : arr) {
        EnvConfig c;
        c.id = e.value("id", "");
        c.name = e.value("name", "");
        c.seed = e.value("seed", 0);
        c.friction = e.value("friction", 1.0f);
        c.speedMultiplier = e.value("speedMultiplier", 1.0f);
        c.obstacleDensity = e.value("obstacleDensity", 0.04f);
        c.powerupDensity = e.value("powerupDensity", 0.02f);
        if(e.contains("visual") && e["visual"].contains("bgType")) c.bgType = e["visual"]["bgType"].get<std::string>();
        envs.push_back(c);
    }
    return envs;
#else
    require_nlohmann_notice();
    return {};
#endif
}

int main(){
    auto envs = loadEnvironments("environments.json");
    for(auto &e: envs) {
        std::cout << "Env: "<< e.id << " friction="<< e.friction << " speedMul="<< e.speedMultiplier << "\n";
    }
    return 0;
}
