# Personalized Habit Tracker

A client-side web application designed to help users define, track, and maintain their daily and weekly habits. This application leverages LocalStorage for data persistence, allowing users to retain their information without needing a backend. It provides visual feedback through progress bars, a completion calendar, and insightful analysis charts.

## Features

*   **Habit Management:** Add new habits with options for daily or weekly frequency. Multiple habits with the same name can be added and are tracked individually but aggregated in statistical views.
*   **Flexible Targets:** Define targets for habits, including:
    *   Simple completion counts (e.g., "Exercise 3 times" - set target value, unit "times").
    *   Quantitative goals (e.g., "Read 100 pages", "Run 5 km", "Meditate for 30 minutes").
*   **Count-Based & Quantitative Completion Tracking:**
    *   For "times" based habits, each click increments a daily completion count.
    *   For quantitative habits (e.g., hours, km, pages), users are prompted to enter the amount of progress. Multiple entries per day are summed.
*   **Habit Archiving:** Archive habits you're not currently focusing on to keep your active list clean, without losing their history. View and restore archived habits separately.
*   **Data Persistence:** All habit data is saved in the browser's LocalStorage.
*   **Calendar View:** Visualize habit completion history. Days where a habit was performed at least once (or progress was logged) are highlighted.
*   **Calendar Navigation:** Navigate through different months.
*   **Progress Bars:** Track current progress:
    *   Daily habits show logged progress against their defined target value and unit (e.g., "15/30 minutes" or "2/3 times").
    *   Weekly habits show the number of days in the current week the habit was performed at least once.
*   **Data Analysis Charts (Aggregated by Habit Name for Active Habits):**
    *   **Max Daily Completions/Value (Bar Chart):** Displays **Max Daily Completions/Value** for each **active, aggregated habit type**.
    *   **Consistency Rate (Pie Chart):** Shows **Consistency Rate** (percentage of days performed since creation) for each **active, aggregated habit type**.
*   **Reminder Notifications:** Basic browser notifications for incomplete daily habits (permission-based, checks against target value).
*   **Responsive Design:** User-friendly interface across various screen sizes.
*   **Clear All Records:** Option to clear all habit data with confirmation.
*   **Multi-language Ready:** Core UI strings have been abstracted for future translation (currently English only).

## How to Use / Getting Started (Web Version)

This section describes how to run the application directly in a web browser. For running as a desktop application, see the "Running as a Desktop Application (Electron)" section below.

1.  **Clone the Repository (or Download Files):**
    If you have Git installed, you can clone the repository:
    ```bash
    # Replace with the actual URL if this project is hosted on Git
    # git clone https://github.com/your-username/personalized-habit-tracker.git
    # cd personalized-habit-tracker 
    ```
    Alternatively, download the project files (`index.html`, `style.css`, `script.js`) into a single folder on your computer.

2.  **Open in Browser:**
    Navigate to the project folder where you saved/cloned the files and open the `index.html` file in your preferred web browser (e.g., Chrome, Firefox, Safari, Edge).

    No build steps or special dependencies are required as this is a vanilla HTML, CSS, and JavaScript project. Chart.js is included via a CDN.

3.  **Using the Tracker:**
    *   **Adding Habits:** Use the form to add habits. Specify the name, frequency (daily/weekly), target value (e.g., "30"), and target unit (e.g., "minutes", "times").
    *   **Logging Progress:**
        *   For habits with unit "times", click the "Mark Complete" button to increment the count for the day. The button will show "Completed (X)".
        *   For habits with other units (e.g., "hours", "km"), click the "Log [Unit]" button (e.g., "Log Hours"). A prompt will ask you to enter the amount of progress.
    *   **Viewing Habits:** The main list shows active habits. Use the "View Archived" button (next to "My Habits" title) to toggle between active and archived habits.
    *   **Archiving/Restoring:** In the active habits list, an "Archive" button appears for each habit. In the archived view, a "Restore" button appears.
    *   **Other Features:** Explore your progress via the calendar, progress bars, and charts. Use "Clear All Records" in the footer to reset data (with confirmation). Enable reminders if desired.

## Screenshots

*(Placeholder: Screenshots would ideally be placed here to provide a visual overview of the application. For example:*

*   *Main dashboard showing the habit list (with completion counts/values and target units) and the form to add new habits (including target value and unit fields).*
*   *Prompt dialog for logging quantitative progress (e.g., "Log minutes for 'Meditate':").*
*   *Calendar view with completed days highlighted.*
*   *Progress bars section displaying progress against targets (e.g., "15/30 minutes" or "2/3 times").*
*   *Charts section showing "Max Daily Completions/Value" and "Consistency Rate".*
*   *Archived habits view.)*

## Technology Stack

*   **HTML5:** For the structure and semantic markup of the application.
*   **CSS3:** For styling the application, utilizing modern features such as:
    *   CSS Custom Properties (Variables) for theming.
    *   Flexbox and Grid for layout.
    *   Responsive design techniques (media queries).
*   **JavaScript (ES6+):** For all client-side logic, DOM manipulation, event handling, and interactivity.
*   **Chart.js:** A JavaScript charting library used via a CDN to render data analysis charts.
*   **Browser LocalStorage API:** For client-side storage of habit data, enabling persistence across sessions.
*   **Browser Notification API:** For displaying reminder notifications.
*   **Electron (for Desktop Version):** Used to wrap the web application into a cross-platform desktop application.
    *   **Electron Builder:** Used for packaging the Electron application into distributable formats.

## Running as a Desktop Application (Electron)

This section explains how to set up and run the Personalized Habit Tracker as a desktop application using Electron.

### Prerequisites

*   **Node.js (which includes npm)** installed on your system. You can download it from [https://nodejs.org/](https://nodejs.org/).
*   **(Optional but Recommended for Packaging) Yarn:** While npm works, `electron-builder` often has smoother integration with Yarn for some users. `npm install -g yarn`.

### Setup & Running in Development Mode

1.  **Clone the repository (if you haven't already):**
    ```bash
    # Replace <repository-url> with the actual URL of this project
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:** This will download Electron and other necessary packages defined in `package.json`.
    ```bash
    npm install
    ```
    *(Or, if you prefer Yarn: `yarn install`)*

3.  **Run the application:**
    ```bash
    npm start
    ```
    *(Or, if you prefer Yarn: `yarn start`)*

    This will launch the Habit Tracker in a desktop window.

### Building Distributable Packages (Optional)

To create distributable packages for your operating system (e.g., .exe for Windows, .app for macOS, .AppImage/.deb for Linux), you can use `electron-builder` (which was included in `devDependencies`).

**Example Commands:**

To build for your current OS:
```bash
npm run dist
```
*(Or `yarn dist`)*

This will create a `dist` folder containing the packaged application.

For more specific build targets (e.g., building for Windows from macOS), please refer to the `electron-builder` documentation.

**Note:** Building requires a correctly configured development environment for the target platform(s) (e.g., Xcode for macOS, specific toolchains for Linux, etc.).

## Known Issues

*   **Habit Progress Display:** The "Habit Progress" section currently displays a separate progress bar for each individual habit instance, rather than a single aggregated bar for habits with the same name. Additionally, it displays progress for all habits (both active and archived) instead of respecting the "View Archived" toggle. This is different from the "Habit Analysis" (Charts) section, which correctly aggregates by name and only shows active habits. A fix for this is pending due to technical limitations during development.

## Potential Future Improvements

*   **User Interface for Editing Habit Targets:** Allow users to modify `targetValue` and `targetUnit` for existing habits.
*   **Advanced Weekly Habits:** Allow tracking habits for specific days of the week (e.g., Mon, Wed, Fri) or a target number of times per week (e.g., "Exercise 3 times a week").
*   **Customizable Reminders:** More granular control over reminder timings, snooze options, and reminder sounds.
*   **Data Management:** Implement functionality for exporting and importing habit data (e.g., as JSON or CSV files).
*   **Enhanced Charts & Statistics:** Introduce more chart types (e.g., line charts for progress over time), date range filtering for analysis, or more detailed statistics (e.g., success rate per month). Option to exclude/include archived habits in statistics.
*   **Themes & UI Customization:** Offer different color themes or layout options for users to personalize their experience.
*   **Notes/Journaling:** Allow users to add brief notes or reflections to specific habit completions or days.
*   **Service Workers:** Implement for more reliable background notifications or basic offline capabilities.
*   **Accessibility (ARIA):** Conduct a thorough accessibility review and implement further ARIA attributes for improved screen reader support and keyboard navigation.
*   **Habit Ordering:** Allow users to reorder their active habits in the list.
*   **Local Chart.js:** Bundle Chart.js locally instead of relying on a CDN for better offline reliability in the desktop app.
*   **Full Multi-language Translation and Language Switcher:** Implement translations for other languages and add a UI element to switch languages.

---
*This README provides an overview of the Personalized Habit Tracker application, its features, and how to get started.*
