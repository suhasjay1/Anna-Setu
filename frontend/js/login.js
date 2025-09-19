document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userTypeSelect = document.getElementById('userType');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const notification = document.getElementById('notification');
    
    // API base URL
    const API_BASE_URL = 'http://localhost:4000/api';

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

    // --- Functions ---
    async function handleLogin(event) {
        event.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const userType = userTypeSelect.value;

        if (!userType) {
            showNotification('Please select a user role.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }
            
            // On successful login, save token and user data to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showNotification(data.message, 'success');

            // Redirect to the correct dashboard after a short delay
            setTimeout(() => redirectByRole(data.user.role), 1000);

        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    function redirectByRole(role) {
        switch (role) {
            case 'admin':
                window.location.href = 'adminDashboard.html';
                break;
            case 'donor':
                window.location.href = 'donorDashboard.html';
                break;
            case 'volunteer':
                window.location.href = 'volunteerDashboard.html';
                break;
            case 'receiver':
                window.location.href = 'receiverDashboard.html';
                break;
            default:
                // Fallback to login page if role is unknown
                window.location.href = 'login.html';
        }
    }

    function togglePasswordVisibility() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    }

    function setLoading(isLoading) {
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        if (isLoading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            loginBtn.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = type; // 'success' or 'error'
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});