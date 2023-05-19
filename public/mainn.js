const deleteButtons = document.querySelectorAll('.delete-button');
deleteButtons.forEach(button => {
  button.addEventListener('click', () => {
    const showtimeId = button.getAttribute('data-showtime-id');

    // Perform the deletion using JavaScript (AJAX)
    fetch('/deleteshowtime', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ showtimeID: showtimeId })
    })
      .then(response => {
        if (response.ok) {
          // Row deleted successfully, remove it from the table
          const row = button.closest('tr');
          row.remove();
        } else {
          console.error('Failed to delete the showtime.');
        }
      })
      .catch(error => {
        console.error('An error occurred while deleting the showtime:', error);
      });
  });
});
