document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const counterEl = document.getElementById('counter');
    const incrementBtn = document.getElementById('increment-btn');
    const decrementBtn = document.getElementById('decrement-btn');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const undoBtn = document.getElementById('undo-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const entriesEl = document.getElementById('entries');
    const themeToggle = document.getElementById('theme-toggle');
    const trendTextEl = document.getElementById('trend-text');
    const avgCountEl = document.getElementById('avg-count');
    const maxCountEl = document.getElementById('max-count');
    const totalEntriesEl = document.getElementById('total-entries');
    const hourlyTrendEl = document.getElementById('hourly-trend');
    const chartEl = document.getElementById('chart');
    const searchInput = document.getElementById('search-input');
    const currentDateEl = document.getElementById('current-date');
    
    // Modal Elements
    const noteModal = document.getElementById('note-modal');
    const noteModalEntry = document.getElementById('note-modal-entry');
    const noteModalText = document.getElementById('note-modal-text');
    const noteModalSave = document.getElementById('note-modal-save');
    const noteModalCancel = document.getElementById('note-modal-cancel');
    const deleteModal = document.getElementById('delete-modal');
    const deleteModalEntry = document.getElementById('delete-modal-entry');
    const deleteModalConfirm = document.getElementById('delete-modal-confirm');
    const deleteModalCancel = document.getElementById('delete-modal-cancel');
    const closeButtons = document.querySelectorAll('.close-btn');
    
    // App state
    let count = 0;
    let savedCounts = [];
    let previousCount = 0;
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let actionHistory = [];
    let lastAutoSave = Date.now();
    let currentEntryIndex = null;
    
    // Initialize date display
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Initialize theme
    function initTheme() {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
    
    initTheme();
    
    // Load data from localStorage
    function loadData() {
        const savedData = localStorage.getItem('peopleCounterData');
        if (savedData) {
            const data = JSON.parse(savedData);
            count = data.count || 0;
            savedCounts = data.savedCounts || [];
            updateCounter();
            updateEntries();
            updateStats();
            updateChart();
        }
    }
    
    // Save data to localStorage
    function saveData() {
        const data = {
            count: count,
            savedCounts: savedCounts
        };
        localStorage.setItem('peopleCounterData', JSON.stringify(data));
        lastAutoSave = Date.now();
    }
    
    // Auto-save every 30 seconds if changes made
    setInterval(() => {
        if (Date.now() - lastAutoSave > 30000) {
            saveData();
        }
    }, 10000);
    
    // Update counter display with animation
    function updateCounter() {
        counterEl.classList.add('counter-change');
        counterEl.textContent = count;
        updateTrend();
        setTimeout(() => {
            counterEl.classList.remove('counter-change');
        }, 500);
    }
    
    // Update trend indicator
    function updateTrend() {
        const trendIcon = document.querySelector('.trending .icon');
        const iconEl = trendIcon.querySelector('i');
        
        if (count > previousCount) {
            iconEl.className = 'fas fa-arrow-up up';
            trendTextEl.textContent = 'Trending up';
        } else if (count < previousCount) {
            iconEl.className = 'fas fa-arrow-down down';
            trendTextEl.textContent = 'Trending down';
        } else {
            iconEl.className = 'fas fa-minus';
            trendTextEl.textContent = 'No change';
        }
    }
    
    // Format date and time
    function formatDateTime(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    // Calculate hourly trend
    function calculateHourlyTrend() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentEntries = savedCounts.filter(entry => 
            new Date(entry.timestamp) > oneHourAgo
        );
        
        if (recentEntries.length < 2) return 0;
        
        const firstCount = recentEntries[0].count;
        const lastCount = recentEntries[recentEntries.length - 1].count;
        return lastCount - firstCount;
    }
    
    // Create an entry element
    function createEntryElement(entry, index) {
        const entryEl = document.createElement('div');
        entryEl.className = 'entry';
        entryEl.dataset.count = entry.count;
        entryEl.dataset.timestamp = entry.timestamp;
        
        const statusDot = document.createElement('div');
        statusDot.className = entry.count >= previousCount ? 'status-dot green' : 'status-dot red';
        
        const entryDetails = document.createElement('div');
        entryDetails.className = 'entry-details';
        
        const entryCount = document.createElement('div');
        entryCount.className = 'entry-count';
        entryCount.textContent = `Count: ${entry.count}`;
        
        const entryTime = document.createElement('div');
        entryTime.className = 'entry-time';
        entryTime.textContent = formatDateTime(new Date(entry.timestamp));
        
        if (entry.note) {
            const entryNote = document.createElement('div');
            entryNote.className = 'entry-note';
            entryNote.textContent = `Note: ${entry.note}`;
            entryDetails.appendChild(entryNote);
        }
        
        const entryActions = document.createElement('div');
        entryActions.className = 'entry-actions';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i>';
        editBtn.setAttribute('aria-label', `Edit entry from ${formatDateTime(new Date(entry.timestamp))}`);
        editBtn.addEventListener('click', () => {
            currentEntryIndex = index;
            noteModalEntry.textContent = `Count: ${entry.count}, Time: ${formatDateTime(new Date(entry.timestamp))}`;
            noteModalText.value = entry.note || '';
            noteModal.style.display = 'flex';
            noteModalText.focus();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        deleteBtn.setAttribute('aria-label', `Delete entry from ${formatDateTime(new Date(entry.timestamp))}`);
        deleteBtn.addEventListener('click', () => {
            currentEntryIndex = index;
            deleteModalEntry.textContent = `Count: ${entry.count}, Time: ${formatDateTime(new Date(entry.timestamp))}`;
            deleteModal.style.display = 'flex';
        });
        
        entryDetails.appendChild(entryCount);
        entryDetails.appendChild(entryTime);
        entryActions.appendChild(editBtn);
        entryActions.appendChild(deleteBtn);
        
        entryEl.appendChild(statusDot);
        entryEl.appendChild(entryDetails);
        entryEl.appendChild(entryActions);
        
        return entryEl;
    }
    
    // Update entries display
    function updateEntries() {
        entriesEl.innerHTML = '';
        
        const searchTerm = searchInput.value.toLowerCase();
        const filteredEntries = savedCounts.filter(entry => {
            const dateStr = formatDateTime(new Date(entry.timestamp)).toLowerCase();
            const noteStr = entry.note ? entry.note.toLowerCase() : '';
            return dateStr.includes(searchTerm) || 
                   entry.count.toString().includes(searchTerm) || 
                   noteStr.includes(searchTerm);
        });
        
        if (filteredEntries.length === 0) {
            const noEntries = document.createElement('div');
            noEntries.textContent = searchTerm ? 'No matching entries found.' : 'No entries yet. Add people and save counts to see them here.';
            noEntries.style.textAlign = 'center';
            noEntries.style.padding = '20px';
            noEntries.style.color = '#777';
            entriesEl.appendChild(noEntries);
            return;
        }
        
        filteredEntries
            .slice()
            .reverse()
            .forEach((entry, index) => {
                const actualIndex = savedCounts.length - 1 - index;
                const entryEl = createEntryElement(entry, actualIndex);
                entriesEl.appendChild(entryEl);
            });
    }
    
    // Delete an entry
    function deleteEntry(index) {
        actionHistory.push({
            type: 'delete',
            index: index,
            entry: savedCounts[index]
        });
        savedCounts.splice(index, 1);
        updateEntries();
        updateStats();
        updateChart();
        saveData();
        deleteModal.style.display = 'none';
    }
    
    // Undo last action
    function undoAction() {
        if (actionHistory.length === 0) {
            alert('No actions to undo.');
            return;
        }
        
        const lastAction = actionHistory.pop();
        
        switch (lastAction.type) {
            case 'increment':
                count--;
                break;
            case 'decrement':
                count++;
                break;
            case 'save':
                savedCounts.pop();
                break;
            case 'delete':
                savedCounts.splice(lastAction.index, 0, lastAction.entry);
                break;
            case 'edit':
                savedCounts[lastAction.index].note = lastAction.oldNote;
                break;
            case 'reset':
                count = lastAction.oldCount;
                savedCounts = lastAction.oldSavedCounts;
                break;
        }
        
        updateCounter();
        updateEntries();
        updateStats();
        updateChart();
        saveData();
    }
    
    // Update statistics
    function updateStats() {
        const counts = savedCounts.map(entry => entry.count);
        
        const avg = counts.length > 0 
            ? counts.reduce((sum, curr) => sum + curr, 0) / counts.length 
            : 0;
        avgCountEl.textContent = Math.round(avg * 10) / 10;
        
        const max = counts.length > 0 
            ? Math.max(...counts) 
            : 0;
        maxCountEl.textContent = max;
        
        totalEntriesEl.textContent = counts.length;
        
        const hourlyChange = calculateHourlyTrend();
        hourlyTrendEl.textContent = (hourlyChange > 0 ? '+' : '') + hourlyChange;
        hourlyTrendEl.style.color = hourlyChange > 0 ? 'var(--success)' : 
                                  hourlyChange < 0 ? 'var(--danger)' : 'inherit';
    }
    
    // Update chart
    function updateChart() {
        chartEl.innerHTML = '';
        
        const chartData = savedCounts.slice(-10);
        if (chartData.length === 0) return;
        
        const maxCount = Math.max(...chartData.map(entry => entry.count), 1);
        
        chartData.forEach(entry => {
            const barHeight = maxCount > 0 
                ? (entry.count / maxCount) * 100 
                : 0;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${barHeight}%`;
            bar.setAttribute('data-value', entry.count);
            bar.setAttribute('data-tooltip', 
                `Count: ${entry.count}\nTime: ${formatDateTime(new Date(entry.timestamp))}` + 
                (entry.note ? `\nNote: ${entry.note}` : '')
            );
            bar.setAttribute('aria-label', `Count: ${entry.count} at ${formatDateTime(new Date(entry.timestamp))}`);
            
            chartEl.appendChild(bar);
        });
    }
    
    // Export data
// Export data (JSON or PDF based on user choice)
function exportData() {
    const data = {
        count: count,
        savedCounts: savedCounts,
        exportedAt: new Date().toISOString()
    };

    // Prompt user to choose export format
    const format = prompt('Choose export format: Enter "json" for JSON or "pdf" for PDF').toLowerCase();

    if (format === 'json') {
        // Export as JSON
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `people_counter_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
        // Export as PDF
        exportToPDF(data);
    } else {
        alert('Invalid format selected. Please choose "json" or "pdf".');
    }
}

// Export data to PDF
function exportToPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set document properties
    doc.setFontSize(16);
    doc.text('Advanced People Counter - Data Export', 20, 20);

    // Current Count
    doc.setFontSize(12);
    doc.text(`Current Count: ${data.count}`, 20, 30);
    doc.text(`Exported At: ${formatDateTime(new Date(data.exportedAt))}`, 20, 40);

    // Statistics
    const counts = data.savedCounts.map(entry => entry.count);
    const avg = counts.length > 0 ? counts.reduce((sum, curr) => sum + curr, 0) / counts.length : 0;
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    doc.text(`Average Count: ${Math.round(avg * 10) / 10}`, 20, 50);
    doc.text(`Peak Count: ${max}`, 20, 60);
    doc.text(`Total Entries: ${counts.length}`, 20, 70);

    // Entry History
    doc.setFontSize(14);
    doc.text('Entry History', 20, 90);

    let yPosition = 100;
    doc.setFontSize(10);
    data.savedCounts.forEach((entry, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        const entryText = `Entry ${index + 1}: Count: ${entry.count}, Time: ${formatDateTime(new Date(entry.timestamp))}${entry.note ? `, Note: ${entry.note}` : ''}`;
        doc.text(entryText, 20, yPosition);
        yPosition += 10;
    });

    // Save the PDF
    doc.save(`people_counter_${new Date().toISOString().split('T')[0]}.pdf`);
}
    
    // Import data
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.count !== undefined && Array.isArray(importedData.savedCounts)) {
                    actionHistory.push({
                        type: 'import',
                        oldCount: count,
                        oldSavedCounts: [...savedCounts]
                    });
                    count = importedData.count;
                    savedCounts = importedData.savedCounts;
                    updateCounter();
                    updateEntries();
                    updateStats();
                    updateChart();
                    saveData();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid data format.');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    // Event: Increment counter
    incrementBtn.addEventListener('click', () => {
        actionHistory.push({ type: 'increment' });
        previousCount = count;
        count++;
        updateCounter();
        saveData();
    });
    
    // Event: Decrement counter
    decrementBtn.addEventListener('click', () => {
        if (count > 0) {
            actionHistory.push({ type: 'decrement' });
            previousCount = count;
            count--;
            updateCounter();
            saveData();
        }
    });
    
    // Event: Save count
    saveBtn.addEventListener('click', () => {
        currentEntryIndex = savedCounts.length;
        noteModalEntry.textContent = `Count: ${count}, Time: ${formatDateTime(new Date())}`;
        noteModalText.value = '';
        noteModal.style.display = 'flex';
        noteModalText.focus();
    });
    
    // Event: Reset
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the counter to zero?')) {
            actionHistory.push({
                type: 'reset',
                oldCount: count,
                oldSavedCounts: [...savedCounts]
            });
            previousCount = count;
            count = 0;
            savedCounts = [];
            updateCounter();
            updateEntries();
            updateStats();
            updateChart();
            saveData();
        }
    });
    
    // Event: Undo
    undoBtn.addEventListener('click', () => {
        undoAction();
    });
    
    // Event: Export
    exportBtn.addEventListener('click', () => {
        exportData();
    });
    
    // Event: Import
    importBtn.addEventListener('change', importData);
    
    // Event: Toggle theme
    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
        
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    });
    
    // Event: Search entries
    searchInput.addEventListener('input', () => {
        updateEntries();
    });
    
    // Modal Events
    noteModalSave.addEventListener('click', () => {
        if (currentEntryIndex !== null) {
            actionHistory.push({
                type: 'edit',
                index: currentEntryIndex,
                oldNote: savedCounts[currentEntryIndex]?.note,
                newNote: noteModalText.value.trim()
            });
            
            if (currentEntryIndex === savedCounts.length) {
                // New entry
                actionHistory.push({ type: 'save' });
                savedCounts.push({
                    count: count,
                    timestamp: new Date().toISOString(),
                    note: noteModalText.value.trim() || undefined
                });
            } else {
                // Existing entry
                savedCounts[currentEntryIndex].note = noteModalText.value.trim() || undefined;
            }
            
            updateEntries();
            updateStats();
            updateChart();
            saveData();
            
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Saved!';
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
            }, 2000);
        }
        noteModal.style.display = 'none';
        currentEntryIndex = null;
    });
    
    noteModalCancel.addEventListener('click', () => {
        noteModal.style.display = 'none';
        currentEntryIndex = null;
    });
    
    deleteModalConfirm.addEventListener('click', () => {
        if (currentEntryIndex !== null) {
            deleteEntry(currentEntryIndex);
        }
        currentEntryIndex = null;
    });
    
    deleteModalCancel.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        currentEntryIndex = null;
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            noteModal.style.display = 'none';
            deleteModal.style.display = 'none';
            currentEntryIndex = null;
        });
    });
    
    // Close modals when clicking outside
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) {
            noteModal.style.display = 'none';
            currentEntryIndex = null;
        }
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
            currentEntryIndex = null;
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target === searchInput || e.target === noteModalText) return;
        
        if (e.key === '+' || e.key === '=') {
            incrementBtn.click();
            e.preventDefault();
        }
        else if (e.key === '-' || e.key === '_') {
            decrementBtn.click();
            e.preventDefault();
        }
        else if (e.key === 's' || e.key === 'S') {
            saveBtn.click();
            e.preventDefault();
        }
        else if (e.key === 'z' && e.ctrlKey) {
            undoBtn.click();
            e.preventDefault();
        }
        else if (e.key === 'Escape' && (noteModal.style.display === 'flex' || deleteModal.style.display === 'flex')) {
            noteModal.style.display = 'none';
            deleteModal.style.display = 'none';
            currentEntryIndex = null;
            e.preventDefault();
        }
    });
    
    // Initialize app
    loadData();
});