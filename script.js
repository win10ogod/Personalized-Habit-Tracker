/**
 * Main script for the Personalized Habit Tracker application.
 * Handles DOM manipulations, event listening, data storage, and rendering of UI components.
 */

// Default target units for habits
const TARGET_UNITS = ["times", "hours", "minutes", "km", "miles", "pages", "glasses", "servings", "calls"];

// UI Strings for Internationalization (i18n)
const uiStrings = {
    currentLanguage: 'en',
    en: {
        // General
        appTitle: "Personalized Habit Tracker",
        // Header
        headerTitle: "Personalized Habit Tracker",
        // Habit Form Section
        addHabitSectionTitle: "Add New Habit",
        habitNameLabel: "Habit Name:",
        habitFrequencyLabel: "Frequency:",
        dailyFrequencyOption: "Daily",
        weeklyFrequencyOption: "Weekly",
        targetValueLabel: "Target Value:",
        targetUnitLabel: "Target Unit:",
        addHabitButton: "Add Habit",
        // My Habits Section
        myHabitsSectionTitle: "My Habits",
        noHabitsYet: "No habits added yet. Add one above!",
        // Calendar Section
        calendarSectionTitle: "Calendar View",
        prevMonthButton: "Previous Month",
        nextMonthButton: "Next Month",
        // Progress Section
        progressSectionTitle: "Habit Progress",
        noProgressYet: "No habits to show progress for.",
        // Charts Section
        chartsSectionTitle: "Habit Analysis",
        streakChartTitle: "Maximum Daily Completions",
        completionRateChartTitle: "Overall Consistency Rate",
        noChartDataGlobal: "Charts cannot be displayed or no habits added.", // Used when canvases fail or no habits at all
        noChartDataSpecific: "No habits added yet to display charts.", // Used when habits array is empty for charts
        chartsCanvasUnavailable: "Charts cannot be displayed (canvas issue).",
        // Footer
        footerText: `© ${new Date().getFullYear()} Personalized Habit Tracker`,
        clearAllDataButton: "Clear All Records",
        // Reminder Button
        enableRemindersButton: "Enable Reminders",
        remindersNotSupported: "Notifications Not Supported",
        remindersPermissionDenied: "Permission Denied",
        remindersEnabledMessage: "Great! Reminders are now enabled.",
        remindersDeniedUserMessage: "Notification permission is denied. Please enable it in your browser settings if you wish to receive reminders.",
        // Alerts / Confirmations
        alertHabitNameEmpty: "Habit name cannot be empty.",
        confirmClearAllData: "Are you sure you want to clear all habit data? This action cannot be undone.",
        alertInvalidProgressValue: "Please enter a valid positive number for the progress.",
        // Button Texts
        markCompleteButtonText: "Mark Complete",
        completedButtonWithCount: "Completed ({count})",
        logProgressButton: "Log {unit}", // e.g. "Log Hours"
        // Archiving
        toggleArchivedViewButtonViewArchived: "View Archived",
        toggleArchivedViewButtonViewActive: "View Active Habits",
        archiveButtonText: "Archive",
        restoreButtonText: "Restore",
        noActiveHabitsYet: "No active habits. Add one or view archived.",
        noArchivedHabitsYet: "No habits have been archived yet."
    }
    // 'es': { /* Spanish translations would go here */ }
};

/**
 * Translates a given key using the uiStrings object, with optional parameter replacement.
 * @param {string} key - The key to translate.
 * @param {object} [params] - Optional object with parameters to replace in the string (e.g., {count: 5}).
 * @returns {string} The translated string, or a placeholder if not found.
 */
function t(key, params) {
    const lang = uiStrings.currentLanguage;
    let str = `[${key}]`; // Default to key if not found

    if (uiStrings[lang] && typeof uiStrings[lang][key] !== 'undefined') {
        str = uiStrings[lang][key];
    } else {
        console.warn(`Missing translation for key: "${key}" in language: "${lang}"`);
    }

    if (params) {
        for (const pKey in params) {
            str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
        }
    }
    return str;
}


document.addEventListener('DOMContentLoaded', () => {
    //================================================================================
    // DOM Element References
    //================================================================================
    const habitForm = document.getElementById('habit-form');
    const habitNameInput = document.getElementById('habit-name');
    const habitFrequencySelect = document.getElementById('habit-frequency');
    const targetValueInputEl = document.getElementById('habit-target-value'); // New
    const targetUnitInputEl = document.getElementById('habit-target-unit');   // New
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
    const toggleArchivedViewBtn = document.getElementById('toggle-archived-view-btn'); // New


    //================================================================================
    // State Variables
    //================================================================================
    let habits = []; // Array to store habit objects
    let currentMonth = new Date().getMonth(); // 0-indexed (January is 0)
    let currentYear = new Date().getFullYear();
    let streakChartInstance = null; 
    let completionRateChartInstance = null; 
    let showingArchived = false; // New state for archive view

    // Habit object structure (New with Flexible Targets & Detailed Completions):
    // {
    //   id: Date.now(),
    //   name: 'Exercise',
    //   frequency: 'daily',
    //   creationDate: new Date().toISOString(),
    //   targetValue: 1, 
    //   targetUnit: "times", 
    //   completions: { 
    //     'YYYY-MM-DD': { 
    //       count: X,      // Number of times logged
    //       totalValue: Y  // Sum of logged values (e.g., total hours, total km)
    //     } 
    //   },
    //   isArchived: false
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
                // Ensure basic structure
                habit.completions = habit.completions || {};
                habit.targetValue = typeof habit.targetValue !== 'undefined' ? habit.targetValue : 1;
                habit.targetUnit = habit.targetUnit || TARGET_UNITS[0];
                habit.isArchived = typeof habit.isArchived !== 'undefined' ? habit.isArchived : false;

                // Migration from old completedDates array OR from simple count in completions
                if (habit.completedDates) { // Very old structure
                    console.log(`Migrating (completedDates) habit: "${habit.name}"`);
                    habit.completedDates.forEach(dateStr => {
                        if (!habit.completions[dateStr] || typeof habit.completions[dateStr] === 'number') {
                             // If completions[dateStr] is a number, it's the old count
                            const oldCount = typeof habit.completions[dateStr] === 'number' ? habit.completions[dateStr] : 1;
                            habit.completions[dateStr] = { count: oldCount, totalValue: oldCount };
                        }
                    });
                    delete habit.completedDates;
                } else { // Check for completions that are just numbers (not objects)
                    for (const dateStr in habit.completions) {
                        if (typeof habit.completions[dateStr] === 'number') {
                            console.log(`Migrating (numeric completions) habit: "${habit.name}" for date ${dateStr}`);
                            const oldCount = habit.completions[dateStr];
                            habit.completions[dateStr] = { count: oldCount, totalValue: oldCount };
                        }
                    }
                }
                
                // Migrate old targetCount to targetValue
                if (typeof habit.targetCount !== 'undefined') {
                    habit.targetValue = habit.targetCount;
                    delete habit.targetCount;
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

        const habitsToDisplay = habits.filter(habit => habit.isArchived === showingArchived);

        if (habitsToDisplay.length === 0) {
            habitsListEl.innerHTML = `<p class="empty-list-message">${showingArchived ? t('noArchivedHabitsYet') : t('noActiveHabitsYet')}</p>`;
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        habitsToDisplay.forEach(habit => {
            const habitEl = document.createElement('li');
            habitEl.className = 'habit-item';
            if (habit.isArchived) {
                habitEl.classList.add('archived-item'); // Optional: for specific styling of archived items
            }
            habitEl.dataset.habitId = habit.id;

            const habitInfo = document.createElement('span');
            const todayProgress = (habit.completions && habit.completions[todayStr]) ? 
                                  habit.completions[todayStr] : 
                                  { count: 0, totalValue: 0 };

            let habitDisplayText = `${habit.name} (${habit.frequency})`;
            if (todayProgress.count > 0 && !habit.isArchived) { // Only show "Today" info for active, completed habits
                if (habit.targetUnit === 'times') {
                    habitDisplayText += ` (Today: ${todayProgress.count} ${habit.targetUnit})`;
                } else {
                    habitDisplayText += ` (Today: ${todayProgress.totalValue} ${habit.targetUnit})`;
                }
                habitEl.classList.add('completed');
            } else {
                habitEl.classList.remove('completed');
            }
            habitInfo.textContent = habitDisplayText;
            
            const actionsContainer = document.createElement('div'); // Container for buttons
            actionsContainer.className = 'habit-actions';

            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn btn btn-sm btn-success'; // Added more btn classes

            if (habit.targetUnit === 'times') {
                if (todayProgress.count > 0 && !habit.isArchived) {
                    completeBtn.textContent = t('completedButtonWithCount', { count: todayProgress.count });
                } else {
                    completeBtn.textContent = t('markCompleteButtonText');
                }
            } else {
                completeBtn.textContent = t('logProgressButton', { unit: habit.targetUnit });
            }
            completeBtn.disabled = habit.isArchived; // Disable if archived
            completeBtn.addEventListener('click', () => handleMarkComplete(habit.id));
            actionsContainer.appendChild(completeBtn);

            // Add Archive/Restore button
            const archiveRestoreBtn = document.createElement('button');
            archiveRestoreBtn.className = `btn btn-sm ${showingArchived ? 'btn-info restore-btn' : 'btn-warning archive-btn'}`;
            
            if (showingArchived) {
                archiveRestoreBtn.textContent = t('restoreButtonText');
                archiveRestoreBtn.addEventListener('click', () => restoreHabitById(habit.id));
            } else {
                archiveRestoreBtn.textContent = t('archiveButtonText');
                archiveRestoreBtn.addEventListener('click', () => archiveHabitById(habit.id));
            }
            actionsContainer.appendChild(archiveRestoreBtn);

            habitEl.appendChild(habitInfo);
            habitEl.appendChild(actionsContainer); // Append container of buttons
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
            progressBarsContainer.innerHTML = `<p>${t('noProgressYet')}</p>`;
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
            chartsGlobalErrorMessage.textContent = t('chartsCanvasUnavailable');
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
            chartsGlobalErrorMessage.textContent = t('noChartDataSpecific');
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
                    text: t('streakChartTitle') // Using translated title
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
                                    label += context.parsed + '% ' + t('consistencyRateLabelSuffix'); // e.g. "consistency" or "days performed"
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
    // UI Text Update Function
    //================================================================================
    /**
     * Updates all static UI text elements with translated strings.
     */
    function updateStaticUIText() {
        document.title = t('appTitle');
        // Header
        const headerTitleEl = document.querySelector('header h1');
        if (headerTitleEl) headerTitleEl.textContent = t('headerTitle');
        
        // Habit Form Section
        const addHabitSectionTitleEl = document.querySelector('#habit-form-section h2');
        if (addHabitSectionTitleEl) addHabitSectionTitleEl.textContent = t('addHabitSectionTitle');
        
        const habitNameLabelEl = document.querySelector('label[for="habit-name"]');
        if (habitNameLabelEl) habitNameLabelEl.textContent = t('habitNameLabel');
        
        const habitFrequencyLabelEl = document.querySelector('label[for="habit-frequency"]');
        if (habitFrequencyLabelEl) habitFrequencyLabelEl.textContent = t('habitFrequencyLabel');
        
        const dailyFreqOption = document.querySelector('#habit-frequency option[value="daily"]');
        if (dailyFreqOption) dailyFreqOption.textContent = t('dailyFrequencyOption');
        const weeklyFreqOption = document.querySelector('#habit-frequency option[value="weekly"]');
        if (weeklyFreqOption) weeklyFreqOption.textContent = t('weeklyFrequencyOption');

        const targetValueLabelEl = document.querySelector('label[for="habit-target-value"]');
        if (targetValueLabelEl) targetValueLabelEl.textContent = t('targetValueLabel');
        
        const targetUnitLabelEl = document.querySelector('label[for="habit-target-unit"]');
        if (targetUnitLabelEl) targetUnitLabelEl.textContent = t('targetUnitLabel');

        const addHabitButtonEl = document.querySelector('#habit-form input[type="submit"]');
        if (addHabitButtonEl) addHabitButtonEl.value = t('addHabitButton');

        // My Habits Section
        const myHabitsSectionTitleEl = document.querySelector('#habits-list-section h2');
        if (myHabitsSectionTitleEl) myHabitsSectionTitleEl.textContent = t('myHabitsSectionTitle');
        // Note: noHabitsYet is handled in renderHabits

        // Calendar Section
        const calendarSectionTitleEl = document.querySelector('#calendar-section h2');
        if (calendarSectionTitleEl) calendarSectionTitleEl.textContent = t('calendarSectionTitle');
        if (prevMonthBtn) prevMonthBtn.textContent = t('prevMonthButton'); // prevMonthBtn is already a DOM ref
        if (nextMonthBtn) nextMonthBtn.textContent = t('nextMonthButton'); // nextMonthBtn is already a DOM ref

        // Progress Section
        const progressSectionTitleEl = document.querySelector('#progress-section h2');
        if (progressSectionTitleEl) progressSectionTitleEl.textContent = t('progressSectionTitle');
        // Note: noProgressYet is handled in renderProgressBars

        // Charts Section
        const chartsSectionTitleEl = document.querySelector('#charts-container h2'); // h2 is inside charts-container
        if (chartsSectionTitleEl) chartsSectionTitleEl.textContent = t('chartsSectionTitle');
        
        const streakChartTitleEl = document.querySelector('#streak-chart-wrapper h3');
        if (streakChartTitleEl) streakChartTitleEl.textContent = t('streakChartTitle');
        
        const completionRateChartTitleEl = document.querySelector('#completion-rate-chart-wrapper h3');
        if (completionRateChartTitleEl) completionRateChartTitleEl.textContent = t('completionRateChartTitle');
        // Note: noChartData messages are handled in renderCharts

        // Footer
        const footerTextEl = document.querySelector('footer p');
        if (footerTextEl) footerTextEl.textContent = t('footerText');
        if (clearAllDataBtn) clearAllDataBtn.textContent = t('clearAllDataButton'); // clearAllDataBtn is already a DOM ref

        // Reminder Button
        if (requestPermissionBtn) { // requestPermissionBtn is already a DOM ref
             // Default text set in handleNotificationPermission, but an initial set might be good
             // if the button is visible by default before JS fully processes permissions.
            if (Notification.permission === 'default') {
                 requestPermissionBtn.textContent = t('enableRemindersButton');
            }
        }
        // Toggle Archived View Button
        if (toggleArchivedViewBtn) {
            toggleArchivedViewBtn.textContent = showingArchived ? t('toggleArchivedViewButtonViewActive') : t('toggleArchivedViewButtonViewArchived');
        }
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
        
        // Ensure completions object and the entry for the current date are initialized
        if (!currentHabit.completions) {
            currentHabit.completions = {};
        }
        if (!currentHabit.completions[currentDate]) {
            currentHabit.completions[currentDate] = { count: 0, totalValue: 0 };
        }

        if (currentHabit.targetUnit === 'times') {
            currentHabit.completions[currentDate].count += 1;
            currentHabit.completions[currentDate].totalValue += 1; // Each "time" contributes 1 to total value
            console.log(`Habit "${currentHabit.name}" marked complete. Today's count: ${currentHabit.completions[currentDate].count}`);
        } else {
            const unitToLog = currentHabit.targetUnit || 'value';
            const promptMessage = t('promptLogValue', { unit: unitToLog, habitName: currentHabit.name });
            const loggedAmountStr = prompt(promptMessage);

            if (loggedAmountStr === null) { // User cancelled
                return; 
            }

            const loggedAmount = parseFloat(loggedAmountStr);
            if (isNaN(loggedAmount) || loggedAmount <= 0) {
                alert(t('alertInvalidProgressValue'));
                return;
            }

            currentHabit.completions[currentDate].count += 1; // Increment count of log entries
            currentHabit.completions[currentDate].totalValue += loggedAmount; // Add logged amount to total value
            console.log(`Logged ${loggedAmount} ${unitToLog} for "${currentHabit.name}". Today's total: ${currentHabit.completions[currentDate].totalValue} ${unitToLog}, Entries: ${currentHabit.completions[currentDate].count}`);
        }
            
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
            console.log('Notification permission denied.'); // Developer log
            requestPermissionBtn.textContent = t('remindersPermissionDenied');
            requestPermissionBtn.disabled = true;
        } else { // 'default'
            // console.log('Notification permission not yet requested.');
            requestPermissionBtn.textContent = t('enableRemindersButton');
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

            const targetValue = parseInt(targetValueInputEl.value, 10) || 1;
            const targetUnit = targetUnitInputEl.value || TARGET_UNITS[0];

            const newHabit = {
                id: Date.now(),
                name: habitName, 
                frequency: habitFrequency,
                creationDate: new Date().toISOString(),
                targetValue: targetValue,
                targetUnit: targetUnit,
                completions: {},
                isArchived: false // New habits are active by default
            };
            habits.push(newHabit);
            // console.log('New habit added:', newHabit);
            
            saveHabits();
            renderAll();
            habitNameInput.value = ''; // Clear input field
            targetValueInputEl.value = '1'; // Reset to default
            targetUnitInputEl.value = TARGET_UNITS[0]; // Reset to default
        });
    } else {
        console.error("Habit form element not found!");
    }

    // Populate Target Unit Dropdown
    if (targetUnitInputEl) {
        TARGET_UNITS.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit.charAt(0).toUpperCase() + unit.slice(1); // Capitalize for display
            targetUnitInputEl.appendChild(option);
        });
    } else {
        console.warn("Target unit input element not found during dropdown population.");
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
            console.log("This browser does not support desktop notification"); // Developer log
        if (requestPermissionBtn) {
                requestPermissionBtn.textContent = t('remindersNotSupported');
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
                                new Notification(t('remindersEnabledMessage'), { body: t('remindersEnabledMessage') }); // Title and body can be same or different
                        }
                    });
                } else if (Notification.permission === 'denied') {
                        alert(t('remindersDeniedUserMessage'));
                }
            });
        }
    }

    //================================================================================
    // Initial Application Setup
    //================================================================================
    loadHabits();
    updateStaticUIText(); // Call to set initial static text
    renderAll(); // Initial render of all UI components
    
    // Trigger reminders after a delay (e.g., 10 seconds after page load)
    // This is a simple timeout; a real app might use a more sophisticated scheduling mechanism or service worker.
    setTimeout(checkAndSendReminders, 10000); 

    // Event Listener for Toggle Archived View Button
    if (toggleArchivedViewBtn) {
        toggleArchivedViewBtn.addEventListener('click', () => {
            showingArchived = !showingArchived;
            // Update button text immediately
            toggleArchivedViewBtn.textContent = showingArchived ? t('toggleArchivedViewButtonViewActive') : t('toggleArchivedViewButtonViewArchived');
            renderHabits(); // Re-render the habit list only
            // Note: We might want to update other sections (like charts/progress) if they should also respect this filter.
            // For now, only habit list is affected as per subtask focus.
            // If renderAll() is called, ensure it respects 'showingArchived' or that charts/progress show all data.
        });
    } else {
        console.warn("Toggle Archived View button not found!");
    }

    //================================================================================
    // Habit Archiving Functions
    //================================================================================

    /**
     * Marks a habit as archived.
     * @param {number} habitId - The ID of the habit to archive.
     */
    function archiveHabitById(habitId) {
        const habitIndex = habits.findIndex(h => h.id === habitId);
        if (habitIndex > -1) {
            habits[habitIndex].isArchived = true;
            saveHabits();
            renderAll(); // Re-render to reflect changes (e.g., habit might disappear from active list)
            console.log(`Habit with ID ${habitId} archived.`);
        } else {
            console.error(`Attempted to archive non-existent habit with ID ${habitId}.`);
        }
    }

    /**
     * Marks an archived habit as active (restores it).
     * @param {number} habitId - The ID of the habit to restore.
     */
    function restoreHabitById(habitId) {
        const habitIndex = habits.findIndex(h => h.id === habitId);
        if (habitIndex > -1) {
            habits[habitIndex].isArchived = false;
            saveHabits();
            renderAll(); // Re-render to reflect changes
            console.log(`Habit with ID ${habitId} restored.`);
        } else {
            console.error(`Attempted to restore non-existent habit with ID ${habitId}.`);
        }
    }

    // Example Usage (for testing - can be removed or tied to UI later):
    // window.archiveHabit = archiveHabitById;
    // window.restoreHabit = restoreHabitById;

    // Event Listener for Clear All Data Button
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', () => {
            if (confirm(t('confirmClearAllData'))) {
                habits = []; // Reset the global habits array
                localStorage.removeItem('habits'); // Clear from LocalStorage
                console.log('All habit data cleared.'); // Developer log
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
