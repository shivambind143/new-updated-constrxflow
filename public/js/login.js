// Login functionality for ConstruxFlow

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
            
            // Redirect based on role
            setTimeout(() => {
                if (data.role === 'contractor') {
                    window.location.href = '/contractor-dashboard';
                } else if (data.role === 'worker') {
                    window.location.href = '/worker-dashboard';
                } else if (data.role === 'supplier') {
                    window.location.href = '/supplier-dashboard';
                } else if (data.role === 'admin') {
                    window.location.href = '/admin-dashboard';
                }
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="alert alert-error">Login failed. Please try again.</div>';
    }
});
