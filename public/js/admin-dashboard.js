// Admin Dashboard functionality for ConstruxFlow

// Check authentication and load data
async function init() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success || data.user.role !== 'admin') {
            window.location.href = '/login';
            return;
        }
        
        loadStatistics();
        loadUsers();
        loadProjects();
        loadOrders();
    } catch (error) {
        window.location.href = '/login';
    }
}

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName + 'Tab').style.display = 'block';
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/statistics');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.statistics;
            const userCounts = {};
            stats.users.forEach(u => {
                userCounts[u.role] = u.count;
            });
            
            document.getElementById('statistics').innerHTML = `
                <div class="features-grid">
                    <div class="card">
                        <h3>Total Contractors</h3>
                        <p style="font-size: 2rem; color: #3498db;">${userCounts.contractor || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Total Workers</h3>
                        <p style="font-size: 2rem; color: #27ae60;">${userCounts.worker || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Total Suppliers</h3>
                        <p style="font-size: 2rem; color: #f39c12;">${userCounts.supplier || 0}</p>
                    </div>
                    <div class="card">
                        <h3>Total Projects</h3>
                        <p style="font-size: 2rem; color: #9b59b6;">${stats.totalProjects}</p>
                    </div>
                    <div class="card">
                        <h3>Total Orders</h3>
                        <p style="font-size: 2rem; color: #e74c3c;">${stats.totalOrders}</p>
                    </div>
                    <div class="card">
                        <h3>Total Applications</h3>
                        <p style="font-size: 2rem; color: #16a085;">${stats.totalApplications}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
            const usersTableBody = document.getElementById('usersTableBody');
            
            if (data.users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
                return;
            }
            
            usersTableBody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-${user.role === 'contractor' ? 'approved' : 'pending'}">${user.role}</span></td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${user.is_blocked ? '<span class="badge badge-rejected">Blocked</span>' : '<span class="badge badge-approved">Active</span>'}</td>
                    <td>
                        <button onclick="toggleBlock(${user.id}, ${user.is_blocked})" class="btn ${user.is_blocked ? 'btn-success' : 'btn-warning'}" style="font-size: 0.85rem; padding: 0.3rem 0.8rem;">
                            ${user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                        <button onclick="deleteUser(${user.id})" class="btn btn-danger" style="font-size: 0.85rem; padding: 0.3rem 0.8rem;">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Toggle block status
async function toggleBlock(userId, isBlocked) {
    const action = isBlocked ? 'unblock' : 'block';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ block: !isBlocked })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadUsers();
            loadStatistics();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error updating user status');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadUsers();
            loadStatistics();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error deleting user');
    }
}

// Load projects
async function loadProjects() {
    try {
        const response = await fetch('/api/admin/projects');
        const data = await response.json();
        
        if (data.success) {
            const projectsList = document.getElementById('projectsList');
            
            if (data.projects.length === 0) {
                projectsList.innerHTML = '<p>No projects found.</p>';
                return;
            }
            
            projectsList.innerHTML = data.projects.map(project => `
                <div class="card">
                    <h3>${project.project_name}</h3>
                    <p><strong>Contractor:</strong> ${project.contractor_name}</p>
                    <p><strong>Location:</strong> ${project.location}</p>
                    <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
                    <p><strong>Duration:</strong> ${new Date(project.start_date).toLocaleDateString()} - ${new Date(project.end_date).toLocaleDateString()}</p>
                    <p><strong>Required:</strong> ${project.required_labor} Labor, ${project.required_engineer} Engineers</p>
                    <p><strong>Created:</strong> ${new Date(project.created_at).toLocaleDateString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        const data = await response.json();
        
        if (data.success) {
            const ordersList = document.getElementById('ordersList');
            
            if (data.orders.length === 0) {
                ordersList.innerHTML = '<p>No orders found.</p>';
                return;
            }
            
            ordersList.innerHTML = data.orders.map(order => `
                <div class="card">
                    <h4>${order.material_name}</h4>
                    <p><strong>Project:</strong> ${order.project_name}</p>
                    <p><strong>Contractor:</strong> ${order.contractor_name}</p>
                    <p><strong>Supplier:</strong> ${order.supplier_name}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total Price:</strong> ₹${order.total_price}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
                    <p><strong>Ordered:</strong> ${new Date(order.ordered_at).toLocaleDateString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Logout
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Initialize on load
init();
