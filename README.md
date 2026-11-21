# Team23_Story — My Learning Portfolio

CS100 POWER UP! project by Team 23.
A web application that allows users to create personal profiles, add portfolio items, and display their learning experiences and achievements as cards.

## Features
- Create multiple profiles with display name, interests, experiences, and things users are curious about
- Add portfolio items linked to a specific profile
- Include portfolio item details such as title, type, date, role, description, skills, reflection, and evidence link
- Display portfolio items as cards under the selected profile
- Validate user inputs to prevent empty or space-only fields
- Validate evidence links to ensure they use HTTP or HTTPS
- Save and retrieve portfolio data through the server
- Responsive layout with Bootstrap 5

## How to run
1. Clone the repo: " git clone https://github.com/tatpitchanet-stack/Team23_Story.git "
2. Open the project folder: " cd Team23_Story "
3. Start the PHP development server from the project directory: " php -S localhost:3000 -t public "
4. Open the application in your browser: " http://localhost:3000 "

## How to test
1. Create a profile and confirm that it appears on the page.
2. Add a portfolio item to the profile and confirm that it appears under the correct profile.
3. Check that the portfolio item displays its title, type, date, role, description, skills, reflection, and evidence link correctly.
4. Refresh the page and confirm that the profile and portfolio item are still available.
5. Test the application using the deployed AWS EC2 URL to confirm that data is saved and retrieved from the server.
6. Export a Portfolio Item as JSON and copy the JSON.
7. Import the JSON into another profile using the textarea.
8. Confirm that the imported item is linked to the correct profile and includes its reflection and evidence.
9. Try submitting empty fields, space-only fields, invalid evidence links, or invalid JSON and confirm that appropriate error messages are displayed.

## Data Storage
- Portfolio data is stored on the server using JSON files
- The application uses PHP to process requests and manage portfolio data
- Data can be retrieved from the server when users access or refresh the application
- Portfolio data is not stored only in the browser's localStorage

## Portfolio Item JSON Exchange
- Users can export a Portfolio Item as JSON
- Users can copy the JSON and share it with students from other groups
- Students can import the received JSON through a textarea
- Imported portfolio items can be saved to the server and linked to the user's own profile
- The existing Portfolio Item data structure from Checkpoint is maintained

## Deployment

- The application is deployed on an AWS EC2 server
- Portfolio data must be saved and retrieved through the deployed server
- Use the deployed application URL during the Final Demo to demonstrate server-side data persistence

## Files
- `public/index.html` – Main page structure and portfolio forms
- `public/app.js` – Handles user interactions, form submissions, validation, and displaying profiles and portfolio items
- `public/api.js` – Handles communication between the frontend and PHP API
- `public/css/style.css` – Custom styling and responsive layout
- `public/api/profiles.php` – API for creating and retrieving profiles
- `public/api/items.php` – API for creating and retrieving portfolio items
- `src/validate.php` – Handles server-side input validation
- `src/helpers.php` – Contains helper functions for server-side operations
- `sample-portfolio-1.json`, `sample-portfolio-2.json` – Sample portfolio data in JSON format
- `README.md` – Project documentation and instructions

## Team
CS100 Team 23
