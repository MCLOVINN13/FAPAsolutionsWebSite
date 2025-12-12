document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in (optional for quotes, but good for UX)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user) {
        // Pre-fill fields if possible
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        if (nameInput && user.fullname) nameInput.value = user.fullname;
        if (emailInput && user.email) emailInput.value = user.email;
    }

    // Custom Select Logic (for device type)
    setupCustomSelects();

    // File Upload Logic
    const fileInput = document.getElementById('images');
    const fileLabel = document.querySelector('.file-upload-label');
    const fileText = document.getElementById('file-chosen-text');

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileText.textContent = `${this.files.length} archivo(s) seleccionado(s)`;
                fileLabel.classList.add('btn-primary');
                fileLabel.classList.remove('btn-outline');
            } else {
                fileText.textContent = "No se han seleccionado archivos.";
                fileLabel.classList.remove('btn-primary');
                fileLabel.classList.add('btn-outline');
            }
        });
    }

    // Form Submission
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const formData = new FormData();
            
            // Basic fields
            formData.append('name', document.getElementById('name').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('brand', document.getElementById('brand').value);
            formData.append('issue', document.getElementById('issue').value);
            
            // Custom Select Value
            const deviceSelect = document.querySelector('#device .custom-select-trigger span');
            const deviceValue = deviceSelect.textContent !== 'Selecciona...' ? deviceSelect.textContent : 'Otro';
            formData.append('device', deviceValue);

            // Radio Button
            const serviceType = document.querySelector('input[name="serviceType"]:checked');
            if (serviceType) formData.append('serviceType', serviceType.value);

            // User ID
            if (user) formData.append('userId', user.id);

            // Files
            if (fileInput && fileInput.files) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('images', fileInput.files[i]);
                }
            }

            try {
                const response = await fetch('/api/quotes', {
                    method: 'POST',
                    body: formData // Fetch handles Content-Type for FormData automatically
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Cotización enviada con éxito. Te contactaremos pronto.');
                    quoteForm.reset();
                    // Reset custom select
                    deviceSelect.textContent = 'Selecciona...';
                    fileText.textContent = 'No se han seleccionado archivos.';
                    
                    if (user) {
                        // Redirect to profile history if logged in
                        if (confirm('¿Quieres ver tu historial de cotizaciones?')) {
                            window.location.href = 'userprofile.html';
                        }
                    }
                } else {
                    alert('Error: ' + (result.error || 'No se pudo enviar la cotización'));
                }
            } catch (err) {
                console.error(err);
                alert('Error de conexión');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

function setupCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select');
    
    customSelects.forEach(select => {
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelectorAll('.custom-option');
        const valueSpan = trigger.querySelector('span');
        
        trigger.addEventListener('click', () => {
            select.classList.toggle('open');
            select.setAttribute('aria-expanded', select.classList.contains('open'));
        });
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                const text = option.textContent; // Used for display logic if needed
                
                // Assuming the text content of option is what we want to show
                // For the quick estimate, it has price info we might want to strip or keep
                // For device type, it's just the name
                
                valueSpan.textContent = value; // Use data-value for logic, or textContent for display?
                // In HTML above, textContent was clean for Device, but had price for Estimate.
                // Let's rely on data-value for the "value" part if we were using hidden inputs,
                // but here visual update uses textContent usually.
                // Let's use the text of the option as the "Selected" display relative to the context.
                
                // Special case for Estimate Result
                if (select.id === 'quickEstimate') {
                   valueSpan.textContent = text.split('—')[0].trim(); // Just show name in box
                   const estimateResult = document.getElementById('estimateResult');
                   if (estimateResult) {
                       estimateResult.textContent = `Rango estimado: ${text.split('—')[1] || ''}`;
                       estimateResult.style.color = 'var(--primary)';
                   }
                } else {
                   valueSpan.textContent = text;
                }

                select.classList.remove('open');
                select.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!select.contains(e.target)) {
                select.classList.remove('open');
                select.setAttribute('aria-expanded', 'false');
            }
        });
    });
}
