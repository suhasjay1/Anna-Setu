document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://localhost:4000/api';
    let currentUserId = null;
    let currentDonationId = null;
    let pendingUsersData = [];
    let pendingDonationsData = [];
    let allVolunteers = [];
    let allReceivers = [];
    let currentSection = 'dashboard';
     let allTasksData = [];

    // --- DOM Elements ---
    const pageTitle = document.getElementById('pageTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pendingApprovalsCard = document.getElementById('pendingApprovalsCard');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDetailsModal = document.getElementById('userDetailsModal');
    const assignTaskModal = document.getElementById('assignTaskModal');
    const approveUserBtn = document.getElementById('approveUserBtn');
    const rejectUserBtn = document.getElementById('rejectUserBtn');
    const assignTaskForm = document.getElementById('assignTaskForm');
    const notification = document.getElementById('notification');
    const filterUsersRole = document.getElementById('filterUsersRole');
    const filterUsersStatus = document.getElementById('filterUsersStatus');
    const logSaleForm = document.getElementById('logSaleForm');
    const pendingUsersList = document.getElementById('pending-users-list');
    const pendingDonationsList = document.getElementById('pending-donations-list');
      const allTasksList = document.getElementById('all-tasks-list');
    const qualityCheckReportModal = document.getElementById('qualityCheckReportModal');
        const openRequestsList = document.getElementById('open-requests-list');

    // --- INITIALIZATION ---
    if (!token || user?.role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    initializeAdminDashboard();

    function initializeAdminDashboard() {
        welcomeMessage.textContent = `Welcome, ${user.name}.`;
        setupNavigation();
        loadAllData();
        
        pendingApprovalsCard.addEventListener('click', () => {
            document.querySelector('.nav-item[data-target="approvals"]')?.click();
        });
        allTasksList.addEventListener('click', handleTaskListClick);
        qualityCheckReportModal.querySelector('.close-btn').addEventListener('click', () => qualityCheckReportModal.classList.remove('active'));
        
        
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });

        document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => {
            userDetailsModal.classList.remove('active');
            assignTaskModal.classList.remove('active');
        });

        approveUserBtn.addEventListener('click', handleApproveUser);
        rejectUserBtn.addEventListener('click', handleRejectUser);
        openRequestsList.addEventListener('click', handleRequestListClick);
        assignTaskForm.addEventListener('submit', handleAssignTask);
        if (logSaleForm) {
            logSaleForm.addEventListener('submit', handleLogSale);
        }
        
        if (filterUsersRole) filterUsersRole.addEventListener('change', fetchAndRenderAllUsers);
        if (filterUsersStatus) filterUsersStatus.addEventListener('change', fetchAndRenderAllUsers);

        pendingUsersList.addEventListener('click', handleUserListClick);
        pendingDonationsList.addEventListener('click', handleDonationListClick);

        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // --- NAVIGATION ---
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                currentSection = targetId;
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                contentSections.forEach(section => section.classList.remove('active'));
                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.classList.add('active');
                pageTitle.textContent = item.textContent.trim();
            });
        });
    }

    // --- DATA FETCHING & RENDERING ---
    async function loadAllData() {
        await Promise.all([
            fetchAndRenderDashboardStats(),
            fetchAndRenderPendingUsers(),
            fetchAndRenderPendingDonations(),
            fetchUsersForAssignment(),
            fetchAndRenderAllUsers(),
            fetchAndRenderActivity(),
            fetchAndRenderCompostData(),
            fetchAndRenderAllTasks(),
            fetchAndRenderOpenRequests()
        ]);
    }

    async function fetchAndRenderAllTasks() {
        try {
            allTasksData = await apiCall('/admin/tasks');
            if (allTasksData.length === 0) {
                allTasksList.innerHTML = '<p>No tasks have been created yet.</p>';
                return;
            }
            allTasksList.innerHTML = allTasksData.map(task => `
                <div class="list-item">
                    <div class="item-info">
                        <p class="item-title">${task.donation.description}</p>
                        <p class="item-meta">Volunteer: ${task.volunteer.name} | Receiver: ${task.receiver.name} | Status: <span class="status-${task.status.replace(/\s+/g, '-').toLowerCase()}">${task.status}</span></p>
                    </div>
                    ${task.qualityCheck && task.qualityCheck.foodQuality ? 
                        `<button class="btn btn-secondary" data-task-id="${task._id}" data-action="view-qc-report">View QC</button>` : ''
                    }
                </div>
            `).join('');
        } catch (error) {
            allTasksList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    
   async function fetchAndRenderDashboardStats() {
        try {
            const stats = await apiCall('/admin/stats');
            
            // Populate the 4 main stat cards
            document.getElementById('stat-total-donors').textContent = stats.totalDonors || 0;
            document.getElementById('stat-total-receivers').textContent = stats.totalReceivers || 0;
            document.getElementById('stat-active-volunteers').textContent = stats.activeVolunteers || 0;
            document.getElementById('stat-meals-served').textContent = `~${stats.mealsServed || 0}`;
            
            // Populate the "Pending Approvals" summary box
            document.getElementById('approval-volunteers').textContent = stats.pendingVolunteers || 0;
            document.getElementById('approval-donors').textContent = stats.pendingDonors || 0;
            document.getElementById('approval-recipients').textContent = stats.pendingReceivers || 0;
        } catch (error) { console.error("Could not load stats:", error); }
    }

    async function fetchAndRenderActivity() {
        const listEl = document.getElementById('activity-list');
        try {
            const activities = await apiCall('/admin/activity');
            if (activities.length === 0) {
                listEl.innerHTML = '<p>No recent activity.</p>';
                return;
            }
            listEl.innerHTML = activities.map(act => `
                <div class="activity-item">
                    <p>${act.text}</p>
                    <p class="meta-info">${new Date(act.createdAt).toLocaleString()}</p>
                </div>
            `).join('');
        } catch (error) { listEl.innerHTML = `<p class="error">${error.message}</p>`; }
    }
    
    async function fetchAndRenderPendingUsers() {
        try {
            pendingUsersData = await apiCall('/admin/pending-users');
            if (pendingUsersData.length === 0) {
                pendingUsersList.innerHTML = '<p>No users are currently awaiting approval.</p>';
                return;
            }
            pendingUsersList.innerHTML = pendingUsersData.map(u => `
                <div class="list-item">
                    <div class="item-info"><p class="item-title">${u.name}</p><p class="item-meta">${u.email} | Role: ${u.role}</p></div>
                    <button class="btn btn-secondary" data-user-id="${u._id}" data-action="view-user">View</button>
                </div>`).join('');
        } catch (error) { pendingUsersList.innerHTML = `<p class="error">${error.message}</p>`; }
    }
    
    async function fetchAndRenderPendingDonations() {
        try {
            pendingDonationsData = await apiCall('/admin/pending-donations');
            if (pendingDonationsData.length === 0) {
                pendingDonationsList.innerHTML = '<p>There are no pending donations to assign.</p>';
                return;
            }
            pendingDonationsList.innerHTML = pendingDonationsData.map(d => `
                <div class="list-item">
                    <div class="item-info"><p class="item-title">${d.description} (${d.quantity} kg)</p><p class="item-meta">From: ${d.donor.name} | Type: ${d.type}</p></div>
                    <button class="btn btn-primary" data-donation-id="${d._id}" data-action="assign-donation">Assign</button>
                </div>`).join('');
        } catch (error) { pendingDonationsList.innerHTML = `<p class="error">${error.message}</p>`; }
    }

    async function fetchAndRenderAllUsers() {
        const listEl = document.getElementById('all-users-list');
        const roleFilter = filterUsersRole.value;
        const statusFilter = filterUsersStatus.value;
        const params = new URLSearchParams();
        if (roleFilter) params.append('role', roleFilter);
        if (statusFilter) params.append('status', statusFilter);
        try {
            const allUsers = await apiCall(`/admin/users?${params.toString()}`);
            if (allUsers.length === 0) {
                listEl.innerHTML = '<p>No users match the current filters.</p>';
                return;
            }
            listEl.innerHTML = allUsers.map(u => `
                <div class="list-item">
                    <div class="item-info">
                        <p class="item-title">${u.name}</p>
                        <p class="item-meta">${u.email} | Role: ${u.role} | Status: <span class="status-${u.status}">${u.status}</span></p>
                    </div>
                </div>`).join('');
        } catch (error) { listEl.innerHTML = `<p class="error">${error.message}</p>`; }
    }
    
    async function fetchUsersForAssignment() {
        try {
            [allVolunteers, allReceivers] = await Promise.all([
                apiCall('/admin/users?role=volunteer&status=approved'),
                apiCall('/admin/users?role=receiver&status=approved')
            ]);
        } catch (error) { console.error("Failed to fetch users for assignment:", error); }
    }
   async function fetchAndRenderOpenRequests() {
        try {
            const requests = await apiCall('/admin/requests');
            if (requests.length === 0) {
                openRequestsList.innerHTML = '<p>There are no open food requests.</p>';
                return;
            }
            // UPDATED to include the new button
            openRequestsList.innerHTML = requests.map(req => `
                <div class="list-item">
                    <div class="item-info">
                        <p class="item-title">${req.details}</p>
                        <p class="item-meta">From: ${req.receiver.name}</p>
                    </div>
                    <button class="btn btn-primary" data-request-id="${req._id}" data-action="fulfill-request">Mark as Fulfilled</button>
                </div>
            `).join('');
        } catch (error) {
            openRequestsList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function fetchAndRenderCompostData() {
        const donationsListEl = document.getElementById('compost-donations-list');
        const salesHistoryEl = document.getElementById('compost-sales-history');
        try {
            const [donations, sales] = await Promise.all([
                apiCall('/compost/donations'),
                apiCall('/compost/sales')
            ]);
            if (donations.length === 0) {
                donationsListEl.innerHTML = '<p>No pending compost collections.</p>';
            } else {
                donationsListEl.innerHTML = donations.map(d => `
                    <div class="list-item">
                        <div class="item-info"><p class="item-title">${d.description} (${d.quantity} kg)</p><p class="item-meta">From: ${d.donor.name}</p></div>
                    </div>`).join('');
            }
            if (sales.length === 0) {
                salesHistoryEl.innerHTML = '<p>No compost sales have been logged yet.</p>';
            } else {
                salesHistoryEl.innerHTML = sales.map(s => `
                    <div class="list-item">
                        <div class="item-info"><p class="item-title">${s.quantitySold} kg sold to ${s.buyerName}</p><p class="item-meta">Revenue: ₹${s.revenue} on ${new Date(s.saleDate).toLocaleDateString()}</p></div>
                    </div>`).join('');
            }
        } catch (error) {
            donationsListEl.innerHTML = `<p class="error">${error.message}</p>`;
            salesHistoryEl.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }
    
    // --- EVENT HANDLERS ---
    function handleUserListClick(event) {
        const button = event.target.closest('button[data-action="view-user"]');
        if (button) {
            openUserDetailsModalById(button.dataset.userId);
        }
    }

    function handleDonationListClick(event) {
        const button = event.target.closest('button[data-action="assign-donation"]');
        if (button) {
            openAssignTaskModalById(button.dataset.donationId);
        }
    }
    function handleTaskListClick(event) {
        const button = event.target.closest('button[data-action="view-qc-report"]');
        if (button) {
            openQcReportModal(button.dataset.taskId);
        }
    }
    
    // --- MODAL & ACTION LOGIC ---
    function openUserDetailsModalById(userId) {
        const userToDisplay = pendingUsersData.find(u => u._id === userId);
        if (userToDisplay) {
            document.getElementById('modalUserName').textContent = userToDisplay.name;
            document.getElementById('modalUserEmail').textContent = userToDisplay.email;
            document.getElementById('modalUserRole').textContent = userToDisplay.role;
            document.getElementById('modalUserStatus').textContent = userToDisplay.status;
            currentUserId = userToDisplay._id;
            userDetailsModal.classList.add('active');
        }
    }
    function openQcReportModal(taskId) {
        const task = allTasksData.find(t => t._id === taskId);
        if (task && task.qualityCheck) {
            document.getElementById('qc-food-quality').textContent = task.qualityCheck.foodQuality;
            document.getElementById('qc-packaging').textContent = task.qualityCheck.packaging;
            document.getElementById('qc-remarks').textContent = task.qualityCheck.remarks || 'No remarks provided.';
            qualityCheckReportModal.classList.add('active');
        }
    }
    
    function openAssignTaskModalById(donationId) {
        if (allVolunteers.length === 0 || allReceivers.length === 0) {
            alert('Cannot assign task. Please make sure there is at least one approved volunteer and one approved receiver in the system.');
            return;
        }
        const donation = pendingDonationsData.find(d => d._id === donationId);
        if (!donation) return;
        currentDonationId = donationId;
        document.getElementById('modalDonationDonor').textContent = donation.donor.name;
        document.getElementById('modalDonationDesc').textContent = `${donation.description} (${donation.quantity} kg)`;
        const volunteerSelect = document.getElementById('volunteerSelect');
        const receiverSelect = document.getElementById('receiverSelect');
        volunteerSelect.innerHTML = `<option value="" disabled selected>Select a volunteer...</option>` + allVolunteers.map(v => `<option value="${v._id}">${v.name}</option>`).join('');
        receiverSelect.innerHTML = `<option value="" disabled selected>Select a receiver...</option>` + allReceivers.map(r => `<option value="${r._id}">${r.name}</option>`).join('');
        assignTaskModal.classList.add('active');
    }

    async function handleApproveUser() {
        if (!currentUserId) return;
        try {
            const result = await apiCall(`/admin/users/${currentUserId}/approve`, 'POST');
            showNotification(result.message, 'success');
            userDetailsModal.classList.remove('active');
            loadAllData();
        } catch (error) { showNotification(error.message, 'error'); }
    }
    async function handleRequestListClick(event) {
        const button = event.target.closest('button');
        if (button && button.dataset.action === 'fulfill-request') {
            const requestId = button.dataset.requestId;
            if (confirm('Are you sure you want to mark this request as fulfilled?')) {
                try {
                    const result = await apiCall(`/admin/requests/${requestId}/fulfill`, 'POST');
                    showNotification(result.message, 'success');
                    fetchAndRenderOpenRequests(); // Refresh the list
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            }
        }
    }
    
    async function handleRejectUser() {
        if (!currentUserId) return;
        if (confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
            try {
                const result = await apiCall(`/admin/users/${currentUserId}/reject`, 'POST');
                showNotification(result.message, 'success');
                userDetailsModal.classList.remove('active');
                loadAllData();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    }

    async function handleAssignTask(event) {
        event.preventDefault();
        const volunteerId = document.getElementById('volunteerSelect').value;
        const receiverId = document.getElementById('receiverSelect').value;
        if (!currentDonationId || !volunteerId || !receiverId) {
            showNotification('Please select both a volunteer and a receiver.', 'error');
            return;
        }
        try {
            await apiCall('/admin/assign-task', 'POST', {
                donationId: currentDonationId,
                volunteerId,
                receiverId
            });
            showNotification('Task assigned successfully!', 'success');
            assignTaskModal.classList.remove('active');
            loadAllData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
    
    async function handleLogSale(event) {
        event.preventDefault();
        const buyerName = document.getElementById('buyerName').value;
        const quantitySold = document.getElementById('quantitySold').value;
        const revenue = document.getElementById('revenue').value;
        if (!buyerName || !quantitySold || !revenue) {
            showNotification('Please fill out all sale fields.', 'error');
            return;
        }
        try {
            await apiCall('/compost/sales', 'POST', {
                buyerName,
                quantitySold: Number(quantitySold),
                revenue: Number(revenue)
            });
            showNotification('Sale logged successfully!', 'success');
            logSaleForm.reset();
            fetchAndRenderCompostData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
    
    // --- EXTRA FEATURES ---
    function handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) activeModal.classList.remove('active');
        }
    }
    
    // --- API HELPER & NOTIFICATION ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Authorization': `Bearer ${token}` } };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'An API error occurred.');
        return data;
    }
    
    
    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = type;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
});