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
    const clearAllDataBtn = document.getElementById('clear-all-data-btn');


    //================================================================================
    // State Variables
    //================================================================================
    let habits = []; // Array to store habit objects
    let currentMonth = new Date().getMonth(); // 0-indexed (January is 0)
    let currentYear = new Date().getFullYear();
    let streakChartInstance = null; 
    let completionRateChartInstance = null; 

    // Habit object structure (New):
    // {
    //   id: Date.now(),
    //   name: 'Exercise',
    //   frequency: 'daily',
    //   creationDate: new Date().toISOString(),
    //   targetCount: 1, // Default target completions per period
    //   completions: { 'YYYY-MM-DD': count } // Object to store completion counts for dates
    // }

    //================================================================================
    // Data Persistence Functions (LocalStorage)
    //================================================================================

    /**
     * Loads habits from LocalStorage into the global `habits` array.
     * Migrates old habit structures to the new structure if necessary.
     * If no habits are found, initializes `habits` as an empty array.
     */
    function loadHabits() {
        const storedHabits = localStorage.getItem('habits');
        if (storedHabits) {
            let loadedHabits = JSON.parse(storedHabits);
            console.log('Habits loaded from LocalStorage.');

            // Data migration for habits from old structure
            loadedHabits = loadedHabits.map(habit => {
                if (habit.completedDates && !habit.completions) {
                    // This is an old habit structure, migrate it
                    console.log(`Migrating habit: "${habit.name}"`);
                    habit.completions = {};
                    habit.completedDates.forEach(dateStr => {
                        habit.completions[dateStr] = 1; // Assume count of 1 for old completed dates
                    });
                    delete habit.completedDates;
                    habit.targetCount = 1; // Add default targetCount
                } else if (!habit.completions) {
                    // If completions is missing entirely (e.g. very old or malformed)
                    habit.completions = {};
                }
                // Ensure targetCount exists
                if (typeof habit.targetCount === 'undefined') {
                    habit.targetCount = 1;
                }
                return habit;
            });
            habits = loadedHabits;
            // Optionally, re-save habits immediately after migration
            // saveHabits(); 
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
            // Get today's count for this habit
            const todayCount = habit.completions && habit.completions[todayStr] ? habit.completions[todayStr] : 0;

            if (todayCount > 0) {
                habitInfo.textContent = `${habit.name} (${habit.frequency}) (Today: ${todayCount})`;
                habitEl.classList.add('completed'); // Mark as completed if count > 0
            } else {
                habitInfo.textContent = `${habit.name} (${habit.frequency})`;
                habitEl.classList.remove('completed'); // Ensure not marked if count is 0
            }
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';

            if (todayCount > 0) {
                completeBtn.textContent = `Completed (${todayCount})`;
            } else {
                completeBtn.textContent = 'Mark Complete';
            }
            completeBtn.disabled = false; // Button is always enabled to allow more completions

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

            // Check if any habit was completed on this day (at least once)
            const habitCompletedOnDay = habits.some(habit => habit.completions && habit.completions[dateStr] && habit.completions[dateStr] > 0);
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
            const targetCount = habit.targetCount || 1; // Default to 1 if not set
            const completions = habit.completions || {};
            
            const percentageText = document.createElement('span');
            percentageText.className = 'progress-percentage';

            if (habit.frequency === 'daily') {
                const todayCount = completions[todayStr] || 0;
                progressPercent = Math.min((todayCount / targetCount) * 100, 100);
                percentageText.textContent = `${todayCount}/${targetCount} completion${targetCount !== 1 ? 's' : ''}`;
            } else if (habit.frequency === 'weekly') {
                let daysCompletedInWeek = 0;
                const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
                
                // Calculate the date of the most recent Monday
                // If today is Sunday (0), go back 6 days. If Monday (1), go back 0 days. etc.
                const diffToMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
                const currentMonday = new Date(today);
                currentMonday.setDate(today.getDate() - diffToMonday);
                currentMonday.setHours(0, 0, 0, 0);

                for (let i = 0; i < 7; i++) { // Iterate from Monday to Sunday
                    const dayInWeek = new Date(currentMonday);
                    dayInWeek.setDate(currentMonday.getDate() + i);
                    const dateInWeekStr = dayInWeek.toISOString().split('T')[0];
                    if (completions[dateInWeekStr] && completions[dateInWeekStr] > 0) {
                        daysCompletedInWeek++;
                    }
                }
                progressPercent = (daysCompletedInWeek / 7) * 100;
                percentageText.textContent = `${daysCompletedInWeek}/7 days`;
            }

            const barBackground = document.createElement('div');
            barBackground.className = 'progress-bar-background';

            const barFill = document.createElement('div');
            barFill.className = 'progress-bar-fill';
            barFill.style.width = `${progressPercent}%`;
            
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

        // --- Data Aggregation by Habit Name ---
        const aggregatedData = {};
        habits.forEach(habit => {
            const name = habit.name; // Use original casing for keys initially, can normalize if needed
            if (!aggregatedData[name]) {
                aggregatedData[name] = {
                    name: habit.name, // Store original name for display
                    completions: {},
                    creationDate: habit.creationDate, 
                    targetCount: habit.targetCount, 
                    // Store all unique IDs contributing to this aggregation, if needed later
                    ids: [habit.id] 
                };
            } else {
                // Update creationDate if current habit's is earlier
                if (new Date(habit.creationDate) < new Date(aggregatedData[name].creationDate)) {
                    aggregatedData[name].creationDate = habit.creationDate;
                }
                // For targetCount, we're taking the first one. This could be averaged or handled differently if requirements change.
                aggregatedData[name].ids.push(habit.id);
            }

            // Aggregate completions
            for (const date in habit.completions) {
                aggregatedData[name].completions[date] = 
                    (aggregatedData[name].completions[date] || 0) + habit.completions[date];
            }
        });
        
        const chartReadyHabits = Object.values(aggregatedData);
        if (chartReadyHabits.length === 0) { // Should be caught by habits.length === 0 earlier, but as a safeguard
            chartsGlobalErrorMessage.textContent = "No habits data to display charts.";
            chartsGlobalErrorMessage.style.display = 'block';
            streakChartWrapper.style.display = 'none';
            completionRateChartWrapper.style.display = 'none';
            return;
        }

        const habitNames = chartReadyHabits.map(h => h.name);
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

        // Streak Chart (Bar) - Now Max Daily Count
        const maxDailyCountData = chartReadyHabits.map(aggHabit => calculateMaxDailyCount(aggHabit.completions));
        streakChartInstance = new Chart(streakChartCtx, {
            type: 'bar',
            data: {
                labels: habitNames,
                datasets: [{
                    data: maxDailyCountData,
                    backgroundColor: streakChartBackgroundColor,
                    borderColor: streakChartBorderColor,
                    borderWidth: 1
                }]
            },
            options: { 
                indexAxis: 'x', 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        // suggestedMax might need adjustment or removal depending on typical max counts
                        title: {
                            display: true,
                            text: 'Max Daily Completions' // Updated Y-axis label
                        },
                        grid: {
                            lineWidth: 1 
                        }
                    },
                    x: { 
                        grid: {
                            lineWidth: 1 
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

        // Completion Rate Chart (Pie) - Now Consistency (days performed / days since creation)
        const consistencyRateData = chartReadyHabits.map(aggHabit => {
            let daysDoneCount = 0;
            if (aggHabit.completions) {
                // Count days where completion count is > 0
                daysDoneCount = Object.values(aggHabit.completions).filter(count => count > 0).length;
            }
            
            const creationDate = new Date(aggHabit.creationDate);
            const today = new Date();
            // Ensure today is not before creationDate, and calculate difference in days
            let daysSinceCreation = 0;
            if (today >= creationDate) {
                daysSinceCreation = Math.floor((today - creationDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include creation day as day 1
            } else {
                daysSinceCreation = 1; // Should not happen if creationDate is always in the past or today
            }
            daysSinceCreation = Math.max(1, daysSinceCreation); // Ensure at least 1 day

            const rate = (daysDoneCount / daysSinceCreation) * 100;
            return Math.min(rate, 100); // Cap at 100%
        });

        completionRateChartInstance = new Chart(completionRateChartCtx, {
            type: 'pie',
            data: {
                labels: habitNames,
                datasets: [{
                    label: 'Consistency Rate', 
                    data: consistencyRateData.map(rate => parseFloat(rate.toFixed(1))),
                    backgroundColor: pieColors, 
                    borderColor: '#ffffff', 
                    borderWidth: 1, 
                    hoverOffset: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top', 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    // E.g., "Reading: 75.0% days performed"
                                    label += context.parsed + '% consistency'; 
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
     * Calculates the maximum daily completion count for a given habit's completions object.
     * @param {object} completions - The completions object for an aggregated habit (e.g., { 'YYYY-MM-DD': count }).
     * @returns {number} The maximum count found on any single day.
     */
    function calculateMaxDailyCount(completions) {
        if (!completions || Object.keys(completions).length === 0) return 0;
        
        let maxCount = 0;
        for (const date in completions) {
            if (completions[date] > maxCount) {
                maxCount = completions[date];
            }
        }
        return maxCount;
    }


    /**
     * Calculates the longest consecutive streak of days a habit was performed (at least once).
     * @param {object} habit - The habit object (can be an aggregated one with a 'completions' property).
     * @returns {number} The length of the longest streak.
     */
    function calculateLongestConsecutiveStreak(habit) { // Renamed from calculateStreak
        // Streak calculation based on dates where completion count > 0
        if (!habit.completions || Object.keys(habit.completions).length === 0) return 0;

        // Get all dates where completion count > 0
        const completedDays = Object.keys(habit.completions).filter(dateStr => habit.completions[dateStr] > 0);
        if (completedDays.length === 0) return 0;
        
        const sortedDates = completedDays.sort((a, b) => new Date(a) - new Date(b));
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

        const currentDate = new Date().toISOString().split('T')[0];
        
        // Ensure completions object exists
        if (!currentHabit.completions) {
            currentHabit.completions = {};
        }

        // Increment the count for the current date
        currentHabit.completions[currentDate] = (currentHabit.completions[currentDate] || 0) + 1;
        
        console.log(`Habit "${currentHabit.name}" marked complete. Today's count: ${currentHabit.completions[currentDate]}`);
            
        saveHabits();
        renderAll(); // Re-render all relevant UI components
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
                // Check based on new completions structure
                const todayCount = currentHabit.completions && currentHabit.completions[todayStr] ? currentHabit.completions[todayStr] : 0;
                if (todayCount < currentHabit.targetCount) { // Send reminder if target not met
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

            // Duplicate name prevention logic removed as per subtask

            const newHabit = {
                id: Date.now(),
                name: habitName, 
                frequency: habitFrequency,
                creationDate: new Date().toISOString(),
                targetCount: 1,         // New field
                completions: {}         // New structure, replaces completedDates
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

    // Event Listener for Clear All Data Button
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear all habit data? This action cannot be undone.")) {
                habits = []; // Reset the global habits array
                localStorage.removeItem('habits'); // Clear from LocalStorage
                console.log('All habit data cleared.');
                renderAll(); // Re-render the entire UI to reflect the empty state
            } else {
                // User cancelled, do nothing
                console.log('Clear all data action cancelled by user.');
            }
        });
    } else {
        console.error("Clear All Data button not found!");
    }
});
