# Personalized Habit Tracker

A client-side web application designed to help users define, track, and maintain their daily and weekly habits. This application leverages LocalStorage for data persistence, allowing users to retain their information without needing a backend. It provides visual feedback through progress bars, a completion calendar, and insightful analysis charts.

## Features

*   **Habit Management:** Add new habits with options for daily or weekly frequency.
*   **Completion Tracking:** Easily mark habits as complete for the current day.
*   **Data Persistence:** All habit data is saved in the browser's LocalStorage, ensuring data remains available across sessions (no backend needed).
*   **Calendar View:** Visualize habit completion history on an interactive monthly calendar.
*   **Calendar Navigation:** Navigate through different months to review past activity.
*   **Progress Bars:** Track current progress for both daily and weekly habits.
    *   Daily habits show completion for the current day.
    *   Weekly habits show completion for the current week (Monday to Sunday).
*   **Data Analysis Charts:**
    *   **Longest Completion Streak:** A bar chart displaying the longest consecutive streak of completions for each habit.
    *   **Overall Completion Rate:** A pie chart showing the overall completion percentage for each habit since its creation.
*   **Reminder Notifications:** Basic browser notifications to remind users of incomplete daily habits (permission-based).
*   **Responsive Design:** The interface is designed to be usable across various screen sizes, from desktops to mobile devices.
*   **User-Friendly Interface:** A clean and intuitive UI for ease of use.

## How to Use / Getting Started

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

## Screenshots

*(Placeholder: Screenshots would ideally be placed here to provide a visual overview of the application. For example:*

*   *Main dashboard showing the habit list and the form to add new habits.*
*   *Calendar view with completed days highlighted for a selected month.*
*   *Progress bars section displaying current completion status.*
*   *Charts section showing the completion streak bar chart and the overall completion rate pie chart.)*

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

## Potential Future Improvements

*   **Advanced Weekly Habits:** Allow tracking habits for specific days of the week (e.g., Mon, Wed, Fri) or a target number of times per week (e.g., "Exercise 3 times a week").
*   **Customizable Reminders:** More granular control over reminder timings, snooze options, and reminder sounds.
*   **Data Management:** Implement functionality for exporting and importing habit data (e.g., as JSON or CSV files).
*   **Enhanced Charts & Statistics:** Introduce more chart types (e.g., line charts for progress over time), date range filtering for analysis, or more detailed statistics (e.g., success rate per month).
*   **Themes & UI Customization:** Offer different color themes or layout options for users to personalize their experience.
*   **Notes/Journaling:** Allow users to add brief notes or reflections to specific habit completions or days.
*   **Service Workers:** Implement for more reliable background notifications or basic offline capabilities.
*   **Accessibility (ARIA):** Conduct a thorough accessibility review and implement further ARIA attributes for improved screen reader support and keyboard navigation.
*   **Habit Archiving/Ordering:** Allow users to archive old habits or reorder their current habits.

---
*This README provides an overview of the Personalized Habit Tracker application, its features, and how to get started.*
