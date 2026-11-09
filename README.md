# Team23_Story — My Learning Portfolio

CS100 POWER UP! project by Team 23.
A web app where you create a profile, add portfolio items, and see them as cards.

## Features
- Create multiple profiles (display name, what I enjoy / have tried / am curious about)
- Add portfolio items linked to a profile (title, type, date, role, description, skills, reflection, evidence link)
- Input validation (no empty or space-only fields, evidence must be an http/https link)
- Data is saved in the browser (localStorage), so it stays after refresh
- Responsive layout with Bootstrap 5

## How to run
1. Clone the repo: `git clone https://github.com/tatpitchanet-stack/Team23_Story.git`
2. Open `index.html` in a browser (no server needed at this stage)

## How to test
1. Create a profile, then confirm it appears as a card
2. Add a portfolio item to that profile, then confirm it appears inside the same card
3. Refresh the page, and the data should still be there
4. Try submitting empty fields or an invalid evidence link, and you should see an error message

## localStorage keys
| Key | Content |
| --- | --- |
| `portfolio_profiles` | array of profiles |
| `portfolio_items` | array of portfolio items (`profileId` points to a profile `id`) |

## Files
- `index.html` – page structure and forms
- `css/style.css` – styling
- `app.js` – saving, validation and displaying data
- `sample-portfolio-1.json`, `sample-portfolio-2.json` – sample data using the JSON contract

## Team
CS100 Team 23
