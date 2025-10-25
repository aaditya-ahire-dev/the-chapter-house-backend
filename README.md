
# The Chapter House - Backend

This is the backend for "The Chapter House," an E-bookstore. It's built with Node.js and Express.js, providing a robust set of features for managing users, books, and payments.


## Features

* **Hybrid User Authentication:** Manages user sign-up and sign-in using **Firebase Authentication**, while storing user profile data and application-specific details in **MongoDB**.
* **JWT Session Management:** Uses JSON Web Tokens (**JWT**) stored in secure cookies for managing user sessions after login.
* **Detailed Book Management:**
    * Full CRUD (Create, Read, Update, Delete) operations for books.
    * Retrieve specific books by ID.
    * Allows users to rate books.
    * Tracks user-specific book status (e.g., reading, downloaded).
* **Payment Integration:** Securely processes payments using **Razorpay**.
* **Cloud Storage:** Handles image and file uploads using **Cloudinary**.
* **Caching:** Improves performance using **Redis** for caching frequently accessed data.
* **Authorization:** Implements role-based access control (User and Admin).
* **Containerized:** Fully containerized using **Docker** and **Docker Compose** for easy setup and deployment. 🐳
## Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Upstack Redis
- **Authentication**: JWT, Firebase Admin
- **File Storage**: Cloudinary
- **Payment Gateway**: Razorpay
- **Other Tools**: 
  - cors (Cross-Origin Resource Sharing)
- **🐳 Docker Support**
  - The application includes Docker support.



## Installation & Setup ⚙️

There are two main ways to run this project: using the pre-built Docker image (quickest for just running the app) or cloning the repository (best for development and running the full stack locally).

***

### Option 1: Running the Pre-built Docker Image

This method pulls the application image from Docker Hub and runs it. You will need to provide your own running instances of MongoDB and Redis and configure the environment variables accordingly.

1.  **Prerequisites:**
    * [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    * Running instances of MongoDB and Redis accessible from your Docker environment.

2.  **Pull the Image:** 
    ```bash
    docker pull aaditya0001/the-chapter-house:1.0
    ```

3.  **Prepare Environment Variables:**
    * Create an environment file (e.g., `.env`) containing **only** the variables needed by the Node.js application itself (refer to `.env.example`, but **exclude** `DOCKER_MONGO_*` and `MONGO_EXPRESS_*` variables).
    * Make sure `MONGODB_URL` and `REDIS_URL` point to your running database instances.

4.  **Run the Container:**
    ```bash
    docker run -d --env-file ./.env -p 8000:8000 --name chapter-house-app aaditya0001/the-chapter-house:1.0
    ```
    * `--env-file ./.env`: Loads all variables from your environment file.
    * `-p 8000:8000`: Maps your host port 8000 to the container's port 8000.
    * `--name chapter-house-app`: Gives the running container a convenient name.

    Your API will be available at `http://localhost:8000`.

5.  **To Stop the Container:**
    ```bash
    docker stop chapter-house-app
    docker rm chapter-house-app
    ```

***

### Option 2: Running Locally via Repository Clone (Recommended for Development)

This method involves cloning the repository and uses Docker Compose to build the application image and run it alongside the required database services (MongoDB and Redis).

1.  **Prerequisites:**
    * [Node.js](https://nodejs.org/) (v20 or higher recommended, needed for `npm install` before build)
    * [npm](https://www.npmjs.com/)
    * [Git](https://git-scm.com/)
    * [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/aaditya-ahire-dev/the-chapter-house-backend.git](https://github.com/aaditya-ahire-dev/the-chapter-house-backend.git)
    cd the-chapter-house-backend
    ```

3.  **Install Dependencies:** (Needed for the initial Docker build process)
    ```bash
    npm install
    ```

4.  **Set Up Environment Variables:**
    * Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    * Open the new `.env` file and fill in all required secrets and configuration values (database credentials, API keys, JWT secret, etc.). Refer to `.env.example` for the complete list needed by the app and Docker Compose services.

5.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```

    * Your API will be available at `http://localhost:8000` (or the `PORT` specified in `.env`).
    * Mongo Express GUI: `http://localhost:8081`
    * RedisInsight GUI: `http://localhost:8002` (or the port you mapped)

6.  **To Stop the Services:**
    ```bash
    docker-compose down
    ```
    
## API Reference

### Authentication Routes (`/auth`)

---

#### `POST /auth/login`

**Description:** Logs in a regular user using a Firebase ID token. Verifies the token, finds the corresponding user in MongoDB (checking cache first), creates a session cookie, and sets it in the response.

* **Body:** Requires a JSON object with `idToken` (string, Firebase ID Token).
* **Authentication:** Not required.

---

#### `POST /auth/signup`

**Description:** Creates a new user profile in MongoDB after successful Firebase signup. Uses the Firebase ID token to get the UID and email, and requires the user's name. Sets a custom claim `role: "user"` in Firebase.

* **Body:** Requires a JSON object with `idToken` (string, Firebase ID Token) and `name` (string).
* **Authentication:** Not required.

---

#### `POST /auth/admin/login`

**Description:** Logs in an admin user using a Firebase ID token. Verifies the token, finds the user in MongoDB (checking cache first), confirms their role is "admin", creates a session cookie, and sets it in the response.

* **Body:** Requires a JSON object with `idToken` (string, Firebase ID Token).
* **Authentication:** Not required.

---

#### `POST /auth/admin/signup`

**Description:** Creates a new admin user profile in MongoDB. Uses the Firebase ID token, requires the admin's name, and validates a secret key (`ADMIN_VERIFY_SECRET_KEY` environment variable). Sets a custom claim `role: "admin"` in Firebase. If the secret key is invalid, the Firebase user is deleted.

* **Body:** Requires a JSON object with `idToken` (string, Firebase ID Token), `name` (string), and `secretKey` (string).
* **Authentication:** Not required.

---

#### `POST /auth/create-profile` (Needs Clarification)

**Description:** *(Controller logic needed to provide an accurate description).*

* **Body:** Requires a JSON object with `...` (Details needed).
* **Authentication:** *(Likely not required, depends on logic).*

---

#### `POST /auth/signOut`

**Description:** Logs the current user out by clearing the session cookie.

* **Body:** None required.
* **Authentication:** **Required**. A valid session cookie must be sent.

---

### User Routes (`/api/user`)

**Note:** Routes marked as requiring authentication expect a valid session cookie.

---

#### `GET /api/user/getallusers`

**Description:** Retrieves a list of all users with the role "user". Checks Redis cache first (`accounts:allUsers`) before querying MongoDB.

* **Authentication:** **Required** *(Implied by common practice, verify if `checkAuth` middleware is applied)*.

---

#### `GET /api/user/getalladmins`

**Description:** Retrieves a list of all users with the role "admin". Checks Redis cache first (`accounts:allAdmins`) before querying MongoDB.

* **Authentication:** **Required** *(Implied by common practice, verify if `checkAuth` middleware is applied)*.

---

#### `GET /api/user/getuserbyid/:id`

**Description:** Retrieves a specific user by their MongoDB `_id`. Checks Redis cache first (`user:Id:<userId>`) before querying MongoDB.

* **URL Parameter:** Requires the user's `id` (string) in the path.
* **Authentication:** **Required** *(Implied by common practice, verify if `checkAuth` middleware is applied)*.

---

#### `PUT /api/user/update/book-status`

**Description:** Updates the `bookStatus` for a specific book entry within the logged-in user's `buyedBooks` array. Invalidates relevant user book caches in Redis.

* **Body:** Requires a JSON object with `buyedBookEntryId` (string, the `_id` of the entry in the `buyedBooks` array) and `newStatus` (string, e.g., "reading", "downloaded").
* **Authentication:** **Required**. Uses the logged-in user's ID from the session.

---

#### `PUT /api/user/update/:id`

**Description:** Updates the `name` and/or `email` of a specific user identified by their MongoDB `_id`. Invalidates relevant user caches in Redis and clears the user's session cookie, forcing them to log in again.

* **URL Parameter:** Requires the user's `id` (string) in the path.
* **Body:** Requires a JSON object with optional `name` (string) and/or `email` (string).
* **Authentication:** **Required** *(Implied by cookie clearing and common practice, verify if `checkAuth` middleware is applied)*.

---

#### `DELETE /api/user/delete/:id`

**Description:** Deletes a specific user identified by their MongoDB `_id`. Invalidates relevant user caches in Redis.

* **URL Parameter:** Requires the user's `id` (string) in the path.
* **Authentication:** **Required** *(Implied by common practice, verify if `checkAuth` middleware is applied)*.

---

### Book Routes (`/api/book`)

**Note:** Routes marked as requiring authentication expect a valid session cookie. Authentication requirements for admin-specific actions like uploading, updating, and deleting books should be verified in the middleware implementation.

---

#### `GET /api/book/getbooks`

**Description:** Retrieves a list of all available books. Checks Redis cache first (`allbooks`) before querying MongoDB.

* **Authentication:** Not required.

---

#### `GET /api/book/getbooks/:id`

**Description:** Retrieves details for a specific book by its MongoDB `_id`. Checks Redis cache first (`book:<bookId>`) before querying MongoDB.

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** Not required.

---

#### `GET /api/book/buybook/:id`

**Description:** Adds a specified book (by its `_id`) to the logged-in user's `buyedBooks` array in MongoDB. Invalidates the user's owned books cache (`userOwnedBooks:<userEmail>`) in Redis. *(Note: This route indicates purchase intent or adding to library; actual payment verification likely happens via `/api/payment` routes).*

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** **Required**.

---

#### `GET /api/book/buybookbyid/:id`

**Description:** Retrieves the details of a specific book *entry* from the logged-in user's `buyedBooks` array, using the entry's unique `_id`. Includes the user-specific `bookStatus`. Checks Redis cache first (`userBoughtBookById:<userEmail>-<entryId>`) before querying and populating from MongoDB. Returns `null` data if the underlying book has been deleted.

* **URL Parameter:** Requires the `id` (string) of the entry within the `buyedBooks` array.
* **Authentication:** **Required**.

---

#### `GET /api/book/usersallbook`

**Description:** Retrieves the list of all books (populated with details) owned by the logged-in user from their `buyedBooks` array. Checks Redis cache first (`userOwnedBooks:<userEmail>`) before querying MongoDB.

* **Authentication:** **Required**.

---

#### `GET /api/book/getrating/:id`

**Description:** Retrieves the rating (if any) given by the logged-in user for a specific book. Checks Redis cache first (`rating:<userEmail>-<bookId>`). Returns a rating object with `{ rating: 0 }` if the user hasn't rated the book yet.

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** **Required**.

---

#### `GET /api/book/downloadbook/:id`

**Description:** Streams the file content (e.g., PDF) of a specific book for download. Fetches the `fileUrl` from the book document and pipes the content stream to the response with appropriate download headers.

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** **Required**.

---

#### `GET /api/book/getlength`

**Description:** Retrieves the total count of registered users and the total count of books in the database. Checks Redis cache first (`length:usersLength`, `length:booksLength`).

* **Authentication:** **Required**.

---

#### `POST /api/book/uploadbook`

**Description:** Creates a new book entry. Requires book metadata in the request body (form-data) and uploads `coverImage` and `fileUrl` files to Cloudinary. Invalidates the `allbooks` cache in Redis.

* **Body (multipart/form-data):** Requires book details (`title`, `author`, `description`, `price`, `category`, `publisher`, `publishedYear`, `language`, `format`).
* **Files:** Requires `coverImage` (image file) and `fileUrl` (book file, e.g., PDF) fields.
* **Authentication:** **Required** *(Likely requires Admin role; verify middleware)*.

---

#### `PUT /api/book/updatebook/:id`

**Description:** Updates an existing book's details by its MongoDB `_id`. Can optionally include new `coverImage` and/or `fileUrl` files for upload, replacing existing ones. Invalidates relevant book caches (`book:<bookId>`, `allbooks`) in Redis. Uses `multipart/form-data` if files are included.

* **URL Parameter:** Requires the book's `id` (string).
* **Body (multipart/form-data):** Requires updated book details (any fields from the book schema).
* **Files:** Optional `coverImage` (image file) and `fileUrl` (book file, e.g., PDF) fields.
* **Authentication:** **Required** *(Likely requires Admin role; verify middleware)*.

---

#### `POST /api/book/ratebook/:id`

**Description:** Allows the logged-in user to add or update their rating for a specific book. Updates the book's overall average rating (`avrrating`). Invalidates multiple caches in Redis (rating cache, specific book cache, all books cache, and potentially user book caches).

* **URL Parameter:** Requires the book's `id` (string).
* **Body:** Requires `rating` (number).
* **Authentication:** **Required**.

---

#### `DELETE /api/book/deletebook/:id`

**Description:** Deletes a specific book by its MongoDB `_id`. Invalidates multiple caches in Redis (specific book cache, all books cache, book count cache, and relevant user-owned book caches via `deleteFolders`).

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** **Required** *(Likely requires Admin role; verify middleware)*.

---

### Payment Routes (`/api/payment`)

**Note:** Both routes require authentication (a valid session cookie).

---

#### `GET /api/payment/oderPayment/:id`

**Description:** Creates a Razorpay order necessary for initiating the payment process for a specific book. It retrieves the book's price using the provided book `id`, calculates the amount in the smallest currency unit (e.g., paise for INR), and uses the Razorpay SDK to generate an order ID and other details required by the frontend payment integration. Returns the created order object.

* **URL Parameter:** Requires the book's `id` (string).
* **Authentication:** **Required**.

---

#### `POST /api/payment/verify-order-payment`

**Description:** Verifies the outcome of a Razorpay payment after the user completes the transaction on the frontend. It uses the `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` provided by the client, along with the `RAZORPAY_KEY_SECRET`, to generate a signature and confirm the payment's authenticity. If verification is successful, it adds the corresponding `bookId` to the logged-in user's `buyedBooks` array in MongoDB.

* **Body:** Requires a JSON object `orderData` containing `bookId` (string), `razorpay_order_id` (string), `razorpay_payment_id` (string), and `razorpay_signature` (string).
* **Authentication:** **Required**.

---## License 📜

This project is licensed under the **MIT License**. See the [MIT](https://choosealicense.com/licenses/mit/) file for details.
