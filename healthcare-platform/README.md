# Remote Real-time Integrated Healthcare Platform

## Abstract

This project implements a remote healthcare platform designed to connect patients and healthcare providers. The application utilizes the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and **Socket.IO** to provide core functionalities. Key features include secure user authentication, appointment management (booking, review, cancellation), comprehensive medication tracking and adherence logging, and real-time chat communication between patients and doctors.

## Running the Project Locally

Follow these steps to get the project running on your local machine for development.

### Prerequisites

*   **Node.js** and **npm** (or Yarn) installed.
*   **MongoDB** installed and running locally on the default port (**27017**).

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/s3-mansour/Final_Year_project
    cd final_year_project/healthcare-platform
    ```
    

2.  **Install Root Dependencies:**
    This installs `concurrently` and any other dependencies listed in the root `package.json`.
    ```bash
    npm install
    # OR yarn install
    ```

3.  **Install Backend Dependencies:**
    Navigate into the `Backend` folder and install its dependencies.
    ```bash
    cd Backend
    npm install
    # OR yarn install
    ```

4.  **Configure Backend Environment Variables:**
    Create a `.env` file in the `Backend` folder based on the example and add your configuration.
    ```bash
    # While inside the Backend folder
    cp .env.example .env # If you have an example env file
    ```
    Edit the newly created `.env` file. At a minimum, you will need:
    ```env
    MONGO_URI=mongodb://localhost:27017/healthcareDB # Replace with your DB connection string
    JWT_SECRET=32ef9906c42da7d8b5105cba1dbf2550867220e38f7439c1d517dbf1363e951cff97e12c6ab8404b00872803df7be06397096e4d47bf4f5cd837cdac93f2c831

    PORT=5000 # Default backend port
   
    ```
    

5.  **Install Frontend Dependencies:**
    Navigate into the `frontend` folder and install its dependencies.
    ```bash
    cd ../frontend # Go back to root, then into frontend
    npm install
    # OR yarn install
    ```

6.  **Ensure MongoDB is Running:**
    Make sure your local MongoDB instance is started and listening on port 27017.

7.  **Start Both Servers:**
    Go back to the **root** directory of the project and run the development script.
    ```bash
    cd ../ # Ensure you are in the root healthcare-platform folder
    npm run dev
    # OR yarn dev
    ```
    This command uses `concurrently` to start both the backend server (using `nodemon` for hot-reloading) and the frontend React development server simultaneously.

### Accessing the Application

*   **Frontend:** Once both servers are running, open your web browser and navigate to `http://localhost:3000`.
*   **Backend API:** The backend API server is running on `http://localhost:5000`. API requests from the frontend will be automatically proxied to this address during development.

### Stopping the Application

*   To stop both servers, press **Ctrl + C** in the terminal window where `npm run dev` is running.

### Troubleshooting

*   If `npm install` fails, check your Node.js and npm/yarn versions and try running `npm install --force` (use with caution).
*   If the backend fails to connect to the database, ensure your local MongoDB is running and the `MONGO_URI` in `Backend/.env` is correct (`mongodb://localhost:27017/healthcareDB`).
*   If frontend API calls fail, check the browser console for errors (e.g., CORS issues - though the proxy should handle this locally) and verify the backend is running.

---