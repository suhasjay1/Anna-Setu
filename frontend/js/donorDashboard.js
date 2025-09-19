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
    const pickupForm = document.getElementById('pickupForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const schedulePickupBtn = document.getElementById('schedulePickupBtn');
    const notification = document.getElementById('notification');
    const approvalNotice = document.getElementById('donor-approval-notice');

    // --- INITIALIZATION ---
    if (!token || !user || user.role !== 'donor') {
        window.location.href = 'login.html';
        return;
    }
    initializeDashboard();

    function initializeDashboard() {
        setupNavigation();
        populateProfile();
        checkApprovalStatus();
        loadDonations();

        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });

        pickupForm.addEventListener('submit', handlePickupSubmit);
    }
    
    // --- NAVIGATION ---
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                contentSections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetId)?.classList.add('active');
                pageTitle.textContent = item.textContent.trim();
            });
        });
        
        if (schedulePickupBtn) {
            schedulePickupBtn.addEventListener('click', () => {
                document.querySelector('.nav-item[data-target="schedule-pickup"]').click();
            });
        }
    }

    // --- USER PROFILE & STATUS ---
    function populateProfile() {
        welcomeMessage.textContent = `Welcome, ${user.name}!`;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileDonorType').textContent = user.donorType;
        document.getElementById('profileStatus').textContent = user.status;
    }

    function checkApprovalStatus() {
        // This function now only checks if the user is pending admin approval
        if (user.status === 'pending') {
            approvalNotice.style.display = 'block';
            if (schedulePickupBtn) {
                schedulePickupBtn.disabled = true;
                schedulePickupBtn.style.opacity = '0.5';
            }
        } else {
            approvalNotice.style.display = 'none';
            if (schedulePickupBtn) {
                schedulePickupBtn.disabled = false;
                schedulePickupBtn.style.opacity = '1';
            }
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

    async function loadDonations() {
        try {
            const donations = await apiCall('/donor');
            displayDonations(donations);
        } catch (error) {
            console.error(error);
        }
    }

    function displayDonations(donations) {
        const recentList = document.getElementById('recentDonationsList');
        const historyList = document.getElementById('fullDonationHistory');
        
        if (donations.length === 0) {
            const noDonationsMsg = '<p>You have not made any donations yet.</p>';
            recentList.innerHTML = noDonationsMsg;
            historyList.innerHTML = noDonationsMsg;
            return;
        }

        const donationHTML = donations.map(d => `
            <div class="donation-item">
                <div>
                    <strong>${d.description}</strong> (${d.quantity} kg)
                    <br>
                    <small>Scheduled on: ${new Date(d.createdAt).toLocaleDateString()}</small>
                    ${d.assignedVolunteer ? `
                        <div class="volunteer-info">
                            <p><strong>Volunteer Assigned:</strong> ${d.assignedVolunteer.name}</p>
                            <p>Contact: ${d.assignedVolunteer.phone || 'Not available'}</p>
                        </div>
                    ` : ''}
                </div>
                <span class="donation-status ${d.status}">${d.status}</span>
            </div>
        `).join('');

        recentList.innerHTML = donationHTML;
        historyList.innerHTML = donationHTML;
    }
    
    async function handlePickupSubmit(event) {
        event.preventDefault();
        const formData = new FormData(pickupForm);
        const data = Object.fromEntries(formData.entries());
        try {
            await apiCall('/donor', 'POST', data);
            showNotification('Donation scheduled successfully!', 'success');
            pickupForm.reset();
            loadDonations();
            document.querySelector('.nav-item[data-target="dashboard"]').click();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = type;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});