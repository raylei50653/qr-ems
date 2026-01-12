# API Documentation

## Authentication (`/api/v1/auth/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/token/` | Obtain JWT access and refresh pair (Login). |
| `POST` | `/token/refresh/` | Refresh access token using refresh token. |
| `POST` | `/register/` | Register a new user account. |
| `POST` | `/google/` | Login using Google OAuth2 ID Token. |

## Users (`/api/v1/users/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all users (Admin/Manager only typically). |
| `POST` | `/` | Create a new user. |
| `GET` | `/{id}/` | Retrieve user details. |
| `PUT/PATCH` | `/{id}/` | Update user details. |
| `DELETE` | `/{id}/` | Delete a user. |
| `GET` | `/me/` | Retrieve current authenticated user's details. |

## Equipment (`/api/v1/equipment/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List equipment with filtering options. |
| `POST` | `/` | Create new equipment (Manager+). |
| `GET` | `/{uuid}/` | Retrieve equipment details. |
| `PUT/PATCH` | `/{uuid}/` | Update equipment details. |
| `DELETE` | `/{uuid}/` | Delete equipment (Manager+). |
| `GET` | `/{uuid}/history/` | Get transaction history for specific equipment. |
| `GET` | `/{uuid}/qr/` | Generate QR Code image for the equipment. |
| `POST` | `/bulk-delete/` | Bulk delete equipment items (Manager+). |

**Query Parameters for List:**
*   `category`: Filter by category ID.
*   `status`: Filter by status (e.g., `AVAILABLE`, `BORROWED`).
*   `location`: Filter by location UUID (includes descendants).
*   `zone`, `cabinet`, `number`: Filter by specific storage coordinates.
*   `search`: Search by name or description.

## Categories (`/api/v1/categories/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all categories. |
| `POST` | `/` | Create a new category. |
| `GET` | `/{id}/` | Retrieve category details. |
| `PUT/PATCH` | `/{id}/` | Update category details. |
| `DELETE` | `/{id}/` | Delete a category. |

## Locations (`/api/v1/locations/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all locations (hierarchy flattened or filtered). |
| `POST` | `/` | Create a new location. |
| `GET` | `/{uuid}/` | Retrieve location details. |
| `PUT/PATCH` | `/{uuid}/` | Update location details. |
| `DELETE` | `/{uuid}/` | Delete a location. |

**Query Parameters for List:**
*   `parent`: Filter by parent UUID. Use `null` to get root locations.
*   `search`: Search by name or description.

## Transactions (`/api/v1/transactions/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all transactions. |
| `POST` | `/` | Create a generic transaction (rarely used directly). |
| `GET` | `/{id}/` | Retrieve transaction details. |
| `POST` | `/borrow/` | Borrow equipment (sets status to `BORROWED`). |
| `POST` | `/return-request/` | Request return of equipment (sets status to `PENDING_RETURN`). |
| `POST` | `/{id}/approve-return/`| Approve a return request (Manager+). |
| `POST` | `/{id}/reject-return/` | Reject a return request (Manager+). |

## Interactive Documentation

*   **Swagger UI:** `/api/schema/swagger-ui/`
*   **ReDoc:** `/api/schema/redoc/`
*   **OpenAPI Schema:** `/api/schema/`
