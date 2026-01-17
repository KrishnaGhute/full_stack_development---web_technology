# 🏎️ 3-Lane Highway Racing Game

A fast-paced, arcade-style racing game where you navigate through traffic on a 3-lane highway. Available in both **C++ SFML** (native) and **Web** (HTML5 Canvas) versions.

![Game Preview](https://img.shields.io/badge/Platforms-C++%20%7C%20Web-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 Game Features

- **3-Lane Highway**: Navigate through realistic highway traffic
- **Procedural Traffic Generation**: Mathematically generated vehicle patterns with different types:
  - Compact Cars (fast, agile)
  - Sedans (balanced speed and size) 
  - SUVs (slow, large, high points)
  - Sports Cars (very fast, unpredictable)
  - Trucks (slow, very large, maximum points)

- **Progressive Difficulty**: Speed and traffic density increase with levels
- **Particle Effects**: Visual feedback for crashes, level-ups, and speed effects  
- **Responsive Controls**: Smooth lane changing and acceleration/braking
- **Mobile Support**: Touch controls for web version
- **Score System**: Points for distance traveled, speed, and vehicles avoided

## 🚀 Quick Start

### Web Version (Easiest)
```bash
# No installation required! Just run:
make web

# Then open http://localhost:8000 in your browser
```

### C++ Version (Best Performance)
```bash
# Ubuntu/Debian
make setup-ubuntu

# macOS  
make setup-macos

# Then run the game
make run-cpp
```

## 📁 Project Structure

```
3-lane-highway-racing/
├── 🌐 Web Version
│   ├── index.html          # Main game page
│   ├── game.js             # Complete game logic
│   ├── style.css           # Modern UI styling
│   └── config.json         # Game configuration
├── 🖥️ C++ Version
│   ├── highway_racing.cpp  # SFML implementation
│   └── Makefile           # Build system
└── 📚 Documentation
    └── README.md          # This file
```

## 🎯 How to Play

### Controls
- **WASD** or **Arrow Keys**: Move and accelerate/brake
- **A/D** or **Left/Right**: Change lanes
- **W** or **Up**: Accelerate
- **S** or **Down**: Brake
- **Space**: Pause game
- **R**: Restart (when game over)
- **ESC**: Quit

### Objective
- Navigate through traffic without crashing
- Change lanes strategically to avoid vehicles
- Build speed for higher scores
- Survive as long as possible to reach higher levels

### Scoring System
- **Speed Bonus**: Higher speeds = more points per second
- **Distance Bonus**: Points for every meter traveled  
- **Avoidance Bonus**: Points for each vehicle successfully passed
- **Level Multiplier**: Higher levels increase point values

## 🔧 Technical Details

### Web Version
- **Technology**: HTML5 Canvas, Vanilla JavaScript
- **Features**: WebAudio sound effects, responsive design, mobile controls
- **Performance**: 60 FPS with optimized rendering and collision detection
- **Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)

### C++ Version  
- **Technology**: SFML 2.5+ (Graphics, Audio, System)
- **Performance**: Native performance with hardware acceleration
- **Features**: Particle system, advanced physics, better visual effects
- **Platforms**: Windows, Linux, macOS

### Mathematical Traffic Generation

The game uses sophisticated algorithms for realistic traffic patterns:

```cpp
// Weighted random vehicle selection
float calculateSpawnProbability(VehicleType type, int level, float playerSpeed) {
    float baseRate = type.spawnWeight;
    float speedFactor = playerSpeed / maxPlayerSpeed;
    float levelFactor = 1.0f + level * 0.1f;
    
    return baseRate * speedFactor * levelFactor;
}

// Dynamic difficulty scaling
float getTrafficDensity(int level, float distance) {
    return baseSpawnRate + (level * 0.005f) + (distance / 10000.0f);
}
```

## 🛠️ Building and Installation

### Dependencies

#### For C++ Version:
- **SFML 2.5+** (Graphics, Window, System, Audio)
- **C++17 compatible compiler** (GCC 7+, Clang 5+, MSVC 2017+)

#### For Web Version:
- **Web Server** (Python 3, Node.js, or any HTTP server)
- **Modern Browser** with HTML5 Canvas support

### Build Instructions

#### Ubuntu/Debian
```bash
# Install dependencies
sudo apt-get install libsfml-dev build-essential

# Build and run
make setup-ubuntu
```

#### macOS
```bash  
# Install dependencies (requires Homebrew)
brew install sfml

# Build and run
make setup-macos
```

#### Windows
1. Install SFML from https://www.sfml-dev.org/
2. Configure your IDE with SFML paths
3. Compile `highway_racing.cpp` with SFML libraries

#### Manual Build
```bash
g++ -std=c++17 highway_racing.cpp -o highway_racing -lsfml-graphics -lsfml-window -lsfml-system -lsfml-audio
```

## 🎮 Game Mechanics Deep Dive

### Physics System
- **Acceleration**: Realistic car acceleration curves
- **Lane Changing**: Smooth interpolation between lanes  
- **Speed Effects**: Visual feedback for high speeds
- **Collision**: Precise bounding box detection

### Traffic AI
Each vehicle type has unique behavior:
- **Speed Variation**: Randomized within realistic ranges
- **Lane Oscillation**: Subtle movements for realism
- **Spawn Patterns**: Avoid clustering, maintain challenge

### Difficulty Progression
- **Level 1**: Sparse traffic, slow speeds
- **Level 5**: Moderate density, mixed vehicle types
- **Level 10+**: Dense traffic, fast vehicles, frequent lane changes required

## 📊 Performance Optimizations

### Web Version
- **Object Pooling**: Reuse vehicle objects to reduce garbage collection
- **Culling**: Only update/render vehicles on screen
- **Efficient Canvas API**: Minimized draw calls and state changes
- **Frame Rate**: Consistent 60 FPS with automatic quality scaling

### C++ Version
- **Memory Management**: Smart pointers and RAII patterns
- **Vector Operations**: SIMD-optimized math where possible
- **Render Batching**: Group similar draw calls
- **Particle Limits**: Dynamic particle count based on performance

## 🐛 Troubleshooting

### C++ Version Issues

**"SFML not found" error:**
```bash
# Ubuntu/Debian
sudo apt-get install libsfml-dev

# macOS
brew install sfml

# Check installation
pkg-config --libs sfml-graphics
```

**Compilation errors:**
```bash
# Ensure C++17 support
g++ --version  # Should be 7.0+

# Check SFML version
pkg-config --modversion sfml-graphics  # Should be 2.5+
```

### Web Version Issues

**Blank screen in browser:**
- Check browser console for JavaScript errors
- Ensure you're serving from a web server (not file://)
- Try a different browser

**Poor performance:**
- Close other browser tabs
- Check if hardware acceleration is enabled
- Reduce browser zoom level

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- **New Vehicle Types**: Add motorcycles, buses, emergency vehicles
- **Power-ups**: Speed boosts, shields, extra lives  
- **Weather Effects**: Rain, fog, night mode
- **Sound Design**: Engine sounds, crash effects, music
- **Track Variants**: Curves, hills, multiple highways

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd 3-lane-highway-racing

# Test both versions
make test

# Create development build
make debug
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SFML Team**: For the excellent multimedia library
- **Game Design Inspiration**: Classic arcade racing games like OutRun and Highway Hunter  
- **Mathematical Models**: Traffic flow dynamics research papers
- **Testing Community**: Beta testers who provided valuable feedback

## 📞 Support

Having issues? Check these resources:

1. **Build Problems**: See troubleshooting section above
2. **Gameplay Questions**: Check the controls and objective sections  
3. **Performance Issues**: Try the optimization suggestions
4. **Bug Reports**: Create an issue with detailed steps to reproduce

---

**🏁 Ready to Race?**

```bash
# For instant action:
make web

# For best experience:  
make setup-ubuntu  # or setup-macos
make run-cpp
```

Hit the highway and see how long you can survive! 🏎️💨

---

## Patch Notes (local)

- Fixed a compile issue in `highway_racing.cpp`: corrected the `VehicleType` initializer order, defined `M_PI` for portability, and made `TrafficVehicle::render` const to allow rendering from a const reference. The project now compiles with g++ and SFML.
