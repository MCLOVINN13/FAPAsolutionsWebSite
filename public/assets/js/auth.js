document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();

    // Determine if we are on login or register page
    const loginForm = document.querySelector('form'); // The form in login.html/register.html
    const isRegister = window.location.pathname.includes('register.html');
    
    // Only attach submit listener if we are on auth pages and form exists
    if (loginForm && (window.location.pathname.includes('login.html') || isRegister)) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Procesando...';
            btn.disabled = true;

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            let age = null;
            
            if (isRegister) {
                const ageInput = document.getElementById('age');
                if (ageInput) age = ageInput.value;
            }

            const endpoint = isRegister ? '/api/register' : '/api/login';
            const payload = isRegister ? { email, password, age } : { email, password };

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    if (isRegister) {
                        alert('Registro exitoso. Ahora puedes iniciar sesión.');
                        window.location.href = 'login.html';
                    } else {
                        // Login successful
                        localStorage.setItem('user', JSON.stringify(result.user));
                        window.location.href = 'index.html';
                    }
                } else {
                    alert(result.error || 'Ocurrió un error');
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});

function checkLoginState() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const username = user.email.split('@')[0];

    // --- Header / Dropdown Updates ---
    const authButtons = document.querySelector('.auth-buttons');
    const userInfoName = document.querySelector('.user-info h4');
    const userInfoWelcome = document.querySelector('.user-info p');
    
    if (authButtons) authButtons.style.display = 'none';
    
    if (userInfoName) userInfoName.textContent = username;
    if (userInfoWelcome) userInfoWelcome.textContent = user.email;

    // Add Logout Button to Dropdown if not exists
    const menuList = document.querySelector('.dropdown-menu ul');
    if (menuList && !document.getElementById('logoutLink')) {
        const li = document.createElement('li');
        li.innerHTML = '<a href="#" id="logoutLink" style="color: #ff6b6b; font-weight: bold;">Cerrar Sesión</a>';
        menuList.appendChild(li);
        
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // --- Profile Page Updates ---
    if (window.location.pathname.includes('userprofile.html')) {
        loadProfileData(user, username);
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function loadProfileData(user, username) {
    // Header section
    const displayNames = document.querySelectorAll('.profile-display-name');
    const displayUsernames = document.querySelectorAll('.profile-username');
    
    displayNames.forEach(el => el.textContent = username);
    displayUsernames.forEach(el => el.textContent = '@' + username);

    // Form inputs
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    
    if (nameInput) nameInput.value = username;
    if (emailInput) emailInput.value = user.email;
    
    // Join date (if we had it in localStorage, we could set it too)
    // For now we just set name/email
}
