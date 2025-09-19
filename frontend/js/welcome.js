document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Check if the welcome message has already been shown in this session
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    if (welcomeShown) return;

    const quotes = {
        donor: "The value of a man resides in what he gives and not in what he is capable of receiving. - Albert Einstein",
        volunteer: "The best way to find yourself is to lose yourself in the service of others. - Mahatma Gandhi",
        receiver: "There is no exercise better for the heart than reaching down and lifting people up. - John Holmes",
        admin: "Leadership is the capacity to translate vision into reality. - Warren Bennis"
    };

    const quote = quotes[user.role] || "Welcome to Anna Setu!";

    // Create and show the modal
    const modal = document.createElement('div');
    modal.className = 'welcome-modal';
    modal.innerHTML = `
        <div class="welcome-modal-content">
            <button class="close-btn">&times;</button>
            <h3>Welcome, ${user.name}!</h3>
            <p class="quote">"${quote}"</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listener to close button
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.remove();
    });

    // Mark as shown for this session
    sessionStorage.setItem('welcomeShown', 'true');
});