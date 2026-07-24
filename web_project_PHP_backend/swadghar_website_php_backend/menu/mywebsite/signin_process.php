<?php
session_start();
include 'database.php';

if(isset($_POST['email']) && isset($_POST['password'])) {

    $email = $_POST['email'];
    $password = $_POST['password'];

    $sql = "SELECT * FROM users WHERE email='$email'";
    $result = mysqli_query($conn, $sql);

    if(mysqli_num_rows($result) === 1){
        $row = mysqli_fetch_assoc($result);

        if(password_verify($password, $row['password'])){

            // CREATE SESSION
            $_SESSION['user'] = $row['email'];

            // REDIRECT TO MENU WEBSITE
            header("Location: /menu/home.php");
            exit();

        } else {
            echo "Invalid Password! <a href='signin.html'>Try Again</a>";
        }

    } else {
        echo "Email not registered! <a href='signup.html'>Sign Up Here</a>";
    }

} else {
    echo "Please submit the form!";
}
?>
