<?php
include 'database.php';

if(isset($_POST['email']) && isset($_POST['password'])) {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Check if user already exists
    $check = "SELECT * FROM users WHERE email='$email'";
    $result = mysqli_query($conn, $check);
    if(mysqli_num_rows($result) > 0){
        echo "Email already registered! <a href='signin.html'>Login here</a>";
    } else {
        // Hash password for security
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (email, password) VALUES ('$email', '$hashed_password')";

        if(mysqli_query($conn, $sql)){
            echo "Registration successful! <a href='signin.html'>Login Now</a>";
        } else {
            echo "Error: " . mysqli_error($conn);
        }
    }

    mysqli_close($conn);
} else {
    echo "Please fill the form!";
}
?>
