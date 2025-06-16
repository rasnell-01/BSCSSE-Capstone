# Inventory App Design Document - Part 4: Sequence Diagrams

## 4. Sequence Diagrams

### Overview
This section provides sequence diagrams for the core use cases, detailing the interactions between the User, Web/Mobile App, Express.js API, and MongoDB. These diagrams illustrate the flow of data for each operation.

### Add Item
```plaintext
User -> Web/Mobile App: Click "Add Item"
Web/Mobile App -> Express API: POST /api/items {name, quantity, location, description}
Express API -> MongoDB: Save Item
MongoDB -> Express API: Item Saved
Express API -> Web/Mobile App: 201 Created + Item
Web/Mobile App -> User: Display Success Message
```

### View Items
```plaintext
User -> Web/Mobile App: Navigate to HomePage
Web/Mobile App -> Express API: GET /api/items
Express API -> MongoDB: Item.find()
MongoDB -> Express API: List of Items
Express API -> Web/Mobile App: 200 OK + [Item]
Web/Mobile App -> User: Render Item List
```

### Edit Item
```plaintext
User -> Web/Mobile App: Click "Edit" on Item
Web/Mobile App -> Express API: GET /api/items/:id
Express API -> MongoDB: Item.findById()
MongoDB -> Express API: Item
Express API -> Web/Mobile App: 200 OK + Item
Web/Mobile App -> User: Display Edit Form
User -> Web/Mobile App: Submit Updated Data
Web/Mobile App -> Express API: PUT /api/items/:id {name?, quantity?, location?, description?}
Express API -> MongoDB: Item.findByIdAndUpdate()
MongoDB -> Express API: Updated Item
Express API -> Web/Mobile App: 200 OK + Item
Web/Mobile App -> User: Display Success Message
```

### Delete Item
```plaintext
User -> Web/Mobile App: Click "Delete" on Item
Web/Mobile App -> Express API: DELETE /api/items/:id
Express API -> MongoDB: Item.findByIdAndDelete()
MongoDB -> Express API: Deletion Confirmed
Express API -> Web/Mobile App: 204 No Content
Web/Mobile App -> User: Display Success Message
```

### Notes
- The API endpoint has been updated to `/api/items` to reflect the project’s current implementation.
- These flows are complemented by the **Data Flow Diagram** (Part 9) for a broader system perspective.