#!/bin/bash
# start_game.sh - Quick launcher for 3-Lane Highway Racing Game

echo "🏎️  3-Lane Highway Racing Game Launcher"
echo "======================================"
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to find available port
find_free_port() {
    local port=8000
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; do
        port=$((port + 1))
    done
    echo $port
}

# Check what's available
echo "🔍 Checking available options..."

# Check for C++ build
if [ -f "./highway_racing" ]; then
    HAS_CPP=true
    echo "✅ C++ version available"
else
    HAS_CPP=false
    echo "❌ C++ version not built"
fi

# Check for web server options
if command_exists python3; then
    HAS_PYTHON3=true
    echo "✅ Python 3 found"
elif command_exists python; then
    HAS_PYTHON=true
    echo "✅ Python 2 found"
elif command_exists node; then
    HAS_NODE=true
    echo "✅ Node.js found"
else
    HAS_WEB=false
    echo "❌ No web server available"
fi

# Check for web files
if [ -f "index.html" ] && [ -f "game.js" ] && [ -f "style.css" ]; then
    HAS_WEB_FILES=true
    echo "✅ Web files available"
else
    HAS_WEB_FILES=false
    echo "❌ Web files not found"
fi

echo

# Present options to user
if [ "$HAS_CPP" = true ] && [ "$HAS_WEB_FILES" = true ]; then
    echo "🎮 Choose your preferred version:"
    echo "  1) 🖥️  C++ Version (Native, best performance)"
    echo "  2) 🌐 Web Version (Browser-based, universal)"
    echo "  3) ℹ️  Show game information"
    echo "  4) 🛠️  Build/Setup options"
    echo
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            echo "🚀 Starting C++ version..."
            ./highway_racing
            ;;
        2)
            echo "🌐 Starting web version..."
            PORT=$(find_free_port)
            echo "📡 Starting server on port $PORT..."
            echo "🌍 Open http://localhost:$PORT in your browser"
            echo "⚠️  Keep this terminal open while playing"
            echo "✋ Press Ctrl+C to stop the server"
            echo
            
            if [ "$HAS_PYTHON3" = true ]; then
                python3 -m http.server $PORT
            elif [ "$HAS_PYTHON" = true ]; then
                python -m SimpleHTTPServer $PORT
            elif [ "$HAS_NODE" = true ]; then
                npx http-server -p $PORT
            fi
            ;;
        3)
            echo "📋 3-Lane Highway Racing Game"
            echo "=============================="
            echo "🎯 Objective: Navigate through traffic without crashing"
            echo "🏆 Score: Based on distance, speed, and vehicles avoided"
            echo "🎮 Controls: WASD/Arrows for movement, Space to pause"
            echo "📈 Difficulty: Increases with levels (every 1000m)"
            echo
            echo "🚗 Vehicle Types:"
            echo "  • Compact Cars (Blue) - Fast and agile"
            echo "  • Sedans (Green) - Balanced speed/size"  
            echo "  • SUVs (Magenta) - Slow but valuable"
            echo "  • Sports Cars (Yellow) - Very fast"
            echo "  • Trucks (Cyan) - Largest and most points"
            echo
            echo "💡 Tips:"
            echo "  • Use lane changes strategically"
            echo "  • Higher speeds = more points but harder control"
            echo "  • Watch for traffic patterns"
            echo "  • Different vehicles have different behaviors"
            ;;
        4)
            echo "🛠️  Build and Setup Options"
            echo "=========================="
            echo "📝 Available Make commands:"
            echo "  make web              - Start web version"
            echo "  make cpp              - Build C++ version"
            echo "  make run-cpp          - Build and run C++"
            echo "  make setup-ubuntu     - Install deps + build (Ubuntu)"
            echo "  make setup-macos      - Install deps + build (macOS)"
            echo "  make clean            - Clean build files"
            echo "  make help             - Show all options"
            echo
            echo "🔧 Manual build:"
            echo "  g++ -std=c++17 highway_racing.cpp -o highway_racing \\"
            echo "      -lsfml-graphics -lsfml-window -lsfml-system -lsfml-audio"
            ;;
        *)
            echo "❌ Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
elif [ "$HAS_CPP" = true ]; then
    echo "🖥️  Only C++ version available"
    read -p "🚀 Start C++ game? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./highway_racing
    fi
    
elif [ "$HAS_WEB_FILES" = true ]; then
    echo "🌐 Only web version available"
    
    if [ "$HAS_PYTHON3" = true ] || [ "$HAS_PYTHON" = true ] || [ "$HAS_NODE" = true ]; then
        read -p "🚀 Start web server? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            PORT=$(find_free_port)
            echo "📡 Starting server on port $PORT..."
            echo "🌍 Open http://localhost:$PORT in your browser"
            echo "⚠️  Keep this terminal open while playing"
            echo "✋ Press Ctrl+C to stop the server"
            echo
            
            if [ "$HAS_PYTHON3" = true ]; then
                python3 -m http.server $PORT
            elif [ "$HAS_PYTHON" = true ]; then
                python -m SimpleHTTPServer $PORT
            elif [ "$HAS_NODE" = true ]; then
                npx http-server -p $PORT
            fi
        fi
    else
        echo "❌ No web server available"
        echo "📝 Please install Python or Node.js to run the web version"
    fi
    
else
    echo "❌ No game versions available"
    echo
    echo "🛠️  To set up the game:"
    echo "📝 For C++ version:"
    echo "   make setup-ubuntu    # Ubuntu/Debian"
    echo "   make setup-macos     # macOS"
    echo
    echo "📝 For web version only:"
    echo "   make web            # Requires Python or Node.js"
    echo
    echo "📝 Or check the README.md for detailed instructions"
fi