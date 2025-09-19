document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://localhost:4000/api';

    // DOM Elements
    const profileForm = document.getElementById('profileForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const streetInput = document.getElementById('street');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const zipInput = document.getElementById('zip');
    const backToDashboardBtn = document.getElementById('backToDashboard');
    const notification = document.getElementById('notification');

    // --- INITIALIZATION ---
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }
    loadProfileData();
    
    // Determine where the "Back" button should go
    backToDashboardBtn.href = `${user.role}Dashboard.html`;

    profileForm.addEventListener('submit', handleProfileUpdate);

    // --- FUNCTIONS ---
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

    async function loadProfileData() {
        try {
            const profileData = await apiCall('/users/me');
            nameInput.value = profileData.name || '';
            emailInput.value = profileData.email || '';
            phoneInput.value = profileData.phone || '';
            if (profileData.address) {
                streetInput.value = profileData.address.street || '';
                cityInput.value = profileData.address.city || '';
                stateInput.value = profileData.address.state || '';
                zipInput.value = profileData.address.zip || '';
            }
        } catch (error) {
            showNotification('Could not load your profile data.', 'error');
        }
    }

    async function handleProfileUpdate(event) {
        event.preventDefault();
        const updatedData = {
            name: nameInput.value,
            phone: phoneInput.value,
            address: {
                street: streetInput.value,
                city: cityInput.value,
                state: stateInput.value,
                zip: zipInput.value
            }
        };

        try {
            const response = await apiCall('/users/me', 'PUT', updatedData);
            // Update the user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            showNotification('Profile updated successfully!', 'success');
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