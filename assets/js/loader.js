window.onload = function() {
  const loaderWrapper = document.getElementById('loaderWrapper');
  
  // Añade la clase 'hidden' para iniciar la animación de desvanecimiento
  loaderWrapper.classList.add('hidden');
  
  // Después de que la transición de 0.5s termine, elimina el loader del layout
  setTimeout(() => {
    loaderWrapper.style.display = 'none';
  }, 500); // 500ms = 0.5s (la duración de la transición en el CSS)
};