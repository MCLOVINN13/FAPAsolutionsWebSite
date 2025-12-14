// Ensure functions are available globally or properly hoisted
document.addEventListener('DOMContentLoaded', () => {
    // DEBUG: Verify script load
    console.log('Profile JS loaded');
    // alert('Profile JS loaded'); // Uncomment if console is hard to reach, but let's try console first or just trust the logic update.
    // User said they see nothing. I will use alerts because I can't see their console.
    
    checkLoginState();
    loadProfile();
    loadDevices(); 

    // Tab Navigation
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
             document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
             document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
             tab.classList.add('active');
             const panelId = tab.getAttribute('aria-controls');
             document.getElementById(panelId).classList.add('active');
             if (panelId === 'tab-history-panel') loadHistory();
        });
    });

    // Edit Profile Form
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Image Uploads
    const avatarInput = document.getElementById('avatarImageInput');
    const coverInput = document.getElementById('coverImageInput');
    const avatarBtn = document.querySelector('.edit-avatar-btn');
    const coverBtn = document.querySelector('.edit-cover-btn');

    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            console.log('Avatar btn clicked');
            avatarInput.click();
        });
    } else {
        console.error('Avatar button not found');
    }

    if (coverBtn) {
        coverBtn.addEventListener('click', () => {
             coverInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            console.log('File selected');
            if (e.target.files.length > 0) {
                startCropper(e.target.files[0], 'avatar');
            }
        });
    }

    if (coverInput) {
        coverInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                startCropper(e.target.files[0], 'cover');
            }
        });
    }
    
    // Cropper Modal Events
    const cancelBtn = document.getElementById('cancelCropBtn');
    const saveBtn = document.getElementById('cropImageBtn');
    
    if (cancelBtn) cancelBtn.addEventListener('click', closeCropper);
    if (saveBtn) saveBtn.addEventListener('click', saveCroppedImage);
});

let cropper;
let currentFileType = null; // 'avatar' or 'cover'

function startCropper(file, type) {
    if (!file) return;
    
    // DEBUG: Check if Cropper is loaded
    if (typeof Cropper === 'undefined') {
        alert('Error: Librería CropperJS no cargada. Por favor recarga la página.');
        return;
    }

    currentFileType = type;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const image = document.getElementById('imageToCrop');
        image.src = e.target.result;
        
        const modal = document.getElementById('cropperModal');
        if (!modal) {
             alert('Error: No se encontró el modal de recorte.');
             return;
        }
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Destroy previous instance if exists
        if (cropper) {
            cropper.destroy();
        }
        
        // Initialize Cropper
        cropper = new Cropper(image, {
            aspectRatio: type === 'avatar' ? 1 : 16 / 9,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
        
        // Reset input value so same file can be selected again if cancelled
        if (type === 'avatar') document.getElementById('avatarImageInput').value = '';
        else document.getElementById('coverImageInput').value = '';
    };
    
    reader.readAsDataURL(file);
}

function closeCropper() {
    const modal = document.getElementById('cropperModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function saveCroppedImage() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: currentFileType === 'avatar' ? 400 : 1200, // Reasonable max dimensions
        height: currentFileType === 'avatar' ? 400 : 675,
    });
    
    canvas.toBlob((blob) => {
        handleImageUpload(blob, currentFileType);
        closeCropper();
    }, 'image/jpeg', 0.9);
}
async function loadDevices() {
    // Placeholder for devices tab logic
    console.log('Loading devices...');
}

// ... existing code ...

async function loadProfile() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const userTmp = JSON.parse(userStr);
    
    // Init Realtime
    initRealtimeQuotes(userTmp.id);

    try {
        const response = await fetch(`/api/profile?id=${userTmp.id}`);
        
        if (!response.ok) {
            console.error('API Error:', response.status);
            if (response.status === 404) alert('Usuario no encontrado en base de datos. Por favor relogueate.');
            return;
        }

        const user = await response.json();

        // Update UI
        document.querySelector('.profile-display-name').textContent = user.fullname || user.username;
        document.querySelector('.profile-username').textContent = '@' + user.username;
        document.getElementById('locationText').textContent = user.location || 'Ubicación no definida';
        
        if (user.fecha_registro) {
                const date = new Date(user.fecha_registro);
                const options = { year: 'numeric', month: 'short' };
                document.getElementById('joinDateText').textContent = 'Miembro desde ' + date.toLocaleDateString('es-ES', options);
        }

        // Inputs
        document.getElementById('profile-name').value = user.fullname || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-location').value = user.location || '';
        
        // Images
        if (user.profile_pic) {
            document.getElementById('avatarImage').src = user.profile_pic;
        }
        if (user.cover_pic) {
            document.getElementById('profileCover').style.backgroundImage = `url('${user.cover_pic}')`;
            document.getElementById('profileCover').style.backgroundSize = 'cover';
            document.getElementById('profileCover').style.backgroundPosition = 'center';
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    
    const fullname = document.getElementById('profile-name').value;
    const location = document.getElementById('profile-location').value;
    const password = document.getElementById('new-password').value;
    
    // Optional: Username update if we add that field to form
    const username = user.username; // keep same for now unless UI has field

    const payload = {
        id: user.id,
        fullname,
        location,
        username,
        password // backend handles hashing if not empty
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            alert('Perfil actualizado');
            loadProfile(); // Refresh
        } else {
            alert('Error al actualizar');
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleImageUpload(file, type) {
    if (!file) return;
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    const formData = new FormData();
    formData.append('userId', user.id);
    // Append file with filename (needed for multer)
    formData.append(type, file, `${type}-${Date.now()}.jpg`);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            loadProfile(); // Refresh images
        } else {
            alert('Error al subir imagen');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadHistory() {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const container = document.getElementById('tab-history-panel');
    
    try {
        const response = await fetch(`/api/user/quotes?id=${user.id}`);
        const quotes = await response.json();
        
        container.innerHTML = '<div class="panel-header"><h2>Historial de Servicios</h2></div>';

        if (quotes.length === 0) {
            container.innerHTML += `
                <div class="empty-state" style="text-align:center; padding: 40px;">
                    <p>No se ha realizado ninguna cotización aún.</p>
                    <a href="cotizar.html" class="btn btn-primary" style="margin-top:20px; display:inline-block; background: var(--primary); color:#000; padding: 10px 20px; border-radius:5px; text-decoration:none; font-weight:bold;">Realizar Cotización</a>
                </div>
            `;
            return;
        }

        const list = document.createElement('div');
        list.className = 'history-list';
        list.style.display = 'grid';
        list.style.gap = '20px';

        quotes.forEach(q => {
            const date = new Date(q.created_at).toLocaleDateString();
            const item = document.createElement('article');
            item.className = 'device-card'; // Reuse style
            item.innerHTML = `
                <div class="device-details" style="margin-left:0;">
                    <h3 style="color:#fff;">${q.device_model}</h3>
                    <p style="color:#aaa;">${q.problem_description}</p>
                    <p style="color:#aaa; font-size:0.9rem; margin-top:5px;">Fecha: ${date}</p>
                </div>
                <div class="device-status">
                    <span style="background:var(--primary); color:#000; padding:2px 10px; border-radius:10px; font-size:0.8rem; font-weight:bold;">${q.status}</span>
                </div>
            `;
            list.appendChild(item);
        });
        container.appendChild(list);

    } catch (err) {
        console.error(err);
    }
}
