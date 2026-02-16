// Worker Dashboard functionality for ConstruxFlow (UPDATED)

// Check authentication and load data
async function init() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success || data.user.role !== 'worker') {
            window.location.href = '/login';
            return;
        }
        
        document.getElementById('userName').textContent = data.user.name;
        document.getElementById('profileImage').textContent = data.user.name.charAt(0).toUpperCase();
        
        // Load profile
        loadProfile();
        loadJobs();
        loadApplications();
        loadActiveJobs();
    } catch (error) {
        window.location.href = '/login';
    }
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch('/api/worker/profile');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('profileInfo').innerHTML = `
                <div>
                    <strong>${data.user.name}</strong><br>
                    <small>${data.user.worker_type || 'Worker'}</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName + 'Tab').style.display = 'block';
}

// Load available jobs (UPDATED to show role-specific jobs)
async function loadJobs() {
    try {
        const response = await fetch('/api/worker/jobs');
        const data = await response.json();
        
        if (data.success) {
            const jobsList = document.getElementById('jobsList');
            
            if (data.jobs.length === 0) {
                jobsList.innerHTML = '<p>No jobs available for your role at the moment. Jobs are shown based on your worker type.</p>';
                return;
            }
            
            jobsList.innerHTML = data.jobs.map(job => `
                <div class="card">
                    <h3>${job.project_name}</h3>
                    <p><strong>Contractor:</strong> ${job.contractor_name}</p>
                    <p><strong>Location:</strong> ${job.location}</p>
                    <p><strong>Description:</strong> ${job.description || 'N/A'}</p>
                    <p><strong>Duration:</strong> ${new Date(job.start_date).toLocaleDateString()} - ${new Date(job.end_date).toLocaleDateString()}</p>
                    <p><strong>Role:</strong> <span class="badge badge-approved">${job.role_name}</span></p>
                    <p><strong>Vacancies:</strong> <span class="badge badge-warning">${job.required_count} positions</span></p>
                    ${job.payment_per_day ? `<p><strong>Payment:</strong> ₹${job.payment_per_day}/day</p>` : ''}
                    ${job.already_applied > 0 ? 
                        '<button class="btn" disabled style="background: #95a5a6; color: white;">Already Applied</button>' :
                        `<button onclick="applyToJob(${job.id})" class="btn btn-success">Apply Now</button>`
                    }
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Apply to job
async function applyToJob(projectId) {
    if (!confirm('Are you sure you want to apply to this project?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/worker/apply/${projectId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Application submitted successfully!');
            loadJobs();
            loadApplications();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error submitting application');
    }
}

// Load applications
async function loadApplications() {
    try {
        const response = await fetch('/api/worker/applications');
        const data = await response.json();
        
        if (data.success) {
            const applicationsList = document.getElementById('applicationsList');
            
            if (data.applications.length === 0) {
                applicationsList.innerHTML = '<p>You have not applied to any jobs yet.</p>';
                return;
            }
            
            applicationsList.innerHTML = data.applications.map(app => `
                <div class="card">
                    <h4>${app.project_name}</h4>
                    <p><strong>Contractor:</strong> ${app.contractor_name}</p>
                    <p><strong>Location:</strong> ${app.location}</p>
                    <p><strong>Duration:</strong> ${new Date(app.start_date).toLocaleDateString()} - ${new Date(app.end_date).toLocaleDateString()}</p>
                    <p><strong>Applied On:</strong> ${new Date(app.applied_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${app.status}">${app.status}</span></p>
                    ${app.status === 'approved' ? `<p><strong>Contractor Phone:</strong> ${app.contractor_phone || 'N/A'}</p>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Load active jobs
async function loadActiveJobs() {
    try {
        const response = await fetch('/api/worker/active-jobs');
        const data = await response.json();
        
        if (data.success) {
            const activeJobsList = document.getElementById('activeJobsList');
            
            if (data.jobs.length === 0) {
                activeJobsList.innerHTML = '<p>No active jobs at the moment.</p>';
                return;
            }
            
            activeJobsList.innerHTML = data.jobs.map(job => `
                <div class="card">
                    <h4>${job.project_name}</h4>
                    <p><strong>Contractor:</strong> ${job.contractor_name}</p>
                    <p><strong>Phone:</strong> ${job.contractor_phone || 'N/A'}</p>
                    <p><strong>Location:</strong> ${job.location}</p>
                    <p><strong>Description:</strong> ${job.description || 'N/A'}</p>
                    <p><strong>Duration:</strong> ${new Date(job.start_date).toLocaleDateString()} - ${new Date(job.end_date).toLocaleDateString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading active jobs:', error);
    }
}

// Logout
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Initialize on load
init();
