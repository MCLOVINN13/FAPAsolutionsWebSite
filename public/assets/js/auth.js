// Auth Logic using Supabase

// Handle Registration
async function handleRegister(e) {
    if (e) e.preventDefault();
    
    // Clear previous errors
    const errorMsg = document.getElementById('registerError');
    const successMsg = document.getElementById('registerSuccess');
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullname = document.getElementById('fullname').value || email.split('@')[0];
    const age = document.getElementById('age') ? document.getElementById('age').value : null;

    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    fullname: fullname,
                    age: age
                }
            }
        });

        if (error) throw error;

        // 2. Insert into 'usuarios' table
        if (data.user) {
            const { error: dbError } = await supabase.from('usuarios').insert([
                {
                    id: data.user.id,
                    email: email,
                    fullname: fullname,
                    username: email.split('@')[0] + Math.floor(Math.random() * 1000), 
                }
            ]);
            
            if (dbError) {
                console.warn('DB Insert Warning:', dbError);
                // If it fails (e.g., RLS), we might still be OK if trigger exists or if we rely on auth metadata
            }
        }

        if (successMsg) {
            successMsg.textContent = 'Registro exitoso. ¡Bienvenido!';
            successMsg.style.display = 'block';
        }
        
        // Auto login or redirect
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (err) {
        console.error(err);
        if (errorMsg) {
            errorMsg.textContent = err.message || 'Error al registrarse';
            errorMsg.style.display = 'block';
        }
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Handle Login
async function handleLogin(e) {
    if (e) e.preventDefault();
    
    const errorMsg = document.getElementById('loginError');
    if (errorMsg) errorMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión...';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Fetch profile to get extended details (username, pictures)
        const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        const userData = {
            id: data.user.id,
            email: data.user.email,
            fullname: (profile && profile.fullname) ? profile.fullname : data.user.user_metadata.fullname,
            username: (profile && profile.username) ? profile.username : data.user.email.split('@')[0],
            profile_pic: (profile && profile.profile_pic) ? profile.profile_pic : null,
            cover_pic: (profile && profile.cover_pic) ? profile.cover_pic : null
        };

        localStorage.setItem('user', JSON.stringify(userData));
        window.location.href = 'index.html';

    } catch (err) {
        console.error(err);
        if (errorMsg) {
            errorMsg.textContent = 'Credenciales inválidas';
            errorMsg.style.display = 'block';
        }
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Global Logout
async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Check Login State & Update UI
function checkLoginState() {
    const userStr = localStorage.getItem('user');
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-info');

    if (userStr) {
        const user = JSON.parse(userStr);
        if (authButtons) authButtons.style.display = 'none';
        
        if (userMenu) {
            userMenu.innerHTML = `
                <div class="user-avatar">
                   ${user.profile_pic ? `<img src="${user.profile_pic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                   `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>`}
                </div>
                <div class="user-details">
                    <h4>${user.fullname || 'Usuario'}</h4>
                    <p>${user.email}</p>
                </div>
            `;
            
            const dropdown = document.querySelector('.dropdown-menu ul');
            if (dropdown && !document.getElementById('logout-link')) {
                const li = document.createElement('li');
                li.id = 'logout-link';
                li.innerHTML = '<a href="#" onclick="logout(); return false;" style="color: #ff6b6b;">Cerrar Sesión</a>';
                dropdown.appendChild(li);
            }
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.innerHTML = `
            <div class="user-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg></div>
            <div class="user-details"><h4>Invitado</h4><p>Bienvenido</p></div>
        `;
    }
}

// Initial Listener
document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
});
