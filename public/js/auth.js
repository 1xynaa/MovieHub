document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const status = document.getElementById("authStatus");

    async function submit(form, endpoint) {
        const fields = Object.fromEntries(new FormData(form).entries());
        status.textContent = "";
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        try {
            const result = await MovieHub.fetchJson(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields)
            });
            if (endpoint === "/login") {
                window.location.href = "/dashboard.html";
                return;
            }
            MovieHub.showToast(result.message);
            window.location.href = "/login.html";
        } catch (error) {
            status.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    }

    if (loginForm) loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submit(loginForm, "/login");
    });
    if (signupForm) signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submit(signupForm, "/signup");
    });
});
