// Supplier Dashboard functionality for ConstruxFlow (UPDATED)

// Check authentication and load data
async function init() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success || data.user.role !== 'supplier') {
            window.location.href = '/login';
            return;
        }
        
        document.getElementById('userName').textContent = data.user.name;
        document.getElementById('profileName').textContent = data.user.name;
        document.getElementById('profileImage').textContent = data.user.name.charAt(0).toUpperCase();
        
        loadInventory();
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

// Load inventory
async function loadInventory() {
    try {
        const response = await fetch('/api/supplier/inventory');
        const data = await response.json();
        
        if (data.success) {
            const inventoryList = document.getElementById('inventoryList');
            
            if (data.inventory.length === 0) {
                inventoryList.innerHTML = '<p>No materials in inventory. Add your first material!</p>';
                return;
            }
            
            inventoryList.innerHTML = data.inventory.map(item => `
                <div class="card">
                    <h4>${item.material_name}</h4>
                    <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>
                    <p><strong>Price Per Unit:</strong> ₹${item.price_per_unit}</p>
                    <p><strong>Added:</strong> ${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// Add material (UPDATED - unit is now text input)
document.getElementById('addMaterialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const unit = document.getElementById('unit').value.trim();
    
    // Basic validation
    if (!unit) {
        document.getElementById('materialMessage').innerHTML = '<div class="alert alert-error">Please enter a unit</div>';
        return;
    }
    
    const formData = {
        material_name: document.getElementById('material_name').value,
        quantity: document.getElementById('quantity').value,
        unit: unit,
        price_per_unit: document.getElementById('price_per_unit').value
    };
    
    try {
        const response = await fetch('/api/supplier/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        const messageDiv = document.getElementById('materialMessage');
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Material added successfully!</div>';
            document.getElementById('addMaterialForm').reset();
            loadInventory();
            setTimeout(() => showTab('inventory'), 1500);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch (error) {
        document.getElementById('materialMessage').innerHTML = '<div class="alert alert-error">Error adding material</div>';
    }
});

// Load orders
async function loadOrders() {
    try {
        const response = await fetch('/api/supplier/orders');
        const data = await response.json();
        
        if (data.success) {
            const ordersList = document.getElementById('ordersList');
            
            if (data.orders.length === 0) {
                ordersList.innerHTML = '<p>No order requests yet.</p>';
                return;
            }
            
            ordersList.innerHTML = data.orders.map(order => `
                <div class="card">
                    <h4>${order.material_name}</h4>
                    <p><strong>Project:</strong> ${order.project_name}</p>
                    <p><strong>Contractor:</strong> ${order.contractor_name}</p>
                    <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
                    <p><strong>Total Price:</strong> ₹${order.total_price}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
                    ${order.status === 'approved' ? `<p><strong>Contractor Phone:</strong> ${order.contractor_phone || 'N/A'}</p>` : ''}
                    <p><strong>Ordered:</strong> ${new Date(order.ordered_at).toLocaleDateString()}</p>
                    ${order.status === 'pending' ? `
                        <button onclick="updateOrder(${order.id}, 'approve')" class="btn btn-success">Approve</button>
                        <button onclick="updateOrder(${order.id}, 'reject')" class="btn btn-danger">Reject</button>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Update order status
async function updateOrder(id, action) {
    const message = action === 'approve' ? 
        'Are you sure you want to approve this order? Inventory will be reduced.' :
        'Are you sure you want to reject this order?';
    
    if (!confirm(message)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/supplier/orders/${id}/${action}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Order ${action}d successfully!`);
            loadOrders();
            loadInventory();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error updating order');
    }
}

// Logout
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Initialize on load
init();
