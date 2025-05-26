# Personalized Habit Tracker

A client-side web application designed to help users define, track, and maintain their daily and weekly habits. This application leverages LocalStorage for data persistence, allowing users to retain their information without needing a backend. It provides visual feedback through progress bars, a completion calendar, and insightful analysis charts.

## Features

*   **Habit Management:** Add new habits with options for daily or weekly frequency. Multiple habits with the same name can be added (e.g., for different times of day) and are tracked individually but aggregated in statistical views.
*   **Count-Based Completion Tracking:** Mark habits complete multiple times per day. Each click increments a daily completion count for the habit.
*   **Data Persistence:** All habit data is saved in the browser's LocalStorage, ensuring data remains available across sessions (no backend needed).
*   **Calendar View:** Visualize habit completion history on an interactive monthly calendar. Days where a habit was performed at least once are highlighted.
*   **Calendar Navigation:** Navigate through different months to review past activity.
*   **Progress Bars:** Track current progress for both daily and weekly habits.
    *   Daily habits show completion count against a target (default 1, e.g., "2/1 completions").
    *   Weekly habits show the number of days in the current week the habit was performed at least once (e.g., "3/7 days").
*   **Data Analysis Charts (Aggregated by Habit Name):**
    *   **Max Daily Completions (Bar Chart):** Displays the maximum number of times a habit (or all habits of the same name combined) was completed on any single day.
    *   **Consistency Rate (Pie Chart):** Shows the percentage of days a habit (or all habits of the same name combined) has been performed at least once since its creation date.
*   **Reminder Notifications:** Basic browser notifications to remind users of incomplete daily habits (permission-based, checks against target count).
*   **Responsive Design:** The interface is designed to be usable across various screen sizes, from desktops to mobile devices.
*   **User-Friendly Interface:** A clean and intuitive UI for ease of use.
*   **Clear All Records:** An option to clear all habit data from the application and browser storage, with a confirmation prompt.

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
    *   Add habits using the form. You can add multiple habits with the same name if you wish to track them as separate instances (e.g., "Drink Water" in the morning and "Drink Water" in the afternoon). Statistical views will aggregate data for habits with the same name.
    *   Click the "Mark Complete" button for a habit to record a completion. Each click increments the daily count for that habit. The button will update to show the number of completions for the day (e.g., "Completed (2)").
    *   Explore your progress via the calendar, progress bars, and charts.
    *   Use the "Clear All Records" button in the footer if you wish to reset all your data (a confirmation will be asked).

## Screenshots

*(Placeholder: Screenshots would ideally be placed here to provide a visual overview of the application. For example:*

*   *Main dashboard showing the habit list (with completion counts) and the form to add new habits.*
*   *Calendar view with completed days highlighted for a selected month.*
*   *Progress bars section displaying current completion status (e.g., "2/1 completions" or "3/7 days").*
*   *Charts section showing the "Max Daily Completions" bar chart and the "Consistency Rate" pie chart.)*

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


## Potential Future Improvements

*   **Customizable Target Counts:** Allow users to set a specific `targetCount` per day for each habit (e.g., "Drink Water 8 times a day").
*   **Advanced Weekly Habits:** Allow tracking habits for specific days of the week (e.g., Mon, Wed, Fri) or a target number of times per week (e.g., "Exercise 3 times a week").
*   **Customizable Reminders:** More granular control over reminder timings, snooze options, and reminder sounds.
*   **Data Management:** Implement functionality for exporting and importing habit data (e.g., as JSON or CSV files).
*   **Enhanced Charts & Statistics:** Introduce more chart types (e.g., line charts for progress over time), date range filtering for analysis, or more detailed statistics (e.g., success rate per month).
*   **Themes & UI Customization:** Offer different color themes or layout options for users to personalize their experience.
*   **Notes/Journaling:** Allow users to add brief notes or reflections to specific habit completions or days.
*   **Service Workers:** Implement for more reliable background notifications or basic offline capabilities.
*   **Accessibility (ARIA):** Conduct a thorough accessibility review and implement further ARIA attributes for improved screen reader support and keyboard navigation.
*   **Habit Archiving/Ordering:** Allow users to archive old habits or reorder their current habits.
*   **Local Chart.js:** Bundle Chart.js locally instead of relying on a CDN for better offline reliability in the desktop app.

---
*This README provides an overview of the Personalized Habit Tracker application, its features, and how to get started.*
