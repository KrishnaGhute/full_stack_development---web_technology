// Wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    
    // Get the form element
    const signupForm = document.querySelector("form");

    // Add submit event listener
    signupForm.addEventListener("submit", function(event) {
        const email = document.querySelector("input[name='email']").value;
        const password = document.querySelector("input[name='password']").value;

        // Basic validation
        if(email.trim() === "" || password.trim() === "") {
            alert("Both email and password are required!");
            event.preventDefault(); // prevent form submission
        } else if(password.length < 4) {
            alert("Password must be at least 4 characters long!");
            event.preventDefault();
        }
    });

});
