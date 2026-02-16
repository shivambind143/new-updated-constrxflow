// Contractor Dashboard functionality for ConstruxFlow (UPDATED)

let currentMaterial = null;

// Check authentication and load data
async function init() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success || data.user.role !== 'contractor') {
            window.location.href = '/login';
            return;
        }
        
        document.getElementById('userName').textContent = data.user.name;
        document.getElementById('profileName').textContent = data.user.name;
        document.getElementById('profileImage').textContent = data.user.name.charAt(0).toUpperCase();
        
        loadProjects();
        loadApplications();
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

// Add manpower row dynamically
function addManpowerRow() {
    const container = document.getElementById('manpowerContainer');
    const newRow = document.createElement('div');
    newRow.className = 'manpower-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    newRow.innerHTML = `
        <div>
            <input type="text" class="role-name" placeholder="e.g., Mason, Electrician, Labour" required>
        </div>
        <div>
            <input type="number" class="required-count" min="1" placeholder="Count" required>
        </div>
        <div>
            <input type="number" class="payment-per-day" step="0.01" placeholder="₹">
        </div>
        <div>
            <button type="button" onclick="removeManpowerRow(this)" class="btn btn-danger" style="padding: 0.5rem 1rem;">Remove</button>
        </div>
    `;
    container.appendChild(newRow);
}

// Remove manpower row
function removeManpowerRow(button) {
    const container = document.getElementById('manpowerContainer');
    if (container.children.length > 1) {
        button.closest('.manpower-row').remove();
    } else {
        alert('At least one manpower requirement is needed');
    }
}

// Load projects (UPDATED to show manpower)
async function loadProjects() {
    try {
        const response = await fetch('/api/contractor/projects');
        const data = await response.json();
        
        if (data.success) {
            const projectsList = document.getElementById('projectsList');
            
            if (data.projects.length === 0) {
                projectsList.innerHTML = '<p>No projects yet. Create your first project!</p>';
                return;
            }
            
            projectsList.innerHTML = data.projects.map(project => {
                const manpowerHTML = project.manpower_requirements && project.manpower_requirements.length > 0 
                    ? `<div style="margin-top: 1rem;">
                        <strong>Manpower Requirements:</strong>
                        <table style="width: 100%; margin-top: 0.5rem; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 0.5rem; text-align: left;">Role</th>
                                    <th style="padding: 0.5rem; text-align: center;">Required</th>
                                    <th style="padding: 0.5rem; text-align: right;">Payment/Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${project.manpower_requirements.map(m => `
                                    <tr>
                                        <td style="padding: 0.5rem;">${m.role_name}</td>
                                        <td style="padding: 0.5rem; text-align: center;">
                                            ${m.required_count > 0 
                                                ? `<span class="badge badge-warning">${m.required_count} needed</span>` 
                                                : `<span class="badge badge-approved">Filled</span>`}
                                        </td>
                                        <td style="padding: 0.5rem; text-align: right;">
                                            ${m.payment_per_day ? `₹${m.payment_per_day}` : 'N/A'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                       </div>`
                    : '<p>No manpower requirements</p>';

                return `
                    <div class="card">
                        <h3>${project.project_name}</h3>
                        <p><strong>Location:</strong> ${project.location}</p>
                        <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
                        <p><strong>Duration:</strong> ${new Date(project.start_date).toLocaleDateString()} - ${new Date(project.end_date).toLocaleDateString()}</p>
                        ${manpowerHTML}
                        <p style="margin-top: 1rem;"><strong>Workers Hired:</strong> ${project.workers_count}</p>
                        <p><strong>Materials Ordered:</strong> ${project.materials_ordered}</p>
                    </div>
                `;
            }).join('');
            
            // Populate project dropdown for orders
            const orderProject = document.getElementById('orderProject');
            orderProject.innerHTML = '<option value="">Select Project</option>' + 
                data.projects.map(p => `<option value="${p.id}">${p.project_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Add new project (UPDATED to handle manpower)
document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect manpower requirements
    const manpowerRows = document.querySelectorAll('.manpower-row');
    const manpower_requirements = [];
    
    for (let row of manpowerRows) {
        const role_name = row.querySelector('.role-name').value.trim();
        const required_count = row.querySelector('.required-count').value;
        const payment_per_day = row.querySelector('.payment-per-day').value;
        
        if (role_name && required_count) {
            manpower_requirements.push({
                role_name,
                required_count: parseInt(required_count),
                payment_per_day: payment_per_day ? parseFloat(payment_per_day) : null
            });
        }
    }
    
    if (manpower_requirements.length === 0) {
        alert('Please add at least one manpower requirement');
        return;
    }
    
    const formData = {
        project_name: document.getElementById('project_name').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        start_date: document.getElementById('start_date').value,
        end_date: document.getElementById('end_date').value,
        manpower_requirements
    };
    
    try {
        const response = await fetch('/api/contractor/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        const messageDiv = document.getElementById('projectMessage');
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Project created successfully!</div>';
            document.getElementById('addProjectForm').reset();
            
            // Reset manpower container to one row
            const container = document.getElementById('manpowerContainer');
            container.innerHTML = `
                <div class="manpower-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;">
                    <div>
                        <label style="font-size: 0.9rem;">Role Name</label>
                        <input type="text" class="role-name" placeholder="e.g., Mason, Electrician, Labour" required>
                    </div>
                    <div>
                        <label style="font-size: 0.9rem;">Required Count</label>
                        <input type="number" class="required-count" min="1" placeholder="Count" required>
                    </div>
                    <div>
                        <label style="font-size: 0.9rem;">Payment/Day (Optional)</label>
                        <input type="number" class="payment-per-day" step="0.01" placeholder="₹">
                    </div>
                    <div>
                        <button type="button" onclick="removeManpowerRow(this)" class="btn btn-danger" style="padding: 0.5rem 1rem; margin-top: 1.5rem;">Remove</button>
                    </div>
                </div>
            `;
            
            loadProjects();
            setTimeout(() => showTab('projects'), 1500);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch (error) {
        document.getElementById('projectMessage').innerHTML = '<div class="alert alert-error">Error creating project</div>';
    }
});

// Load applications
async function loadApplications() {
    try {
        const response = await fetch('/api/contractor/applications');
        const data = await response.json();
        
        if (data.success) {
            const applicationsList = document.getElementById('applicationsList');
            
            if (data.applications.length === 0) {
                applicationsList.innerHTML = '<p>No applications yet.</p>';
                return;
            }
            
            applicationsList.innerHTML = data.applications.map(app => `
                <div class="card">
                    <h4>${app.worker_name}</h4>
                    <p><strong>Project:</strong> ${app.project_name}</p>
                    <p><strong>Worker Type:</strong> ${app.worker_type || 'N/A'}</p>
                    <p><strong>Applied:</strong> ${new Date(app.applied_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${app.status}">${app.status}</span></p>
                    ${app.status === 'approved' ? `<p><strong>Phone:</strong> ${app.phone || 'N/A'}</p>` : ''}
                    ${app.status === 'pending' ? `
                        <button onclick="updateApplication(${app.id}, 'approve')" class="btn btn-success">Approve</button>
                        <button onclick="updateApplication(${app.id}, 'reject')" class="btn btn-danger">Reject</button>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Update application status
async function updateApplication(id, action) {
    try {
        const response = await fetch(`/api/contractor/applications/${id}/${action}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadApplications();
            loadProjects(); // Reload to update vacancy counts
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error updating application');
    }
}

// Search materials
async function searchMaterials() {
    const searchTerm = document.getElementById('materialSearch').value;
    
    try {
        const response = await fetch(`/api/contractor/materials/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            const materialsList = document.getElementById('materialsList');
            
            if (data.materials.length === 0) {
                materialsList.innerHTML = '<p>No materials found.</p>';
                return;
            }
            
            materialsList.innerHTML = data.materials.map(material => `
                <div class="card">
                    <h4>${material.material_name}</h4>
                    <p><strong>Supplier:</strong> ${material.supplier_name}</p>
                    <p><strong>Price:</strong> ₹${material.price_per_unit} per ${material.unit}</p>
                    <p><strong>Available Quantity:</strong> ${material.quantity} ${material.unit}</p>
                    <button onclick="openOrderModal(${material.id}, '${material.material_name}', ${material.price_per_unit}, '${material.unit}')" class="btn btn-primary">Order</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error searching materials:', error);
    }
}

// Open order modal
function openOrderModal(materialId, name, price, unit) {
    currentMaterial = { id: materialId, name, price, unit };
    document.getElementById('orderModal').style.display = 'block';
    document.getElementById('orderDetails').innerHTML = `
        <p><strong>Material:</strong> ${name}</p>
        <p><strong>Price:</strong> ₹${price} per ${unit}</p>
    `;
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentMaterial = null;
}

// Confirm order
async function confirmOrder() {
    const projectId = document.getElementById('orderProject').value;
    const quantity = document.getElementById('orderQuantity').value;
    
    if (!projectId || !quantity) {
        alert('Please select project and enter quantity');
        return;
    }
    
    try {
        const response = await fetch('/api/contractor/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                material_id: currentMaterial.id,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Order placed successfully!');
            closeOrderModal();
            loadOrders();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error placing order');
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await fetch('/api/contractor/orders');
        const data = await response.json();
        
        if (data.success) {
            const ordersList = document.getElementById('ordersList');
            
            if (data.orders.length === 0) {
                ordersList.innerHTML = '<p>No orders yet.</p>';
                return;
            }
            
            ordersList.innerHTML = data.orders.map(order => `
                <div class="card">
                    <h4>${order.material_name}</h4>
                    <p><strong>Project:</strong> ${order.project_name}</p>
                    <p><strong>Supplier:</strong> ${order.supplier_name}</p>
                    <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
                    <p><strong>Total Price:</strong> ₹${order.total_price}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
                    ${order.status === 'approved' ? `<p><strong>Supplier Phone:</strong> ${order.supplier_phone || 'N/A'}</p>` : ''}
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
