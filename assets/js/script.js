document.addEventListener('DOMContentLoaded', () => {
    //    LOGICA GLOBAL (TODAS LAS PAGINAS )
    
    // --- 1.1. Selección de Elementos Globales ---
    const header = document.getElementById('mainHeader');
    const profileToggle = document.getElementById('profileToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('searchInput');
    const logo = document.querySelector('.logo');

    // --- 1.2. Lógica del Header (Scroll, Dropdown, Búsqueda, Logo Fade) ---
    if (header) {
        // Efecto de scroll para el header
        let isTicking = false;
        window.addEventListener('scroll', () => {
            if (!isTicking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                    isTicking = false;
                });
                isTicking = true;
            }
        });
    }

    if (profileToggle && dropdownMenu) {
        // Lógica para abrir/cerrar el menú desplegable
        profileToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isExpanded = dropdownMenu.classList.toggle('active');
            profileToggle.setAttribute('aria-expanded', isExpanded);
        });

        // Cierra el menú si se hace clic fuera de él
        window.addEventListener('click', () => {
            if (dropdownMenu.classList.contains('active')) {
                dropdownMenu.classList.remove('active');
                profileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Evita que el menú se cierre al hacer clic dentro de él
        dropdownMenu.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    if (searchContainer && searchInput) {
        // Lógica para la búsqueda expandible
        searchContainer.addEventListener('click', () => {
            searchInput.focus();
        });

        // Lógica para atenuar el logo cuando la búsqueda está activa
        if (logo) {
            searchContainer.addEventListener('mouseenter', () => logo.classList.add('fade-out'));
            searchContainer.addEventListener('focusin', () => logo.classList.add('fade-out'));
            searchContainer.addEventListener('mouseleave', () => logo.classList.remove('fade-out'));
            searchContainer.addEventListener('focusout', () => logo.classList.remove('fade-out'));
        }
    }


    // =======================================================
    // ===== BLOQUE 2: LÓGICA DE LA PÁGINA DE INICIO (index.html) ====
    // =======================================================
    const heroSection = document.getElementById('heroSection');
    if (heroSection) {
        const heroContent = document.querySelector('.hero-content');
        const ctaButton = document.getElementById('ctaButton');

        // Lógica del parallax y aurora del banner
        if (heroContent) {
            const maxRotation = 6;
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY, currentTarget } = e;
                const { clientWidth, clientHeight } = currentTarget;
                const xPos = (clientX / clientWidth) * 2 - 1;
                const yPos = (clientY / clientHeight) * 2 - 1;
                const rotateY = xPos * maxRotation;
                const rotateX = -yPos * maxRotation;
                heroContent.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                heroSection.style.setProperty('--mouse-x', `${clientX}px`);
                heroSection.style.setProperty('--mouse-y', `${clientY}px`);
            });
            heroSection.addEventListener('mouseleave', () => {
                heroContent.style.transform = 'rotateY(0deg) rotateX(0deg)';
            });
        }

        // Lógica del efecto ripple en el botón del banner
        if (ctaButton) {
            ctaButton.addEventListener('click', function(e) {
                heroSection.classList.add('pulse');
                setTimeout(() => heroSection.classList.remove('pulse'), 500);
                const rect = ctaButton.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        }
    }


    // =======================================================
    // ==== BLOQUE 3: LÓGICA DE LA PÁGINA DE PERFIL (userprofile.html) ===
    // =======================================================
    const profilePage = document.querySelector('.profile-page');
    if (profilePage) {

        // --- 3.1. Simulación y Carga de Datos del Usuario ---
        const mockUserData = {
            displayName: "Pablo Soluciones",
            username: "@pablotech",
            location: "Jesús María, Ags.",
            createdAt: "2024-01-15T10:00:00.000Z"
        };

        function populateProfileData(userData) {
            const displayNameElement = document.querySelector('.profile-display-name');
            const usernameElement = document.querySelector('.profile-username');
            const locationTextElement = document.getElementById('locationText');
            const joinDateTextElement = document.getElementById('joinDateText');

            if (displayNameElement) displayNameElement.textContent = userData.displayName;
            if (usernameElement) usernameElement.textContent = userData.username;
            if (locationTextElement) locationTextElement.textContent = userData.location;
            
            if (joinDateTextElement && userData.createdAt) {
                const joinDate = new Date(userData.createdAt);
                const formattedDate = joinDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
                joinDateTextElement.textContent = `Miembro desde ${formattedDate}`;
            }
        }

        // --- 3.2. Lógica del Sistema de Pestañas (Tabs) ---
        function handleTabs() {
            const tabButtons = document.querySelectorAll('.profile-tab');
            const tabPanels = document.querySelectorAll('.tab-panel');
            if (tabButtons.length === 0) return;

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-selected', 'false');
                    });
                    tabPanels.forEach(panel => {
                        panel.classList.remove('active');
                    });
                    button.classList.add('active');
                    button.setAttribute('aria-selected', 'true');
                    const panelId = button.getAttribute('aria-controls');
                    const correspondingPanel = document.getElementById(panelId);
                    if (correspondingPanel) {
                        correspondingPanel.classList.add('active');
                    }
                });
            });
        }

        // --- 3.3. Lógica para Vista Previa de Imágenes ---
        function handleImagePreviews() {
            function setupImagePreview(buttonSelector, inputId, elementId) {
                const editButton = document.querySelector(buttonSelector);
                const fileInput = document.getElementById(inputId);
                const element = document.getElementById(elementId);
                if (!editButton || !fileInput || !element) return;

                editButton.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (element.tagName === 'IMG') {
                                element.src = e.target.result;
                            } else {
                                element.style.backgroundImage = `url('${e.target.result}')`;
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            setupImagePreview('.edit-avatar-btn', 'avatarImageInput', 'avatarImage');
            setupImagePreview('.edit-cover-btn', 'coverImageInput', 'profileCover'); // Corregido el ID
        }

        // --- 3.4. Ejecución de las funciones del Perfil ---
        populateProfileData(mockUserData);
        handleTabs();
        handleImagePreviews();
    }

});