# TruckHub — Truck Dealership Web App

## Project Title

TruckHub — Truck Dealership Web App

## Description

TruckHub is a small web application demonstrating a static frontend (HTML/CSS/JavaScript) connected to a server-side backend. The backend in this repository is implemented in C++ for business logic and exposes JSON APIs for the frontend to consume. The project shows a simple booking and contact flow for a truck dealership.

## Technologies Used

- HTML
- CSS
- JavaScript
- C++ (backend)
- JSON (data interchange)

## Installation

These instructions assume you want to run the project locally.

1. Clone or copy the repository to your machine.
2. Frontend: the static files are in `truck_frontend/`. You can open `index.html` directly in the browser for a static preview.
3. Backend (C++): build and run the backend server. Example steps below use a typical Linux-like toolchain; on Windows you can build with Visual Studio or MinGW.

Example (Linux / macOS with g++ and make):

```bash
# From project root (adjust paths as needed)
cd backend
make        # if a Makefile exists; otherwise compile the C++ server manually
# or compile manually (example):
g++ -std=c++17 -O2 -o truck_backend truck_dealership_backend.cpp -lpthread
./truck_backend
```

If your backend binds to a port (e.g. `http://localhost:8080`), make sure that port is available and the frontend fetch calls point to the correct base URL.

## Usage

- Start the backend server (see build/run commands above).
- Open the frontend files in a browser (`truck_frontend/index.html`), or serve them with a static server (e.g. `npx http-server` or a local web server) so network requests are allowed.
- Use the UI to submit a booking or contact request. The frontend will POST JSON to the backend API and display the response.

Example run (serving frontend with a simple Node static server):

```bash
# install http-server if needed
npx http-server truck_frontend -p 3000
# then open http://localhost:3000 in your browser
```

## Features

- Responsive static frontend with pages for gallery, finance, compare, contact and booking.
- Booking form that validates input client-side and POSTs JSON to the backend API.
- Contact form that POSTs messages to the backend.
- Backend implemented in C++ exposing JSON REST endpoints for receiving bookings and contact messages.

## Folder Structure

- `truck_frontend/` — HTML, CSS and JavaScript frontend files.
  - `index.html`, `gallery.html`, `contact.html`, `signup.html` (repurposed as booking), etc.
  - `booking.js` — client-side booking logic.
- `backend/` — backend sources and server (C++):
  - `truck_dealership_backend.cpp` — main C++ backend server source.
  - (optional) server config and supporting PHP endpoints if present in this repo.
- `logs/` — application logs (if server writes logs here).
- `README.md` — this file.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make your changes and test locally.
4. Commit, push, and open a Pull Request describing your changes.

Please follow these guidelines:
- Keep changes small and focused.
- Write clear commit messages.
- Ensure the frontend and backend remain decoupled via JSON APIs.

## License

Add license information here (e.g., MIT, Apache-2.0). Replace this placeholder with the actual license text or file.

---

If you want, I can also generate a `backend/README.md` with build flags and a sample `Makefile` for the C++ server, or create a small script to run the backend and a static file server together.
