document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://localhost:4000/api';
    let currentTaskId = null;

    // --- DOM Elements ---
    const pageTitle = document.getElementById('pageTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const tasksListContainer = document.getElementById('tasks-list');
    const logoutBtn = document.getElementById('logoutBtn');
    const notification = document.getElementById('notification');
    const qualityCheckModal = document.getElementById('qualityCheckModal');
    const qualityCheckForm = document.getElementById('qualityCheckForm');
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // --- INITIALIZATION ---
    if (!token || user?.role !== 'volunteer') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    initializeDashboard();

    function initializeDashboard() {
        welcomeMessage.textContent = `Welcome, ${user.name}!`;
        setupNavigation();
        loadAllData();
        
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });

        tasksListContainer.addEventListener('click', handleTaskAction);
        
        if (qualityCheckForm) {
            qualityCheckForm.addEventListener('submit', handleQualityCheckSubmit);
            qualityCheckModal.querySelector('.close-btn').addEventListener('click', () => qualityCheckModal.classList.remove('active'));
        }

        // Add event listeners for the training accordion
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('active');
            });
        });
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
            fetchAndRenderStats(),
            fetchAndRenderTasks()
        ]);
    }
    
    async function fetchAndRenderStats() {
        try {
            const stats = await apiCall('/volunteer/stats');
            document.getElementById('stat-tasks-completed').textContent = stats.tasksCompleted;
            document.getElementById('stat-active-tasks').textContent = stats.activeTasks;
            document.getElementById('stat-meals-served').textContent = stats.mealsServed;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async function fetchAndRenderTasks() {
        try {
            const tasks = await apiCall('/volunteer/tasks');
            
            const recentDeliveries = tasks.filter(t => t.status === 'Completed').slice(0, 5);
            const recentListEl = document.getElementById('recent-deliveries-list');
            if (recentListEl) {
                if (recentDeliveries.length > 0) {
                    recentListEl.innerHTML = recentDeliveries.map(t => `<div class="list-item"><span>Donation from ${t.donation.donor.name}</span><span>Completed</span></div>`).join('');
                } else {
                    recentListEl.innerHTML = '<p>No completed deliveries yet.</p>';
                }
            }

            const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Rejected');
             if (activeTasks.length > 0) {
                tasksListContainer.innerHTML = activeTasks.map(createTaskCard).join('');
            } else {
                tasksListContainer.innerHTML = '<p>You have no active tasks.</p>';
            }
        } catch (error) {
            tasksListContainer.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    function createTaskCard(task) {
        const { donation, receiver, status, _id } = task;
        const receiverAddress = (receiver && receiver.address && receiver.address.city) ? `${receiver.address.street}, ${receiver.address.city}` : 'Address not provided';
        return `
            <div class="task-card">
                <div class="task-header">
                    <h4>Donation from ${donation.donor.name}</h4>
                    <span class="task-status">${status}</span>
                </div>
                <div class="task-body">
                    <h5>Pickup Details</h5>
                    <p>Contact: ${donation.donor.name} (${donation.donor.phone || 'N/A'})</p>
                    <p>Address: ${donation.pickupAddress}</p>
                    
                    <h5>Delivery Details</h5>
                    <p>Contact: ${receiver.name} (${receiver.phone || 'N/A'})</p>
                    <p>Address: ${receiverAddress}</p>

                    ${donation.additionalGuidelines ? `<h5>Special Instructions</h5><p class="guidelines">${donation.additionalGuidelines}</p>` : ''}
                </div>
                <div class="task-actions">
                    ${renderTaskButtons(_id, status)}
                </div>
            </div>
        `;
    }
    
    function renderTaskButtons(taskId, status) {
        switch (status) {
            case 'Pending Acceptance':
                return `<button class="btn btn-danger" data-task-id="${taskId}" data-new-status="Rejected">Reject</button>
                        <button class="btn btn-primary" data-task-id="${taskId}" data-new-status="Accepted">Accept</button>`;
            case 'Accepted':
                return `<button class="btn btn-primary" data-task-id="${taskId}" data-action="open-qc-modal">Mark as Picked Up</button>`;
            case 'Picked Up':
                return `<button class="btn btn-primary" data-task-id="${taskId}" data-new-status="Delivered">Mark as Delivered</button>`;
            default:
                return `<p>No actions available.</p>`;
        }
    }

    function handleTaskAction(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const { taskId, newStatus, action } = button.dataset;

        if (action === 'open-qc-modal') {
            openQualityCheckModal(taskId);
            return;
        }

        if (taskId && newStatus) {
            if (newStatus === 'Rejected' && !confirm('Are you sure you want to reject this task?')) {
                return;
            }
            updateTaskStatus(taskId, { status: newStatus });
        }
    }
    
    function openQualityCheckModal(taskId) {
        currentTaskId = taskId;
        if (qualityCheckForm) qualityCheckForm.reset();
        if (qualityCheckModal) qualityCheckModal.classList.add('active');
    }

    async function handleQualityCheckSubmit(event) {
        event.preventDefault();
        if (!currentTaskId) return;

        const qualityCheckData = {
            foodQuality: document.getElementById('foodQuality').value,
            packaging: document.getElementById('packaging').value,
            remarks: document.getElementById('remarks').value,
        };
        
        const payload = {
            status: 'Picked Up',
            qualityCheck: qualityCheckData
        };
        
        await updateTaskStatus(currentTaskId, payload);
        if (qualityCheckModal) qualityCheckModal.classList.remove('active');
    }

    async function updateTaskStatus(taskId, payload) {
        try {
            await apiCall(`/volunteer/tasks/${taskId}/status`, 'PATCH', payload);
            showNotification(`Task status updated successfully!`, 'success');
            loadAllData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function showNotification(message, type) {
        if (!notification) return;
        notification.textContent = message;
        notification.className = type;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});