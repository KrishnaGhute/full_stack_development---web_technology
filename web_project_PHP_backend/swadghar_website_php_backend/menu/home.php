<?php
session_start();
if(!isset($_SESSION['user'])){
    header("Location: /mywebsite/signin.html");
    exit;
}
?>

<script>
window.location.href = "index.html"; // send to your HTML website
</script>
