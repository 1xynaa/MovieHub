document.addEventListener("DOMContentLoaded", async () => {
    const loginLinks = document.querySelectorAll("[data-auth='login']");
    const signupLinks = document.querySelectorAll("[data-auth='signup']");
    const dashboardLinks = document.querySelectorAll("[data-auth='dashboard']");
    const profileLinks = document.querySelectorAll("[data-auth='profile']");
    const logoutLinks = document.querySelectorAll("[data-auth='logout']");

    try {
        const user = await MovieHub.fetchJson("/user");
        loginLinks.forEach((link) => link.classList.toggle("hidden", user.loggedIn));
        signupLinks.forEach((link) => link.classList.toggle("hidden", user.loggedIn));
        dashboardLinks.forEach((link) => link.classList.toggle("hidden", !user.loggedIn));
        profileLinks.forEach((link) => {
            link.classList.toggle("hidden", !user.loggedIn);
            if (user.loggedIn) link.textContent = user.name;
        });
        logoutLinks.forEach((link) => link.classList.toggle("hidden", !user.loggedIn));
        const name = document.querySelector("[data-user-name]");
        if (name && user.loggedIn) name.textContent = user.name;
    } catch (error) {
        console.error("Could not check sign-in status:", error.message);
        MovieHub.showToast("Could not load your account status.");
    }

    document.querySelectorAll("[data-auth='logout']").forEach((link) => {
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            try {
                await MovieHub.fetchJson("/logout");
                window.location.href = "/";
            } catch (error) {
                MovieHub.showToast(error.message);
            }
        });
    });

    document.querySelectorAll("[data-search-form]").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const input = form.querySelector("input");
            const search = input.value.trim();
            window.location.href = `/movies.html${search ? `?q=${encodeURIComponent(search)}` : ""}`;
        });
    });
});
