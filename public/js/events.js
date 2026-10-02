document.addEventListener("DOMContentLoaded", () => {
    const events = [
        { title: "Sunset Sessions: Live in Chennai", category: "Concerts", date: "17 Oct 2026", location: "YMCA Grounds, Chennai", price: "From ₹799", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85" },
        { title: "The Laughing Club", category: "Comedy", date: "18 Oct 2026", location: "The Music Academy, Chennai", price: "From ₹399", image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=900&q=85" },
        { title: "Chennai City Football Night", category: "Sports", date: "24 Oct 2026", location: "Jawaharlal Nehru Stadium", price: "From ₹599", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=85" },
        { title: "An Evening of Theatre", category: "Theatre", date: "25 Oct 2026", location: "Bharat Kalachar, Chennai", price: "From ₹299", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=85" },
        { title: "Indie Waves Festival", category: "Concerts", date: "30 Oct 2026", location: "ECR, Chennai", price: "From ₹999", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85" },
        { title: "Mic Drop: Stand-up Night", category: "Comedy", date: "31 Oct 2026", location: "Phoenix Marketcity, Chennai", price: "From ₹349", image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=85" }
    ];
    const grid = document.getElementById("eventGrid");
    if (!grid) return;

    const filter = new URLSearchParams(window.location.search).get("type");
    const typeMap = { Music: "Concerts", Plays: "Theatre", Activities: "" };
    const activeCategory = typeMap[filter] !== undefined ? typeMap[filter] : filter;
    const visibleEvents = events.filter((event) => !activeCategory || event.category.toLowerCase() === activeCategory.toLowerCase());
    grid.innerHTML = visibleEvents.map((event) => `
        <article class="event-card">
            <img src="${MovieHub.escapeHtml(event.image)}" alt="${MovieHub.escapeHtml(event.title)}" loading="lazy">
            <div class="event-card-info"><span class="event-category">${MovieHub.escapeHtml(event.category)}</span><h2>${MovieHub.escapeHtml(event.title)}</h2>
                <p>${MovieHub.escapeHtml(event.date)} · ${MovieHub.escapeHtml(event.location)}</p>
                <div class="event-card-bottom"><span>${MovieHub.escapeHtml(event.price)}</span><button class="button button-primary button-small event-book" type="button">Book now</button></div>
            </div>
        </article>`).join("");
    grid.querySelectorAll(".event-book").forEach((button) => button.addEventListener("click", () => {
        MovieHub.showToast("Event booking demo: ticket sales open soon.");
    }));
});
