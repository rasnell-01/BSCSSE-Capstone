# Inventory App Design Document - Part 7: Component Structure

## 7. Component Structure

### Overview
This section outlines the component hierarchy for the web (Vue.js), React Native, Swift (iOS), and Kotlin (Android) frontends, detailing the structure and purpose of each component.

### Web (Vue.js)
```plaintext
App.vue
├── Header.vue
├── HomePage.vue
│   ├── ItemList.vue
│   │   └── ItemCard.vue
│   ├── AddItemModal.vue
│   ├── EditItemModal.vue
│   ├── ViewItemModal.vue
└── Footer.vue
```

- **App.vue**: Root component with the main layout (header, main content, footer).
- **Header.vue**: Navigation bar with the app title and an "Add Item" button.
- **HomePage.vue**: Displays the item list and manages modals for Add/Edit/View actions.
- **ItemList.vue**: Renders a list of items using `ItemCard.vue`.
- **ItemCard.vue**: Displays individual item details with View/Edit/Delete buttons.
- **AddItemModal.vue**: Modal for adding new items.
- **EditItemModal.vue**: Modal for editing existing items.
- **ViewItemModal.vue**: Modal for viewing item details (read-only).
- **Footer.vue**: Static footer with version information.

### Mobile (React Native)
```plaintext
App.js
├── HomePage.js
│   ├── ItemList.js
│   │   └── ItemCard.js
├── AddItem.js
├── EditItem.js
└── ViewItem.js
```

- **App.js**: Root component with navigation setup (React Navigation).
- **HomePage.js**: Default screen displaying the item list.
- **ItemList.js**: Renders a list of items using `ItemCard.js`.
- **ItemCard.js**: Displays individual item details with View/Edit/Delete buttons.
- **AddItem.js**: Screen for adding new items.
- **EditItem.js**: Screen for editing existing items.
- **ViewItem.js**: Screen for viewing item details (read-only).

### Mobile (Swift, iOS)
```plaintext
App.swift
├── HomeView.swift
│   ├── ItemListView.swift
│   │   └── ItemCardView.swift
├── AddItemView.swift
├── EditItemView.swift
└── ViewItemView.swift
```

- **App.swift**: Root entry point with navigation setup (NavigationStack).
- **HomeView.swift**: Main view displaying the item list.
- **ItemListView.swift**: Renders a list of items using `ItemCardView.swift`.
- **ItemCardView.swift**: Displays individual item details with View/Edit/Delete actions.
- **AddItemView.swift**: View for adding new items.
- **EditItemView.swift**: View for editing existing items.
- **ViewItemView.swift**: View for viewing item details (read-only).

### Mobile (Kotlin, Android)
```plaintext
MainActivity.kt
├── HomeScreen.kt
│   ├── ItemListScreen.kt
│   │   └── ItemCard.kt
├── AddItemScreen.kt
├── EditItemScreen.kt
└── ViewItemScreen.kt
```

- **MainActivity.kt**: Root entry point with navigation setup (NavHost).
- **HomeScreen.kt**: Main screen displaying the item list.
- **ItemListScreen.kt**: Renders a list of items using `ItemCard.kt`.
- **ItemCard.kt**: Displays individual item details with View/Edit/Delete actions.
- **AddItemScreen.kt**: Screen for adding new items.
- **EditItemScreen.kt**: Screen for editing existing items.
- **ViewItemScreen.kt**: Screen for viewing item details (read-only).

### Notes
- The web frontend uses modals for Add/Edit/View actions, reflecting the current single-route (`/`) approach.
- Component names and structures are consistent across platforms, with platform-specific adaptations (e.g., modals for web, screens for mobile).