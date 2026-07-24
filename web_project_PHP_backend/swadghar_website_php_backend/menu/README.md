# Swaad Ghar

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.x-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/XAMPP-Apache%20%2B%20MySQL-FF6C37?style=for-the-badge" alt="XAMPP" />
</p>

<p align="center">
  <img src="https://via.placeholder.com/1200x400?text=Project+Banner" alt="Project Banner Placeholder" width="100%" />
</p>

## Overview

Swaad Ghar is a lightweight restaurant and recipe website built using plain PHP, MySQL, HTML, CSS, and JavaScript. The project presents a clean food-brand experience with a recipe menu, blog pages, contact form, and a simple user authentication flow for login and registration.

This repository is designed as a practical full-stack web development project that demonstrates basic server-side form handling, session management, and database persistence in a beginner-friendly structure.

## Features

- Responsive restaurant landing page with feature highlights
- Recipe catalog with interactive modal popups
- Contact form integrated with a PHP backend
- MySQL-backed contact submission flow
- Sign-up and sign-in pages
- Session-based login and logout flow
- Blog pages for recipe and cooking content
- Simple client-side validation for form input

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- PHP

### Database
- MySQL

### Server Environment
- Apache via XAMPP

### Tools
- VS Code
- Browser-based local testing
- MySQL database management via phpMyAdmin or terminal

## Architecture

> Architecture Diagram Placeholder
>
> A simple layered architecture is used in this project:
>
> `Browser -> HTML/CSS/JS Frontend -> PHP Handlers -> MySQL Database`

```text
Client Browser
    │
    ├── Static Pages: index.html, menu.html, about.html, contact.html, blog pages
    │
    ├── JavaScript: script.js, form validation, modal interactions
    │
    └── PHP Backend: signup_process.php, signin_process.php, contact.php, database.php
            │
            └── MySQL Database: users, contacts
```

## Folder Structure

```text
swadghar_website_php_backend/
├── menu/
│   ├── about.html
│   ├── blog1.html
│   ├── blog2.html
│   ├── contact.html
│   ├── contact.php
│   ├── home.php
│   ├── index.html
│   ├── menu.html
│   ├── README.md
│   ├── script.js
│   ├── style.css
│   └── styles.css
└── mywebsite/
    ├── assets/
    │   ├── signin.css
    │   ├── signin.js
    │   ├── signup.css
    │   └── signup.js
    ├── database.php
    ├── logout.php
    ├── signin.html
    ├── signin_process.php
    ├── signup.html
    └── signup_process.php
```

## Installation

### Prerequisites

- XAMPP or similar Apache + MySQL stack
- A modern web browser
- PHP enabled in the local server environment

### Steps

1. Clone or download this repository into your local web server root.
2. Start Apache and MySQL.
3. Create the necessary MySQL databases and tables.
4. Update connection credentials if your local environment differs from the defaults.
5. Access the site through your browser.

### Database Setup

Create the `users` table for authentication:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);
```

Create the `contacts` table for the contact form:

```sql
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Public Website

Open the browser and navigate to:

```text
http://localhost/menu/
```

### Authentication Flow

- Sign up at `mywebsite/signup.html`
- Sign in at `mywebsite/signin.html`
- After successful login, the user is redirected to the menu section through the PHP session flow

## Screenshots

> Screenshots Placeholder
>
> Add screenshots of the home page, menu, contact form, and login/signup flow here to showcase the UI.

![Home Page Screenshot Placeholder](https://via.placeholder.com/800x450?text=Homepage+Screenshot)

## Results

This project demonstrates a complete beginner-to-intermediate full-stack workflow using core web technologies:

- A clean restaurant brand website
- Database-backed contact form handling
- Password hashing and session management
- Structured front-end and back-end code separation

It is a strong portfolio project for showcasing practical PHP, MySQL, and web development fundamentals.

## Future Scope

- Add a proper admin dashboard for contact and user management
- Replace manual database credentials with environment configuration
- Improve security with CSRF protection and input validation
- Introduce a proper MVC or framework-based architecture
- Add image gallery, online ordering, and reservation support

## Author

Created as a PHP + MySQL web development project focused on restaurant branding, recipe presentation, and authentication flow.

## License

This project is intended for educational and portfolio purposes.

<parameter name="filePath">c:\xampp\htdocs\menu\README.md
