/**
 * Main script for the Personalized Habit Tracker application.
 * Handles DOM manipulations, event listening, data storage, and rendering of UI components.
 */
document.addEventListener('DOMContentLoaded', () => {
    //================================================================================
    // DOM Element References
    //================================================================================
    const habitForm = document.getElementById('habit-form');
    const habitNameInput = document.getElementById('habit-name');
    const habitFrequencySelect = document.getElementById('habit-frequency');
    const habitsListEl = document.getElementById('habits-list');
    const requestPermissionBtn = document.getElementById('request-permission-btn');

    // Calendar elements
    const calendarContainer = document.getElementById('calendar-container');
    const monthYearDisplay = document.getElementById('month-year-display');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // Progress and Chart elements
    const progressBarsContainer = document.getElementById('progress-bars-container');
    const chartsContainer = document.getElementById('charts-container'); // Main container for charts section
    const streakChartCtx = document.getElementById('streak-chart')?.getContext('2d');
    const completionRateChartCtx = document.getElementById('completion-rate-chart')?.getContext('2d');
    const streakChartWrapper = document.getElementById('streak-chart-wrapper');
    const completionRateChartWrapper = document.getElementById('completion-rate-chart-wrapper');
    const chartsGlobalErrorMessage = document.getElementById('charts-global-error-message');


    //================================================================================
    // State Variables
    //================================================================================
    let habits = []; // Array to store habit objects
    let currentMonth = new Date().getMonth(); // 0-indexed (January is 0)
    let currentYear = new Date().getFullYear();
    let streakChartInstance = null; 
    let completionRateChartInstance = null; 

    // Habit object structure:
    // {
    //   id: Date.now(),                // Unique ID (timestamp)
    //   name: 'Exercise',              // Name of the habit
    //   frequency: 'daily',            // 'daily' or 'weekly'
    //   creationDate: new Date().toISOString(), // ISO string of creation date
    //   completedDates: []             // Array of ISO date strings (YYYY-MM-DD) when completed
    // }

    //================================================================================
    // Data Persistence Functions (LocalStorage)
    //================================================================================

    /**
     * Loads habits from LocalStorage into the global `habits` array.
     * If no habits are found, initializes `habits` as an empty array.
     */
    function loadHabits() {
        const storedHabits = localStorage.getItem('habits');
        if (storedHabits) {
            habits = JSON.parse(storedHabits);
            console.log('Habits loaded from LocalStorage.');
        } else {
            console.log('No habits found in LocalStorage. Initializing with an empty array.');
            habits = [];
        }
    }

    /**
     * Saves the current state of the global `habits` array to LocalStorage.
     */
    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
        console.log('Habits saved to LocalStorage.');
    }

    //================================================================================
    // Rendering Functions
    //================================================================================

    /**
     * Renders the list of habits in the UI.
     * Displays habit name, frequency, and a button to mark as complete.
     */
    function renderHabits() {
        // console.log('Rendering habits list...');
        if (!habitsListEl) {
            console.error("Habits list element not found!");
            return;
        }
        habitsListEl.innerHTML = ''; // Clear current list

        if (habits.length === 0) {
            habitsListEl.innerHTML = '<p>No habits added yet. Add one above!</p>';
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        habits.forEach(habit => {
            const habitEl = document.createElement('li');
            habitEl.className = 'habit-item';
            habitEl.dataset.habitId = habit.id;

            const habitInfo = document.createElement('span');
            habitInfo.textContent = `${habit.name} (${habit.frequency})`;

            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';

            const isCompletedToday = habit.completedDates && habit.completedDates.includes(todayStr);
            if (isCompletedToday) {
                habitEl.classList.add('completed');
                completeBtn.textContent = 'Completed ✔';
                completeBtn.disabled = true;
            } else {
                completeBtn.textContent = 'Mark Complete';
                completeBtn.disabled = false;
            }

            completeBtn.addEventListener('click', () => handleMarkComplete(habit.id));

            habitEl.appendChild(habitInfo);
            habitEl.appendChild(completeBtn);
            habitsListEl.appendChild(habitEl);
        });
    }

    /**
     * Renders the monthly calendar view.
     * Displays days and highlights days with completed habits.
     */
    function renderCalendar() {
        // console.log(`Rendering calendar for ${currentMonth + 1}/${currentYear}...`);
        if (!calendarContainer || !monthYearDisplay) {
            console.error("Calendar elements (container or month/year display) not found!");
            return;
        }
        calendarContainer.innerHTML = ''; // Clear previous calendar

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarContainer.appendChild(emptyCell);
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;
            dayCell.textContent = day;

            // Check if any habit was completed on this day
            const habitCompletedOnDay = habits.some(habit => habit.completedDates && habit.completedDates.includes(dateStr));
            if (habitCompletedOnDay) {
                dayCell.classList.add('day-completed-habit');
            }
            calendarContainer.appendChild(dayCell);
        }
    }

    /**
     * Renders progress bars for each habit.
     * Calculates and displays progress based on habit frequency and completion.
     */
    function renderProgressBars() {
        // console.log('Rendering progress bars...');
        if (!progressBarsContainer) {
            console.error("Progress bars container not found!");
            return;
        }
        progressBarsContainer.innerHTML = '';

        if (habits.length === 0) {
            progressBarsContainer.innerHTML = '<p>No habits to show progress for.</p>';
            return;
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        habits.forEach(habit => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'habit-progress-item';

            const nameLabel = document.createElement('p');
            nameLabel.textContent = habit.name;
            itemDiv.appendChild(nameLabel);

            let progressPercent = 0;
            let completedCount = 0;
            const maxCount = habit.frequency === 'weekly' ? 7 : 1; // Denominator for progress

            if (habit.frequency === 'daily') {
                if (habit.completedDates && habit.completedDates.includes(todayStr)) {
                    completedCount = 1;
                }
            } else if (habit.frequency === 'weekly') {
                const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
                const currentDayAdjusted = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6
                
                let monday = new Date(today);
                monday.setDate(today.getDate() - currentDayAdjusted);
                monday.setHours(0, 0, 0, 0);

                for (let i = 0; i < 7; i++) {
                    const dayToCheck = new Date(monday);
                    dayToCheck.setDate(monday.getDate() + i);
                    const dayToCheckStr = dayToCheck.toISOString().split('T')[0];
                    if (habit.completedDates && habit.completedDates.includes(dayToCheckStr)) {
                        completedCount++;
                    }
                }
            }
            progressPercent = (completedCount / maxCount) * 100;

            const barBackground = document.createElement('div');
            barBackground.className = 'progress-bar-background';

            const barFill = document.createElement('div');
            barFill.className = 'progress-bar-fill';
            barFill.style.width = `${progressPercent}%`;
            
            const percentageText = document.createElement('span');
            percentageText.className = 'progress-percentage';
            percentageText.textContent = `${Math.round(progressPercent)}%`;
            if (habit.frequency === 'weekly') {
                 percentageText.textContent += ` (${completedCount}/${maxCount})`;
            }

            barFill.appendChild(percentageText);
            barBackground.appendChild(barFill);
            itemDiv.appendChild(barBackground);
            progressBarsContainer.appendChild(itemDiv);
        });
    }

    /**
     * Renders charts for habit analysis (streaks and completion rates).
     * Uses Chart.js library.
     */
    function renderCharts() {
        // console.log('Rendering charts...');

        // Ensure wrapper elements are found
        if (!streakChartWrapper || !completionRateChartWrapper || !chartsGlobalErrorMessage) {
            console.error("Chart wrapper elements or global error message element not found. Cannot render charts section.");
            if (chartsContainer) chartsContainer.style.display = 'none'; // Hide the whole section if critical parts are missing
            return;
        }
        
        // Hide all parts initially, then show what's needed
        streakChartWrapper.style.display = 'none';
        completionRateChartWrapper.style.display = 'none';
        chartsGlobalErrorMessage.style.display = 'none';

        if (!streakChartCtx || !completionRateChartCtx) {
            console.warn("Chart canvas contexts not found.");
            chartsGlobalErrorMessage.textContent = "Charts cannot be displayed (canvas issue).";
            chartsGlobalErrorMessage.style.display = 'block';
            return;
        }
        
        // Destroy previous chart instances
        if (streakChartInstance) {
            streakChartInstance.destroy();
            streakChartInstance = null; 
        }
        if (completionRateChartInstance) {
            completionRateChartInstance.destroy();
            completionRateChartInstance = null;
        }

        if (habits.length === 0) {
            // console.log("No habits to render charts.");
            chartsGlobalErrorMessage.textContent = "No habits added yet to display charts.";
            chartsGlobalErrorMessage.style.display = 'block';
            // Canvases are effectively hidden because their wrappers are not shown
            return;
        }
        
        // If habits are present, show the chart wrappers
        streakChartWrapper.style.display = 'block';
        completionRateChartWrapper.style.display = 'block';

        const habitNames = habits.map(h => h.name);
        // Define color palettes
        const streakChartBackgroundColor = 'rgba(54, 162, 235, 0.6)'; // Primary blue
        const streakChartBorderColor = 'rgba(54, 162, 235, 1)';

        const pieColors = [
            'rgba(255, 99, 132, 0.7)',  // Red
            'rgba(54, 162, 235, 0.7)', // Blue
            'rgba(255, 206, 86, 0.7)', // Yellow
            'rgba(75, 192, 192, 0.7)', // Green
            'rgba(153, 102, 255, 0.7)',// Purple
            'rgba(255, 159, 64, 0.7)'  // Orange
        ];

        // Streak Chart (Bar)
        const streakData = habits.map(habit => calculateStreak(habit));
        streakChartInstance = new Chart(streakChartCtx, {
            type: 'bar',
            data: {
                labels: habitNames,
                datasets: [{
                    // label: 'Longest Completion Streak (days)', // Legend is hidden, so label is not strictly needed
                    data: streakData,
                    backgroundColor: streakChartBackgroundColor,
                    borderColor: streakChartBorderColor,
                    borderWidth: 1
                }]
            },
            options: { 
                indexAxis: 'x', // Explicitly set for vertical bar chart
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        suggestedMax: 10,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    } 
                },
                plugins: {
                    legend: {
                        display: false // Hide legend as there's only one dataset
                    }
                }
            }
        });

        // Completion Rate Chart (Pie)
        const completionRateData = habits.map(habit => {
            const totalCompletions = habit.completedDates ? habit.completedDates.length : 0;
            // Calculate days since creation, ensuring at least 1 day to avoid division by zero
            const creationDate = new Date(habit.creationDate);
            const today = new Date();
            const daysSinceCreation = Math.max(1, Math.floor((today - creationDate) / (1000 * 60 * 60 * 24)));
            return totalCompletions > 0 ? (totalCompletions / daysSinceCreation) * 100 : 0; // Rate based on actual tracking period
        });
        completionRateChartInstance = new Chart(completionRateChartCtx, {
            type: 'pie',
            data: {
                labels: habitNames,
                datasets: [{
                    label: 'Overall Completion Rate', // Used in tooltip
                    data: completionRateData.map(rate => parseFloat(rate.toFixed(1))),
                    backgroundColor: pieColors, // Apply the defined palette
                    hoverOffset: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top', // Or 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    //================================================================================
    // Helper Functions
    //================================================================================

    /**
     * Calculates the longest consecutive streak of completions for a given habit.
     * @param {object} habit - The habit object.
     * @returns {number} The length of the longest streak.
     */
    function calculateStreak(habit) {
        if (!habit.completedDates || habit.completedDates.length === 0) return 0;
        
        const sortedDates = [...habit.completedDates].sort((a, b) => new Date(a) - new Date(b));
        let longestStreak = 0;
        let currentStreak = 0;
        
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                const prevDate = new Date(sortedDates[i-1]);
                const currentDate = new Date(sortedDates[i]);
                const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

                if (diffDays === 1) {
                    currentStreak++;
                } else if (diffDays > 1) { // Streak broken
                    currentStreak = 1;
                }
                // If diffDays < 1 (e.g., multiple completions on the same day for a flexible habit, not typical here), streak isn't broken.
            }
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        }
        return longestStreak;
    }

    /**
     * Handles the logic for marking a habit as complete for the current day.
     * @param {number} habitId - The ID of the habit to mark complete.
     */
    function handleMarkComplete(habitId) {
        const currentHabit = habits.find(h => h.id === habitId);
        if (!currentHabit) {
            console.error('Habit not found for completion:', habitId);
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (currentHabit.completedDates && currentHabit.completedDates.includes(todayStr)) {
            alert('Habit already marked complete for today!');
        } else {
            if (!currentHabit.completedDates) currentHabit.completedDates = [];
            currentHabit.completedDates.push(todayStr);
            // console.log(`Habit "${currentHabit.name}" marked complete for ${todayStr}.`);
            
            saveHabits();
            renderAll(); // Re-render all relevant UI components
        }
    }
    
    /**
     * Central function to re-render all dynamic UI parts.
     */
    function renderAll() {
        renderHabits();
        renderCalendar();
        renderProgressBars();
        renderCharts();
    }

    //================================================================================
    // Notification Functions
    //================================================================================

    /**
     * Handles UI updates based on notification permission status.
     * @param {string} permission - The current notification permission status ('granted', 'denied', 'default').
     */
    function handleNotificationPermission(permission) {
        if (!requestPermissionBtn) return; // Button might not be in DOM for some reason

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            requestPermissionBtn.style.display = 'none';
        } else if (permission === 'denied') {
            console.log('Notification permission denied.');
            requestPermissionBtn.textContent = 'Permission Denied';
            requestPermissionBtn.disabled = true;
        } else { // 'default'
            // console.log('Notification permission not yet requested.');
            requestPermissionBtn.textContent = 'Enable Reminders';
            requestPermissionBtn.disabled = false;
            requestPermissionBtn.style.display = 'block';
        }
    }

    /**
     * Checks for incomplete daily habits and sends notifications if permission is granted.
     */
    function checkAndSendReminders() {
        if (Notification.permission !== 'granted') {
            // console.log('Notification permission not granted. Cannot send reminders.');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let remindersSent = 0;

        habits.forEach(habit => {
            if (habit.frequency === 'daily') {
                const isCompletedToday = habit.completedDates && habit.completedDates.includes(todayStr);
                if (!isCompletedToday) {
                    // console.log(`Sending reminder for: ${habit.name}`);
                    new Notification("Habit Reminder", { 
                        body: `Don't forget to complete: ${habit.name}`,
                        // icon: './icon.png' // Optional: Ensure icon.png exists in the root
                    });
                    remindersSent++;
                }
            }
        });

        if (remindersSent > 0) {
            console.log(`${remindersSent} reminders sent.`);
        } else {
            // console.log('No reminders needed or all daily habits completed.');
        }
    }

    //================================================================================
    // Event Listeners
    //================================================================================

    // Habit Form Submission
    if (habitForm) {
        habitForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const habitName = habitNameInput.value.trim();
            const habitFrequency = habitFrequencySelect.value;

            if (habitName === '') {
                alert('Habit name cannot be empty.');
                return;
            }

            const newHabit = {
                id: Date.now(),
                name: habitName,
                frequency: habitFrequency,
                creationDate: new Date().toISOString(),
                completedDates: []
            };
            habits.push(newHabit);
            // console.log('New habit added:', newHabit);
            
            saveHabits();
            renderAll();
            habitNameInput.value = ''; // Clear input field
        });
    } else {
        console.error("Habit form element not found!");
    }

    // Calendar Navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    } else {
        console.error("Previous month button not found!");
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    } else {
        console.error("Next month button not found!");
    }

    // Notification Permission Request Button
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification.");
        if (requestPermissionBtn) {
            requestPermissionBtn.textContent = 'Notifications Not Supported';
            requestPermissionBtn.disabled = true;
        }
    } else {
        // Initial state of the permission button
        handleNotificationPermission(Notification.permission);
        
        if (requestPermissionBtn) {
            requestPermissionBtn.addEventListener('click', () => {
                if (Notification.permission === 'default') { // Only request if it's 'default'
                    Notification.requestPermission().then(permission => {
                        handleNotificationPermission(permission);
                        if (permission === 'granted') {
                            new Notification("Great!", { body: "Reminders are now enabled." });
                        }
                    });
                } else if (Notification.permission === 'denied') {
                    // Optionally, guide user to manually enable permissions if they click while denied
                    alert("Notification permission is denied. Please enable it in your browser settings if you wish to receive reminders.");
                }
            });
        }
    }

    //================================================================================
    // Initial Application Setup
    //================================================================================
    loadHabits();
    renderAll(); // Initial render of all UI components
    
    // Trigger reminders after a delay (e.g., 10 seconds after page load)
    // This is a simple timeout; a real app might use a more sophisticated scheduling mechanism or service worker.
    setTimeout(checkAndSendReminders, 10000); 
});
