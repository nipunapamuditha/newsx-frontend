# NewsX Audio Dashboard

NewsX is a web application that allows users to log in, manage their news preferences, generate personalized audio summaries, and listen to them through an integrated audio player.

## Features

*   **Authentication:** Secure login and signup using Google OAuth ([`src/Login.tsx`](src/Login.tsx)).
*   **Profile Management:** Users can view their profile information and manage their news source preferences (e.g., Twitter usernames) to customize audio content ([`src/profile.tsx`](src/profile.tsx)).
*   **Audio Generation:** Generate audio summaries on-demand based on user preferences ([`src/dashboard.tsx`](src/dashboard.tsx)).
*   **Audio Playback:** A feature-rich audio player to listen to generated audio files with controls for play/pause, next/previous track, volume, and progress seeking ([`src/dashboard.tsx`](src/dashboard.tsx)).
*   **Playlist Management:** View a list of available audio files, select tracks, and delete unwanted audio files ([`src/dashboard.tsx`](src/dashboard.tsx)).
*   **Responsive Design:** The application is designed to work seamlessly across various devices and screen sizes.

## Tech Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **UI Library:** Material UI
*   **Routing:** React Router DOM
*   **HTTP Client:** Axios
*   **Authentication:** Google OAuth (`@react-oauth/google`)
*   **Styling:** CSS, Material UI `sx` prop, Emotion

## Project Structure

```
newsx_fe_native/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx           # Main application component with routing
│   ├── dashboard.tsx     # Dashboard page with audio player and generation
│   ├── index.css         # Global styles
│   ├── Login.tsx         # Login page component
│   ├── main.tsx          # Entry point of the React application
│   ├── navbar.tsx        # Navigation bar component (currently not used in App.tsx directly, dashboard and profile have their own nav)
│   ├── profile.tsx       # User profile page component
│   └── vite-env.d.ts
├── .eslintrc.cjs
├── index.html
├── Jenkinsfile           # Jenkins pipeline for CI/CD
├── newxlogo.png
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Prerequisites

*   Node.js (Version specified in [`Jenkinsfile`](Jenkinsfile), e.g., v22)
*   npm (comes with Node.js)

## Setup and Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd newsx-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Available Scripts

In the project directory, you can run the following commands:

*   **`npm run dev`**
    Runs the app in development mode. Open [http://localhost:5173](http://localhost:5173) (or the port Vite assigns) to view it in the browser. The page will reload if you make edits.

*   **`npm run build`**
    Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance. See the `build` script in [`package.json`](package.json).

*   **`npm run lint`**
    Lints the project files using ESLint. Configuration can be found in [`eslint.config.js`](eslint.config.js).

*   **`npm run preview`**
    Serves the production build locally from the `dist` folder. This is useful for testing the production build before deployment.

## API Endpoints

The application interacts with the following backend API endpoints (primarily hosted at `https://newsxapi.newsloop.xyz/v1/`):

*   `POST /signuporlogin`: User authentication ([`src/Login.tsx`](src/Login.tsx)).
*   `GET /getuser`: Fetches user profile data ([`src/profile.tsx`](src/profile.tsx)).
*   `POST /getTwUsernames`: Searches for Twitter usernames to add as preferences ([`src/profile.tsx`](src/profile.tsx)).
*   `GET /Get_Preferances`: Fetches existing user preferences ([`src/profile.tsx`](src/profile.tsx)).
*   `POST /publish-preferances`: Saves user preferences ([`src/profile.tsx`](src/profile.tsx)).
*   `GET /Generate_now`: Initiates audio generation (Server-Sent Events) ([`src/dashboard.tsx`](src/dashboard.tsx)).
*   `GET /getaudio_files`: Fetches the list of generated audio files ([`src/dashboard.tsx`](src/dashboard.tsx)).
*   `POST /delete_audiofile`: Deletes a specific audio file ([`src/dashboard.tsx`](src/dashboard.tsx)).

## Deployment

This project includes a [`Jenkinsfile`](Jenkinsfile) for continuous integration and deployment, targeting a server environment. The build process involves installing Node.js, dependencies, building the Vite project, and deploying the `dist` folder.