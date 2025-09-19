document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://localhost:4000/api';

    // --- DOM Elements ---
    const pageTitle = document.getElementById('pageTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const deliveriesListContainer = document.getElementById('deliveries-list');
    const requestForm = document.getElementById('requestForm');
    const myRequestsList = document.getElementById('my-requests-list');
    const logoutBtn = document.getElementById('logoutBtn');
    const notification = document.getElementById('notification');

    // --- INITIALIZATION ---
    if (!token || user?.role !== 'receiver') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    initializeReceiverDashboard();

    function initializeReceiverDashboard() {
        welcomeMessage.textContent = `Welcome, ${user.name}!`;
        setupNavigation();
        loadAllData();

        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });

        requestForm.addEventListener('submit', handleRequestSubmit);
        deliveriesListContainer.addEventListener('click', handleDeliveryAction);
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                 if (item.getAttribute('href') !== '#') return;
                e.preventDefault();
                const targetId = item.dataset.target;
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                contentSections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetId)?.classList.add('active');
                pageTitle.textContent = item.textContent.trim();
            });
        });
    }
    
    // --- PROFILE (Note: Profile section is now on the dashboard, not a separate page) ---
    async function populateProfile() {
        try {
            const profileData = await apiCall('/users/me');
            document.getElementById('profileName').textContent = profileData.name || '';
            document.getElementById('profileEmail').textContent = profileData.email || '';
            const adr = profileData.address;
            document.getElementById('profileAddress').textContent = (adr && adr.street) ? `${adr.street}, ${adr.city}, ${adr.state}` : 'Not provided';
            document.getElementById('profileStatus').textContent = profileData.status || '';
        } catch (error) {
            console.error("Could not load profile data", error);
        }
    }

    // --- API & DATA HANDLING ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'An API error occurred.');
        return data;
    }

    async function loadAllData() {
        await Promise.all([
            fetchAndRenderDeliveries(),
            fetchAndRenderRequests(),
            fetchAndRenderHistory()
        ]);
    }

    async function fetchAndRenderDeliveries() {
        try {
            const deliveries = await apiCall('/receiver/deliveries/upcoming');
            if (deliveries.length === 0) {
                deliveriesListContainer.innerHTML = '<p>You have no upcoming deliveries.</p>';
                return;
            }
            deliveriesListContainer.innerHTML = deliveries.map(task => `
                <div class="delivery-card">
                    <p><strong>${task.donation.description}</strong> (${task.donation.quantity} kg)</p>
                    <p class="meta-info">From: ${task.donation.donor.name} | Via: ${task.volunteer.name}</p>
                    ${task.status === 'Delivered' 
                        ? `<button class="btn btn-primary" data-task-id="${task._id}" style="margin-top: 10px;">Confirm Receipt</button>` 
                        : `<p class="meta-info">Status: ${task.status}</p>`
                    }
                </div>
            `).join('');
        } catch (error) {
            deliveriesListContainer.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }
    
    async function fetchAndRenderHistory() {
        const historyListEl = document.getElementById('history-list');
        try {
            const history = await apiCall('/receiver/deliveries/history');
            if (history.length === 0) {
                historyListEl.innerHTML = '<p>You have no past deliveries.</p>';
                return;
            }
            historyListEl.innerHTML = history.map(task => `
                <div class="delivery-card">
                    <p><strong>${task.donation.description}</strong> (${task.donation.quantity} kg)</p>
                    <p class="meta-info">Received from ${task.donation.donor.name} on ${new Date(task.updatedAt).toLocaleDateString()}</p>
                </div>
            `).join('');
        } catch (error) {
            historyListEl.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function fetchAndRenderRequests() {
        try {
            const requests = await apiCall('/receiver/requests');
            if (requests.length === 0) {
                myRequestsList.innerHTML = '<p>You have not posted any requests.</p>';
                return;
            }
            myRequestsList.innerHTML = requests.map(req => `
                <div class="request-item">
                    <p>${req.details}</p>
                    <p class="meta-info">Status: ${req.status} | Posted on: ${new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
            `).join('');
        } catch (error) {
            myRequestsList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function handleRequestSubmit(event) {
        event.preventDefault();
        const details = event.target.elements.details.value;
        if (!details) return;
        try {
            await apiCall('/receiver/requests', 'POST', { details });
            showNotification('Your request has been posted!', 'success');
            event.target.reset();
            fetchAndRenderRequests();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function handleDeliveryAction(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const taskId = button.dataset.taskId;
        if (confirm('Are you sure you want to confirm receipt of this delivery?')) {
            try {
                await apiCall(`/receiver/tasks/${taskId}/confirm`, 'POST');
                showNotification('Delivery confirmed. Thank you!', 'success');
                loadAllData();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    }
    
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = type;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});