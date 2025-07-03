export default function decorate(block) {
  // Get all event items
  const eventItems = [...block.children];

  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.classList.add('events-filters');

  // Create filter dropdowns
  const filterFields = ['Title', 'City', 'Land'];
  const activeFilters = new Map();

  // Function to get unique values from a column
  const getUniqueValues = (columnIndex) => {
    const values = new Set();
    eventItems.forEach((item) => {
      // Map filter fields to actual data indices
      const fieldToIndexMap = {
        0: 0, // Title
        1: 2, // City
        2: 7, // Land
      };
      const value = item.children[fieldToIndexMap[columnIndex]].textContent.trim();
      values.add(value);
    });
    return Array.from(values).sort();
  };

  // Function to create filter dropdown
  const createFilterDropdown = (field) => {
    const container = document.createElement('div');
    container.classList.add('filter-group');

    const select = document.createElement('select');
    select.classList.add('filter-select');
    select.setAttribute('aria-label', `Filter by ${field}`);

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Filter by ${field}`;
    select.appendChild(defaultOption);

    const uniqueValues = getUniqueValues(filterFields.indexOf(field));
    uniqueValues.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    const clearButton = document.createElement('button');
    clearButton.classList.add('filter-clear');
    clearButton.textContent = 'x';
    clearButton.style.display = 'none';
    clearButton.setAttribute('aria-label', `Clear ${field} filter`);

    container.appendChild(select);
    container.appendChild(clearButton);

    return { container, select, clearButton };
  };

  // Create table element
  const table = document.createElement('table');
  table.classList.add('events-table');

  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Define field headers
  const fields = ['Title', 'City', 'Begin', 'End', 'Hall', 'Standnr.', 'Land'];

  // Current sort state
  let currentSortColumn = null;
  let isAscending = true;

  // Create table body
  let tableBody = document.createElement('tbody');

  // Function to sort table data
  const sortTable = (columnIndex, isDate = false) => {
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    const sortedRows = rows.sort((a, b) => {
      const aValue = a.children[columnIndex].textContent.trim();
      const bValue = b.children[columnIndex].textContent.trim();

      if (isDate) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return isAscending ? aDate - bDate : bDate - aDate;
      }

      return isAscending
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    // Clear and re-append sorted rows
    tableBody.innerHTML = '';
    sortedRows.forEach((row) => tableBody.appendChild(row));
  };

  // Add headers with sort icons
  fields.forEach((field, index) => {
    const th = document.createElement('th');
    th.textContent = field;
    th.style.cursor = 'pointer';

    const sortIcon = document.createElement('span');
    sortIcon.className = 'events-icon-sort';
    sortIcon.style.marginLeft = '5px';

    th.appendChild(sortIcon);

    // Move click handler to th element
    th.addEventListener('click', () => {
      // Toggle sort direction if clicking the same column
      if (currentSortColumn === index) {
        isAscending = !isAscending;
      } else {
        currentSortColumn = index;
        isAscending = true;
      }

      // Update all icons to default state
      headerRow.querySelectorAll('.events-icon-sort').forEach((icon) => {
        icon.className = 'events-icon-sort';
      });

      // Update clicked icon
      sortIcon.className = `events-icon-sort-${isAscending ? 'asc' : 'desc'}`;

      // Sort the table
      sortTable(index, field === 'Begin' || field === 'End');
    });

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  tableBody = document.createElement('tbody');

  // Function to apply filters
  const applyFilters = () => {
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    rows.forEach((row) => {
      let showRow = true;
      activeFilters.forEach((value, field) => {
        // Map filter fields to actual table column indices
        const fieldToIndexMap = {
          Title: 0,
          City: 1,
          Land: 6,
        };
        const cellValue = row.children[fieldToIndexMap[field]].textContent.trim();
        if (cellValue !== value) {
          showRow = false;
        }
      });
      row.style.display = showRow ? '' : 'none';
    });
  };

  // Create and add filter dropdowns
  filterFields.forEach((field, index) => {
    const { container, select, clearButton } = createFilterDropdown(field, index);

    select.addEventListener('change', () => {
      if (select.value) {
        activeFilters.set(field, select.value);
        clearButton.style.display = 'inline-block';
      } else {
        activeFilters.delete(field);
        clearButton.style.display = 'none';
      }
      applyFilters();
    });

    clearButton.addEventListener('click', () => {
      select.value = '';
      activeFilters.delete(field);
      clearButton.style.display = 'none';
      applyFilters();
    });

    filterContainer.appendChild(container);
  });

  // Add event data rows
  eventItems.forEach((item) => {
    const row = document.createElement('tr');
    // Get all div elements containing the field values
    const fieldValues = [...item.children];
    // Add each field value to the row
    fieldValues.forEach((field, index) => {
      // Skip the link field (index 1) entirely
      if (index !== 1) {
        const td = document.createElement('td');
        // Format date fields (Begin and End)
        if (index === 2 || index === 3) {
          const [dateStr] = field.textContent.trim().split('T');
          td.textContent = dateStr;
        } else if (index === 0) { // Title field
          const title = field.textContent.trim();
          td.textContent = title;
          // Check if there's a link in the next column and create anchor if exists
          if (fieldValues[1] && fieldValues[1].textContent.trim()) {
            const anchor = document.createElement('a');
            anchor.href = fieldValues[1].textContent.trim();
            anchor.textContent = td.textContent;
            td.textContent = '';
            td.appendChild(anchor);
          }
        } else {
          td.textContent = field.textContent.trim();
        }
        row.appendChild(td);
      }
    });
    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);

  // Create a container for the table view
  const tableViewContainer = document.createElement('div');
  tableViewContainer.classList.add('events-table-view');
  tableViewContainer.appendChild(filterContainer);
  tableViewContainer.appendChild(table);

  // Hide the original content but preserve it for CMS
  const originalContent = document.createElement('div');
  originalContent.classList.add('events-original-content');
  originalContent.style.display = 'none';
  while (block.firstChild) {
    originalContent.appendChild(block.firstChild);
  }

  // Append both the original content and table view
  block.appendChild(originalContent);
  block.appendChild(tableViewContainer);
}
