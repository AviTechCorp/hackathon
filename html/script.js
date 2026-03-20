// Assuming this is where your showToast function is defined, or in a separate utility file.

function showToast(message) {
    // Create the toast element
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;

    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px', // Display at the top
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#333',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: '1000',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out'
    });

    // Add dismiss functionality
    toast.addEventListener('click', () => {
        toast.remove();
    });

    // Add to document and fade in
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300); // remove after fade out
    }, 3000);
}