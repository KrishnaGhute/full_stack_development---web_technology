<?php
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "menu_db";

// Create DB connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check DB connection
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Validate POST fields
if (!isset($_POST["name"]) || !isset($_POST["email"]) || !isset($_POST["message"])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

$name = $_POST["name"];
$email = $_POST["email"];
$message = $_POST["message"];

// Prepare SQL
$stmt = $conn->prepare("INSERT INTO contacts (name, email, message) VALUES (?,?,?)");
$stmt->bind_param("sss", $name, $email, $message);

// Execute
if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Message sent successfully!"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to save message"]);
}

$stmt->close();
$conn->close();
?>
