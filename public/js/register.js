// Registration functionality for ConstruxFlow

// Show worker type field only for workers
document.getElementById('role').addEventListener('change', (e) => {
    const workerTypeGroup = document.getElementById('workerTypeGroup');
    if (e.target.value === 'worker') {
        workerTypeGroup.style.display = 'block';
        document.getElementById('worker_type').required = true;
    } else {
        workerTypeGroup.style.display = 'none';
        document.getElementById('worker_type').required = false;
    }
});

// Pre-select role from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const roleParam = urlParams.get('role');
if (roleParam) {
    document.getElementById('role').value = roleParam;
    if (roleParam === 'worker') {
        document.getElementById('workerTypeGroup').style.display = 'block';
        document.getElementById('worker_type').required = true;
    }
}

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const role = document.getElementById('role').value;
    const worker_type = document.getElementById('worker_type').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                email, 
                password, 
                phone, 
                role, 
                worker_type 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Registration successful! Redirecting to login...</div>';
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="alert alert-error">Registration failed. Please try again.</div>';
    }
});
