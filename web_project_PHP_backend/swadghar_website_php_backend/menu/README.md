# Swaad Ghar - Indian Recipe Website

## Overview
Swaad Ghar is a family-owned Indian restaurant website that brings homemade Indian flavors to your plate. This project showcases traditional Indian recipes with a modern web interface.

## Features
- **Home Page**: Welcome section with featured recipes
- **Menu**: Collection of popular Indian recipes (Paneer Butter Masala, Chicken Biryani, Masala Dosa, etc.)
- **About**: Information about the restaurant
- **Contact**: Contact form with backend processing
- **Blog**: Additional blog posts
- **User Authentication**: Login system (redirects to a separate signin page)
- **Responsive Design**: Mobile-friendly navigation and layout

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: PHP
- **Database**: MySQL
- **Server**: Apache (via XAMPP)

## Setup Instructions

### Prerequisites
- XAMPP (or similar Apache + MySQL stack)
- Web browser

### Installation
1. Clone or download this project to your `htdocs` folder (e.g., `C:\xampp\htdocs\menu`)
2. Start XAMPP and ensure Apache and MySQL are running
3. Create a MySQL database named `menu_db`
4. Create a table `contacts` with the following structure:
   ```sql
   CREATE TABLE contacts (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) NOT NULL,
       message TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
5. Update database credentials in `contact.php` if necessary (default: localhost, root, no password)

### Running the Application
1. Open your web browser
2. Navigate to `http://localhost/menu/`
3. The home page should load

### User Login
- The site includes a login check; if not logged in, it redirects to `/mywebsite/signin.html` (external)
- After login, users are redirected to `index.html`

## File Structure
- `index.html` - Home page
- `menu.html` - Recipes menu
- `about.html` - About page
- `contact.html` - Contact page
- `contact.php` - Contact form backend
- `home.php` - Login check and redirect
- `blog1.html`, `blog2.html` - Blog pages
- `script.js` - JavaScript for interactivity
- `style.css`, `styles.css` - CSS stylesheets

## Contributing
Feel free to contribute by adding more recipes or improving the design.

## License
This project is for educational purposes.</content>
<parameter name="filePath">c:\xampp\htdocs\menu\README.md