# Inventory App Design Document - Part 5: API Design

## 5. API Design

### Overview
This section documents the RESTful API endpoints for the Inventory App, providing a clear interface for web and mobile clients to interact with the backend. The API is designed to support CRUD operations on inventory items.

### Base URL: `/api/items`

| Method | Endpoint   | Description     | Request Body                                    | Response Body | Status Codes       |
|--------|------------|-----------------|-------------------------------------------------|---------------|--------------------|
| GET    | `/`        | List all items  | N/A                                             | `[Item]`      | 200, 500           |
| GET    | `/:id`     | Get item by ID  | N/A                                             | `Item`        | 200, 404, 500      |
| POST   | `/`        | Create new item | `{ name, quantity, location?, description? }`   | `Item`        | 201, 400, 500      |
| PUT    | `/:id`     | Update an item  | `{ name?, quantity?, location?, description? }` | `Item`        | 200, 400, 404, 500 |
| DELETE | `/:id`     | Delete an item  | N/A                                             | N/A           | 204, 404, 500      |

### Example Requests and Responses

#### GET /api/items
- **Request**: `GET /api/items`
- **Response** (200):
  ```json
  [
    {
      "_id": "12345",
      "name": "Laptop",
      "quantity": 10,
      "location": "Warehouse A",
      "description": "Dell XPS 13",
      "createdAt": "2025-05-22T15:00:00Z",
      "updatedAt": "2025-05-22T15:00:00Z"
    }
  ]
  ```

#### POST /api/items
- **Request**:
  ```json
  {
    "name": "Mouse",
    "quantity": 50,
    "location": "Shelf B",
    "description": "Wireless Logitech"
  }
  ```
- **Response** (201):
  ```json
  {
    "_id": "67890",
    "name": "Mouse",
    "quantity": 50,
    "location": "Shelf B",
    "description": "Wireless Logitech",
    "createdAt": "2025-05-22T15:01:00Z",
    "updatedAt": "2025-05-22T15:01:00Z"
  }
  ```

#### Error Response (400)
- **Response**:
  ```json
  {
    "error": "Name and quantity are required"
  }
  ```

### Notes
- The base URL has been updated to `/api/items` to align with the project’s current implementation.
- Additional endpoints (e.g., `/api/auth`, `/api/sync`) are introduced in the **Enhancement Suggestions** (Part 10).