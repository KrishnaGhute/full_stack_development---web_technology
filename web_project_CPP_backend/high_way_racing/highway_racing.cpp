// highway_racing.cpp
// 3-Lane Highway Racing Game in C++ using SFML
// Standalone version with complete game mechanics

#include <SFML/Graphics.hpp>
#include <SFML/Audio.hpp>
#include <SFML/System.hpp>
#include <cmath>
#include <vector>
#include <string>
#include <random>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <iomanip>

// Ensure M_PI is available
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Math utilities
namespace Math {
    float clamp(float value, float min, float max) {
        return std::max(min, std::min(max, value));
    }
    
    float lerp(float a, float b, float t) {
        return a + (b - a) * t;
    }
    
    float distance(const sf::Vector2f& a, const sf::Vector2f& b) {
        return std::sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
    }
}

// Game configuration
struct Config {
    const unsigned WINDOW_WIDTH = 800;
    const unsigned WINDOW_HEIGHT = 600;
    const unsigned LANES = 3;
    const float LANE_WIDTH = WINDOW_WIDTH / (float)LANES;
    
    // Colors
    const sf::Color ROAD_COLOR = sf::Color(51, 51, 51);
    const sf::Color LINE_COLOR = sf::Color::White;
    const sf::Color EDGE_COLOR = sf::Color::Yellow;
    const sf::Color GRASS_COLOR = sf::Color(34, 139, 34);
    
    // Game mechanics
    const float BASE_ROAD_SPEED = 8.0f;
    const float PLAYER_MAX_SPEED = 16.0f; // increased top speed
    const float PLAYER_ACCELERATION = 0.45f; // quicker acceleration
    const float PLAYER_DECELERATION = 0.3f; // slightly stronger braking
    const float LANE_CHANGE_SPEED = 12.0f; // faster lane change
    // Increased for snappier player control
    const float PLAYER_MAX_SPEED_UPGRADED = 16.0f; // not used directly - kept for reference
    
    // Traffic
    const float BASE_SPAWN_RATE = 0.02f;
    const float MAX_SPAWN_RATE = 0.08f;
    const float SPAWN_RATE_INCREASE = 0.005f;
    
    // Scoring
    const float DISTANCE_PER_LEVEL = 1000.0f;
} CFG;

// Vehicle types for procedural traffic generation
struct VehicleType {
    sf::Color color;
    sf::Vector2f size;
    float baseSpeed;
    float speedVariation;
    int points;
    float spawnWeight;
    std::string name;
};

class TrafficGenerator {
private:
    std::vector<VehicleType> vehicleTypes;
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<> dis;
    
public:
    TrafficGenerator() : gen(rd()), dis(0.0, 1.0) {
        // Define various vehicle types with different characteristics
        vehicleTypes = {
            { sf::Color(68, 68, 255), sf::Vector2f(50, 80), 3.0f, 1.0f, 10, 30.0f, "Compact" },
            { sf::Color(68, 255, 68), sf::Vector2f(55, 90), 4.0f, 1.0f, 15, 25.0f, "Sedan" },
            { sf::Color(255, 68, 255), sf::Vector2f(60, 100), 2.0f, 0.5f, 20, 20.0f, "SUV" },
            { sf::Color(255, 255, 68), sf::Vector2f(45, 70), 5.0f, 2.0f, 8, 15.0f, "Sports" },
            { sf::Color(68, 255, 255), sf::Vector2f(65, 120), 2.5f, 0.3f, 25, 10.0f, "Truck" }
        };
    }
    
    VehicleType getRandomVehicleType() {
        // Weighted random selection
        float totalWeight = 0;
        for (const auto& type : vehicleTypes) {
            totalWeight += type.spawnWeight;
        }
        
        float random = dis(gen) * totalWeight;
        float currentWeight = 0;
        
        for (const auto& type : vehicleTypes) {
            currentWeight += type.spawnWeight;
            if (random <= currentWeight) {
                return type;
            }
        }
        
        return vehicleTypes[0]; // Fallback
    }
    
    float getRandomFloat(float min, float max) {
        return min + dis(gen) * (max - min);
    }
    
    int getRandomInt(int min, int max) {
        return min + (int)(dis(gen) * (max - min + 1));
    }
};

// Particle system for visual effects
struct Particle {
    sf::Vector2f position;
    sf::Vector2f velocity;
    sf::Color color;
    float life;
    float maxLife;
    float size;
};

class ParticleSystem {
private:
    std::vector<Particle> particles;
    std::random_device rd;
    std::mt19937 gen;
    
public:
    ParticleSystem() : gen(rd()) {}
    
    void addExplosion(sf::Vector2f position, int count = 50) {
        std::uniform_real_distribution<> dis(-1.0, 1.0);
        std::uniform_real_distribution<> speedDis(5.0, 15.0);
        
        for (int i = 0; i < count; i++) {
            Particle p;
            p.position = position;
            p.velocity = sf::Vector2f(dis(gen) * speedDis(gen), dis(gen) * speedDis(gen));
            
            // Random explosion colors
            std::vector<sf::Color> colors = {
                sf::Color::Red, sf::Color::Yellow, sf::Color(255, 165, 0)
            };
            p.color = colors[gen() % colors.size()];
            
            p.life = p.maxLife = 60.0f + dis(gen) * 60.0f;
            p.size = 2.0f + dis(gen) * 3.0f;
            particles.push_back(p);
        }
    }
    
    void addLevelUpEffect(sf::Vector2f center) {
        std::uniform_real_distribution<> dis(-1.0, 1.0);
        std::uniform_real_distribution<> hueDis(0.0, 360.0);
        
        for (int i = 0; i < 20; i++) {
            Particle p;
            p.position = center + sf::Vector2f(dis(gen) * 100, dis(gen) * 100);
            p.velocity = sf::Vector2f(dis(gen) * 10, dis(gen) * 10);
            
            // Rainbow colors for level up
            float hue = hueDis(gen);
            p.color = sf::Color(
                (sf::Uint8)(127 * (1 + std::sin(hue * M_PI / 180))),
                (sf::Uint8)(127 * (1 + std::sin((hue + 120) * M_PI / 180))),
                (sf::Uint8)(127 * (1 + std::sin((hue + 240) * M_PI / 180)))
            );
            
            p.life = p.maxLife = 120.0f;
            p.size = 3.0f;
            particles.push_back(p);
        }
    }
    
    void update() {
        for (auto it = particles.begin(); it != particles.end();) {
            it->position += it->velocity;
            it->life -= 1.0f;
            
            // Fade out
            float alpha = it->life / it->maxLife;
            it->color.a = (sf::Uint8)(255 * alpha);
            
            if (it->life <= 0) {
                it = particles.erase(it);
            } else {
                ++it;
            }
        }
    }
    
    void render(sf::RenderWindow& window) {
        for (const auto& p : particles) {
            sf::CircleShape circle(p.size);
            circle.setPosition(p.position.x - p.size, p.position.y - p.size);
            circle.setFillColor(p.color);
            window.draw(circle);
        }
    }
    
    void clear() {
        particles.clear();
    }
};

// Traffic vehicle class
class TrafficVehicle {
public:
    sf::Vector2f position;
    sf::Vector2f size;
    sf::Color color;
    float speed;
    int points;
    int lane;
    float oscillation;
    float oscillationSpeed;
    float reactionTime;
    
    TrafficVehicle(const VehicleType& type, int startLane, float startY) {
        size = type.size;
        color = type.color;
        speed = type.baseSpeed + (rand() % 100 / 100.0f - 0.5f) * type.speedVariation;
        points = type.points;
        lane = startLane;
        
        position.x = CFG.LANE_WIDTH * lane + CFG.LANE_WIDTH / 2 - size.x / 2;
        position.y = startY;
        
        oscillation = (rand() % 100 / 100.0f) * 2 * M_PI;
        oscillationSpeed = 0.01f + (rand() % 100 / 100.0f) * 0.02f;
        reactionTime = 0.2f + (rand() % 100 / 100.0f) * 0.5f; // seconds-ish reaction time modifier
    }
    
    // Update with basic reaction: roadSpeed is world scroll; playerPos is used by game logic to decide slowdown
    void update(float roadSpeed, const sf::Vector2f& playerPos) {
        // Basic proximity-aware slowdown: if the player is close ahead in same lane, reduce forward speed
        float reactionDistance = 220.0f;
        float distToPlayerY = position.y - playerPos.y;
        float slowdown = 0.0f;
        if (distToPlayerY > -50.0f && distToPlayerY < reactionDistance && std::abs(position.x - playerPos.x) < CFG.LANE_WIDTH * 0.8f) {
            float urgency = std::max(0.0f, (reactionDistance - distToPlayerY) / reactionDistance);
            float reactionFactor = std::min(1.0f, urgency / std::max(0.01f, reactionTime));
            slowdown = 0.3f + 0.7f * reactionFactor; // up to ~1.0
        }

        float desiredSpeed = std::max(0.5f, speed * (1.0f - slowdown));
        // Blend speed slowly to avoid twitchiness
        speed += (desiredSpeed - speed) * 0.05f;
        position.y += speed + roadSpeed;

        // Slight lateral oscillation reduced when slowing
        oscillation += oscillationSpeed;
        position.x += std::sin(oscillation) * 0.25f * (1.0f - slowdown);
    }
    
    void render(sf::RenderWindow& window) const {
        // Shadow
        sf::RectangleShape shadow(size);
        shadow.setPosition(position.x + 3, position.y + 3);
        shadow.setFillColor(sf::Color(0, 0, 0, 80));
        window.draw(shadow);
        
        // Main body
        sf::RectangleShape body(size);
        body.setPosition(position);
        body.setFillColor(color);
        window.draw(body);
        
        // Simple details
        sf::RectangleShape windshield(sf::Vector2f(size.x - 6, 8));
        windshield.setPosition(position.x + 3, position.y + 3);
        windshield.setFillColor(sf::Color(255, 255, 255, 100));
        window.draw(windshield);
        
        // Wheels
        sf::RectangleShape wheel1(sf::Vector2f(6, 8));
        sf::RectangleShape wheel2(sf::Vector2f(6, 8));
        sf::RectangleShape wheel3(sf::Vector2f(6, 8));
        sf::RectangleShape wheel4(sf::Vector2f(6, 8));
        
        wheel1.setPosition(position.x - 2, position.y + 10);
        wheel2.setPosition(position.x + size.x - 4, position.y + 10);
        wheel3.setPosition(position.x - 2, position.y + size.y - 18);
        wheel4.setPosition(position.x + size.x - 4, position.y + size.y - 18);
        
        sf::Color wheelColor(17, 17, 17);
        wheel1.setFillColor(wheelColor);
        wheel2.setFillColor(wheelColor);
        wheel3.setFillColor(wheelColor);
        wheel4.setFillColor(wheelColor);
        
        window.draw(wheel1);
        window.draw(wheel2);
        window.draw(wheel3);
        window.draw(wheel4);
    }
    
    sf::FloatRect getBounds() const {
        return sf::FloatRect(position.x, position.y, size.x, size.y);
    }
};

// Player car class
class PlayerCar {
public:
    sf::Vector2f position;
    sf::Vector2f size;
    sf::Color color;
    int currentLane;
    int targetLane;
    float speed;
    bool isChangingLane;
    
    PlayerCar() {
        size = sf::Vector2f(50, 80);
        color = sf::Color(255, 68, 68);
        currentLane = 1; // Start in lane 1 (0-indexed)
        targetLane = 1;
        speed = 0;
        isChangingLane = false;
        
        position.x = CFG.LANE_WIDTH * currentLane + CFG.LANE_WIDTH / 2 - size.x / 2;
        position.y = CFG.WINDOW_HEIGHT - 120;
    }
    
    void changeLane(int direction) {
        int newLane = currentLane + direction;
        if (newLane >= 0 && newLane < (int)CFG.LANES && !isChangingLane) {
            targetLane = newLane;
            isChangingLane = true;
        }
    }
    
    void update() {
        // Handle lane changing
        if (isChangingLane) {
            float targetX = CFG.LANE_WIDTH * targetLane + CFG.LANE_WIDTH / 2 - size.x / 2;
            float diff = targetX - position.x;

            float move = std::min(std::abs(diff), CFG.LANE_CHANGE_SPEED);
            if (std::abs(diff) <= move) {
                position.x = targetX;
                currentLane = targetLane;
                isChangingLane = false;
            } else {
                position.x += (diff > 0 ? 1 : -1) * move;
            }
        }
    }
    
    void render(sf::RenderWindow& window) {
        // Shadow
        sf::RectangleShape shadow(size);
        shadow.setPosition(position.x + 3, position.y + 3);
        shadow.setFillColor(sf::Color(0, 0, 0, 100));
        window.draw(shadow);
        
        // Main body
        sf::RectangleShape body(size);
        body.setPosition(position);
        body.setFillColor(color);
        window.draw(body);
        
        // Windshield
        sf::RectangleShape windshield(sf::Vector2f(size.x - 10, 15));
        windshield.setPosition(position.x + 5, position.y + 10);
        windshield.setFillColor(sf::Color(34, 34, 34));
        window.draw(windshield);
        
        // Rear window
        sf::RectangleShape rearWindow(sf::Vector2f(size.x - 10, 15));
        rearWindow.setPosition(position.x + 5, position.y + size.y - 25);
        rearWindow.setFillColor(sf::Color(34, 34, 34));
        window.draw(rearWindow);
        
        // Headlights
        sf::RectangleShape headlight1(sf::Vector2f(10, 8));
        sf::RectangleShape headlight2(sf::Vector2f(10, 8));
        headlight1.setPosition(position.x + 5, position.y + 5);
        headlight2.setPosition(position.x + size.x - 15, position.y + 5);
        headlight1.setFillColor(sf::Color::White);
        headlight2.setFillColor(sf::Color::White);
        window.draw(headlight1);
        window.draw(headlight2);
        
        // Wheels
        sf::RectangleShape wheel1(sf::Vector2f(8, 12));
        sf::RectangleShape wheel2(sf::Vector2f(8, 12));
        sf::RectangleShape wheel3(sf::Vector2f(8, 12));
        sf::RectangleShape wheel4(sf::Vector2f(8, 12));
        
        wheel1.setPosition(position.x - 3, position.y + 15);
        wheel2.setPosition(position.x + size.x - 5, position.y + 15);
        wheel3.setPosition(position.x - 3, position.y + size.y - 27);
        wheel4.setPosition(position.x + size.x - 5, position.y + size.y - 27);
        
        sf::Color wheelColor(17, 17, 17);
        wheel1.setFillColor(wheelColor);
        wheel2.setFillColor(wheelColor);
        wheel3.setFillColor(wheelColor);
        wheel4.setFillColor(wheelColor);
        
        window.draw(wheel1);
        window.draw(wheel2);
        window.draw(wheel3);
        window.draw(wheel4);
    }
    
    sf::FloatRect getBounds() const {
        return sf::FloatRect(position.x, position.y, size.x, size.y);
    }
};

// Main game class
class HighwayRacingGame {
private:
    sf::RenderWindow window;
    sf::Font font;
    bool fontLoaded;
    
    // Game state
    enum GameState { PLAYING, PAUSED, GAME_OVER } gameState;
    float score;
    float distance;
    int level;
    float maxSpeed;
    
    // Game objects
    PlayerCar player;
    std::vector<TrafficVehicle> traffic;
    TrafficGenerator trafficGen;
    ParticleSystem particles;
    
    // Road rendering
    float roadSpeed;
    float roadOffset;
    std::vector<float> roadLines;
    
    // Traffic spawning
    float trafficSpawnTimer;
    float trafficSpawnRate;
    
    // Input
    bool keys[sf::Keyboard::KeyCount];
    
    // Timing
    sf::Clock gameClock;
    
    // UI elements
    sf::Text scoreText, speedText, distanceText, levelText;
    sf::Text gameOverText, finalScoreText, restartText;
    
public:
    HighwayRacingGame() : window(sf::VideoMode(CFG.WINDOW_WIDTH, CFG.WINDOW_HEIGHT), "3-Lane Highway Racing") {
        window.setFramerateLimit(60);
        
        // Load font
        fontLoaded = font.loadFromFile("arial.ttf");
        if (!fontLoaded) {
            std::cout << "Warning: Could not load font. Using default font." << std::endl;
        }
        
        // Initialize game state
        resetGame();
        
        // Initialize road lines
        for (int i = 0; i < 20; i++) {
            roadLines.push_back((i * 40) - 400);
        }
        
        // Clear input array
        for (int i = 0; i < sf::Keyboard::KeyCount; i++) {
            keys[i] = false;
        }
        
        // Setup UI
        setupUI();
    }
    
    void resetGame() {
        gameState = PLAYING;
        score = 0;
        distance = 0;
        level = 1;
        maxSpeed = 0;
        roadSpeed = CFG.BASE_ROAD_SPEED;
        roadOffset = 0;
        trafficSpawnTimer = 0;
        trafficSpawnRate = CFG.BASE_SPAWN_RATE;
        
        player = PlayerCar();
        traffic.clear();
        // Seed initial traffic: ensure each non-player lane has at least one vehicle ahead
        for (int lane = 0; lane < (int)CFG.LANES; ++lane) {
            if (lane == player.currentLane) continue;
            VehicleType type = trafficGen.getRandomVehicleType();
            float spawnY = -type.size.y - trafficGen.getRandomFloat(50.0f, 400.0f) - lane * 80.0f;
            traffic.emplace_back(type, lane, spawnY);
        }
        particles.clear();
        
        gameClock.restart();
    }
    
    void setupUI() {
        if (fontLoaded) {
            scoreText.setFont(font);
            speedText.setFont(font);
            distanceText.setFont(font);
            levelText.setFont(font);
            gameOverText.setFont(font);
            finalScoreText.setFont(font);
            restartText.setFont(font);
        }
        
        scoreText.setCharacterSize(20);
        speedText.setCharacterSize(20);
        distanceText.setCharacterSize(20);
        levelText.setCharacterSize(20);
        
        scoreText.setFillColor(sf::Color::Cyan);
        speedText.setFillColor(sf::Color::Cyan);
        distanceText.setFillColor(sf::Color::Cyan);
        levelText.setFillColor(sf::Color::Cyan);
        
        scoreText.setPosition(10, 10);
        speedText.setPosition(10, 35);
        distanceText.setPosition(CFG.WINDOW_WIDTH - 200, 10);
        levelText.setPosition(CFG.WINDOW_WIDTH - 200, 35);
        
        // Game over screen
        gameOverText.setCharacterSize(48);
        gameOverText.setFillColor(sf::Color::Red);
        gameOverText.setString("GAME OVER!");
        gameOverText.setPosition(CFG.WINDOW_WIDTH / 2 - 150, CFG.WINDOW_HEIGHT / 2 - 100);
        
        finalScoreText.setCharacterSize(24);
        finalScoreText.setFillColor(sf::Color::Yellow);
        finalScoreText.setPosition(CFG.WINDOW_WIDTH / 2 - 100, CFG.WINDOW_HEIGHT / 2 - 20);
        
        restartText.setCharacterSize(20);
        restartText.setFillColor(sf::Color::White);
        restartText.setString("Press R to restart or ESC to quit");
        restartText.setPosition(CFG.WINDOW_WIDTH / 2 - 140, CFG.WINDOW_HEIGHT / 2 + 50);
    }
    
    void handleInput() {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed) {
                window.close();
            }
            
            if (event.type == sf::Event::KeyPressed) {
                keys[event.key.code] = true;
                
                if (gameState == GAME_OVER && event.key.code == sf::Keyboard::R) {
                    resetGame();
                }
            }
            
            if (event.type == sf::Event::KeyReleased) {
                keys[event.key.code] = false;
            }
        }
        
        if (keys[sf::Keyboard::Escape]) {
            window.close();
        }
        
        if (keys[sf::Keyboard::Space] && gameState == PLAYING) {
            gameState = PAUSED;
        } else if (keys[sf::Keyboard::Space] && gameState == PAUSED) {
            gameState = PLAYING;
        }
        
        if (gameState == PLAYING) {
            // Lane changing
            if (keys[sf::Keyboard::A] || keys[sf::Keyboard::Left]) {
                player.changeLane(-1);
            }
            if (keys[sf::Keyboard::D] || keys[sf::Keyboard::Right]) {
                player.changeLane(1);
            }
            
            // Acceleration and braking
            if (keys[sf::Keyboard::W] || keys[sf::Keyboard::Up]) {
                player.speed = Math::clamp(player.speed + CFG.PLAYER_ACCELERATION, 0, CFG.PLAYER_MAX_SPEED);
            } else if (keys[sf::Keyboard::S] || keys[sf::Keyboard::Down]) {
                player.speed = Math::clamp(player.speed - CFG.PLAYER_DECELERATION * 2, 0, CFG.PLAYER_MAX_SPEED);
            } else {
                player.speed = Math::clamp(player.speed - CFG.PLAYER_DECELERATION * 0.5f, 0, CFG.PLAYER_MAX_SPEED);
            }
            
            maxSpeed = std::max(maxSpeed, player.speed);
        }
    }
    
    void update() {
        if (gameState != PLAYING) return;
        
        player.update();
        
        // Update road speed based on player speed
        roadSpeed = CFG.BASE_ROAD_SPEED + player.speed * 0.5f;
        trafficSpawnRate = Math::clamp(
            CFG.BASE_SPAWN_RATE + level * CFG.SPAWN_RATE_INCREASE,
            CFG.BASE_SPAWN_RATE,
            CFG.MAX_SPAWN_RATE
        );
        
        // Update distance and score
        distance += (roadSpeed + player.speed) * 0.1f;
        score += player.speed * 0.5f;
        
        // Level progression
        int newLevel = (int)(distance / CFG.DISTANCE_PER_LEVEL) + 1;
        if (newLevel > level) {
            level = newLevel;
            particles.addLevelUpEffect(sf::Vector2f(CFG.WINDOW_WIDTH / 2, CFG.WINDOW_HEIGHT / 2));
        }
        
        // Spawn traffic
        spawnTraffic();
        
        // Update traffic
        updateTraffic();
        
        // Update road
        updateRoad();
        
        // Update particles
        particles.update();
    }
    
    void spawnTraffic() {
        trafficSpawnTimer += trafficSpawnRate;
        
        if (trafficSpawnTimer >= 1.0f) {
            trafficSpawnTimer = 0;
            // Candidate lanes (exclude player's current lane)
            std::vector<int> candidateLanes;
            for (int i = 0; i < (int)CFG.LANES; ++i) {
                if (i != player.currentLane) candidateLanes.push_back(i);
            }
            if (candidateLanes.empty()) return;

            // Determine blocked lanes near the player
            float safeAhead = 220.0f;
            float safeBehind = 50.0f;
            std::vector<bool> laneBlocked(CFG.LANES, false);
            int blockedCount = 0;
            for (int lane : candidateLanes) {
                for (const auto& v : traffic) {
                    if (v.lane == lane && v.position.y > (player.position.y - safeAhead) && v.position.y < (player.position.y + safeBehind)) {
                        laneBlocked[lane] = true;
                        blockedCount++;
                        break;
                    }
                }
            }

            int chosenLane = -1;
            // Choose unblocked lane if possible
            for (int lane : candidateLanes) {
                if (!laneBlocked[lane]) {
                    chosenLane = lane;
                    break;
                }
            }

            if (chosenLane == -1) {
                // All lanes blocked: pick lane with largest gap (farthest nearest vehicle)
                float bestGap = -1e9f;
                for (int lane : candidateLanes) {
                    float nearestY = 1e9f;
                    for (const auto& v : traffic) if (v.lane == lane) nearestY = std::min(nearestY, v.position.y);
                    float gap = (nearestY == 1e9f) ? 1e6f : (nearestY - player.position.y);
                    if (gap > bestGap) { bestGap = gap; chosenLane = lane; }
                }
            }

            if (chosenLane != -1) {
                VehicleType type = trafficGen.getRandomVehicleType();
                float spawnY = -type.size.y - trafficGen.getRandomFloat(0, 200);
                TrafficVehicle vehicle(type, chosenLane, spawnY);

                bool canSpawn = true;
                for (const auto& other : traffic) {
                    if (std::abs(other.position.x - vehicle.position.x) < 80 && std::abs(other.position.y - vehicle.position.y) < 150) {
                        canSpawn = false;
                        break;
                    }
                }

                if (canSpawn) {
                    traffic.push_back(vehicle);
                }
            }
        }
    }
    
    void updateTraffic() {
        for (auto it = traffic.begin(); it != traffic.end();) {
            it->update(roadSpeed, player.position);
            
            // Remove vehicles that are off screen
            if (it->position.y > CFG.WINDOW_HEIGHT + 50) {
                score += it->points;
                it = traffic.erase(it);
            }
            // Check collision with player
            else if (checkCollision(player.getBounds(), it->getBounds())) {
                gameOver();
                break;
            } else {
                ++it;
            }
        }
    }
    
    bool checkCollision(const sf::FloatRect& a, const sf::FloatRect& b) {
        return a.intersects(b);
    }
    
    void updateRoad() {
        roadOffset += roadSpeed;
        
        for (auto& lineY : roadLines) {
            lineY += roadSpeed;
            if (lineY > CFG.WINDOW_HEIGHT) {
                lineY = -20 - (rand() % 40);
            }
        }
    }
    
    void gameOver() {
        gameState = GAME_OVER;
        particles.addExplosion(sf::Vector2f(
            player.position.x + player.size.x / 2,
            player.position.y + player.size.y / 2
        ));
        
        std::stringstream ss;
        ss << "Final Score: " << (int)score << "\n";
        ss << "Distance: " << (int)distance << "m\n";
        ss << "Max Speed: " << (int)(maxSpeed * 10) << " km/h\n";
        ss << "Level: " << level;
        finalScoreText.setString(ss.str());
    }
    
    void render() {
        window.clear();
        
        // Draw road background
        window.clear(CFG.GRASS_COLOR);
        
        // Draw lane backgrounds (alternating shades)
        for (int i = 0; i < (int)CFG.LANES; ++i) {
            sf::RectangleShape laneRect(sf::Vector2f(CFG.LANE_WIDTH, CFG.WINDOW_HEIGHT));
            laneRect.setPosition(i * CFG.LANE_WIDTH, 0);
            if (i % 2 == 0) laneRect.setFillColor(sf::Color(60, 60, 60));
            else laneRect.setFillColor(sf::Color(46, 46, 46));
            window.draw(laneRect);
        }

        // Draw dashed lane dividers
        for (int i = 1; i < (int)CFG.LANES; i++) {
            for (float lineY : roadLines) {
                sf::RectangleShape line(sf::Vector2f(20, 20));
                line.setPosition(i * CFG.LANE_WIDTH - 10, lineY);
                line.setFillColor(CFG.LINE_COLOR);
                window.draw(line);
            }
        }

        // Draw strong road edges
        sf::RectangleShape leftEdge(sf::Vector2f(8, CFG.WINDOW_HEIGHT));
        sf::RectangleShape rightEdge(sf::Vector2f(8, CFG.WINDOW_HEIGHT));
        leftEdge.setPosition(0, 0);
        rightEdge.setPosition(CFG.WINDOW_WIDTH - 8, 0);
        leftEdge.setFillColor(sf::Color(255, 215, 0));
        rightEdge.setFillColor(sf::Color(255, 215, 0));
        window.draw(leftEdge);
        window.draw(rightEdge);
        
    // ... (edges already drawn above)
        
        // Draw traffic
        for (const auto& vehicle : traffic) {
            vehicle.render(window);
        }
        
        // Draw player
        player.render(window);
        
        // Draw particles
        particles.render(window);
        
        // Draw speed effects
        if (player.speed > 8) {
            sf::Uint8 alpha = (sf::Uint8)((player.speed - 8) * 20);
            for (int i = 0; i < 10; i++) {
                sf::RectangleShape line(sf::Vector2f(2, 20));
                line.setPosition(rand() % CFG.WINDOW_WIDTH, rand() % CFG.WINDOW_HEIGHT);
                line.setFillColor(sf::Color(255, 255, 255, alpha));
                window.draw(line);
            }
        }
        
        // Draw UI
        std::stringstream ss;
        ss << "Score: " << (int)score;
        scoreText.setString(ss.str());
        window.draw(scoreText);
        
        ss.str("");
        ss << "Speed: " << (int)(player.speed * 10) << " km/h";
        speedText.setString(ss.str());
        window.draw(speedText);
        
        ss.str("");
        ss << "Distance: " << (int)distance << "m";
        distanceText.setString(ss.str());
        window.draw(distanceText);
        
        ss.str("");
        ss << "Level: " << level;
        levelText.setString(ss.str());
        window.draw(levelText);
        
        // Draw pause screen
        if (gameState == PAUSED) {
            sf::RectangleShape overlay(sf::Vector2f(CFG.WINDOW_WIDTH, CFG.WINDOW_HEIGHT));
            overlay.setFillColor(sf::Color(0, 0, 0, 128));
            window.draw(overlay);
            
            sf::Text pauseText;
            if (fontLoaded) pauseText.setFont(font);
            pauseText.setString("PAUSED");
            pauseText.setCharacterSize(48);
            pauseText.setFillColor(sf::Color::Yellow);
            pauseText.setPosition(CFG.WINDOW_WIDTH / 2 - 80, CFG.WINDOW_HEIGHT / 2 - 24);
            window.draw(pauseText);
        }
        
        // Draw game over screen
        if (gameState == GAME_OVER) {
            sf::RectangleShape overlay(sf::Vector2f(CFG.WINDOW_WIDTH, CFG.WINDOW_HEIGHT));
            overlay.setFillColor(sf::Color(0, 0, 0, 200));
            window.draw(overlay);
            
            window.draw(gameOverText);
            window.draw(finalScoreText);
            window.draw(restartText);
        }
        
        window.display();
    }
    
    void run() {
        while (window.isOpen()) {
            handleInput();
            update();
            render();
        }
    }
};

// Main function
int main() {
    try {
        HighwayRacingGame game;
        game.run();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}