// Profile Management JavaScript for ConstruxFlow

let currentUser = null;

// Initialize profile page
async function init() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = '/login';
            return;
        }
        
        currentUser = data.user;
        loadProfile();
    } catch (error) {
        window.location.href = '/login';
    }
}

// Load user profile data
async function loadProfile() {
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            // Update profile header
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileRole').textContent = capitalizeRole(user.role);
            document.getElementById('profileInitial').textContent = user.name.charAt(0).toUpperCase();
            
            // Update profile image if exists
            if (user.profile_image && user.profile_image !== 'default-avatar.png') {
                document.getElementById('profileImageContainer').innerHTML = 
                    `<img src="${user.profile_image}" alt="Profile Image">`;
            }
            
            // Fill form fields
            document.getElementById('name').value = user.name;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone || '';
            
            // Display account information
            document.getElementById('displayRole').textContent = capitalizeRole(user.role);
            document.getElementById('displayRegistrationDate').textContent = 
                new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            document.getElementById('displayAccountStatus').textContent = 
                user.is_blocked ? 'Blocked' : 'Active';
            
            // Show worker type if applicable
            if (user.role === 'worker' && user.worker_type) {
                document.getElementById('workerTypeDisplay').style.display = 'block';
                document.getElementById('displayWorkerType').textContent = user.worker_type;
            }
        }
    } catch (error) {
        showMessage('Error loading profile', 'error');
    }
}

// Update basic information
document.getElementById('basicInfoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };
    
    try {
        const response = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Profile updated successfully!', 'success');
            loadProfile();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error updating profile', 'error');
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/profile/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Password changed successfully!', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error changing password', 'error');
    }
});

// Upload profile image
async function uploadProfileImage() {
    const fileInput = document.getElementById('profileImageInput');
    const file = fileInput.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        showMessage('Only JPG and PNG images are allowed', 'error');
        fileInput.value = '';
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size must be less than 5MB', 'error');
        fileInput.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
        const response = await fetch('/api/profile/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Profile image updated successfully!', 'success');
            // Update image preview
            document.getElementById('profileImageContainer').innerHTML = 
                `<img src="${data.imageUrl}?t=${Date.now()}" alt="Profile Image">`;
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error uploading image', 'error');
    }
    
    fileInput.value = '';
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('messageDiv');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    messageDiv.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Helper function to capitalize role
function capitalizeRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
}

// Go back to dashboard
function goToDashboard() {
    if (currentUser) {
        switch(currentUser.role) {
            case 'contractor':
                window.location.href = '/contractor-dashboard';
                break;
            case 'worker':
                window.location.href = '/worker-dashboard';
                break;
            case 'supplier':
                window.location.href = '/supplier-dashboard';
                break;
            case 'admin':
                window.location.href = '/admin-dashboard';
                break;
            default:
                window.location.href = '/';
        }
    }
}

// Logout
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Initialize on page load
init();
