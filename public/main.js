const deleteButtons = document.querySelectorAll('.delete-button');
deleteButtons.forEach(button => {
  button.addEventListener('click', () => {
    const theaterId = button.getAttribute('data-theater-id');

    // Perform the deletion using JavaScript (AJAX)
    fetch('/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deleteTheaterID: theaterId })
    })
      .then(response => {
        if (response.ok) {
          // Row deleted successfully, remove it from the table
          const row = button.closest('tr');
          row.remove();
        } else {
          console.error('Failed to delete the theater.');
        }
      })
      .catch(error => {
        console.error('An error occurred while deleting the theater:', error);
      });
  });
});
