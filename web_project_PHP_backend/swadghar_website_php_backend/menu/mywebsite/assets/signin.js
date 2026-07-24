document.addEventListener("DOMContentLoaded", function() {

    const signinForm = document.querySelector("form");

    signinForm.addEventListener("submit", function(event) {
        const email = document.querySelector("input[name='email']").value;
        const password = document.querySelector("input[name='password']").value;

        // Basic validation
        if(email.trim() === "" || password.trim() === "") {
            alert("Both email and password are required!");
            event.preventDefault(); // prevent form submission
        }
    });

});
