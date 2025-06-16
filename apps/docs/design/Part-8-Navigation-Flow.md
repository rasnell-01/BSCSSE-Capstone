# Inventory App Design Document - Part 8: Navigation Flow

## 8. Navigation Flow

### Overview
This section details the navigation structure for the web (Vue.js) and mobile (React Native, SwiftUI, Jetpack Compose) platforms, outlining how users move between views or screens.

### Web (Vue Router)
- **Single Route with Modals**:
  - `/`: `HomePage.vue` (displays item list, with modals for Add/Edit/View actions).
  - **Add Item**: Opens `AddItemModal.vue` within `HomePage.vue`.
  - **Edit Item**: Opens `EditItemModal.vue` within `HomePage.vue`.
  - **View Item**: Opens `ViewItemModal.vue` within `HomePage.vue`.

### Mobile (React Navigation)
- **Stack Navigator**:
  - `HomePage`: Default screen with the item list.
  - `AddItem`: Screen for creating a new item.
  - `EditItem`: Screen for editing an item.
  - `ViewItem`: Screen for viewing item details.

### Mobile (SwiftUI, iOS)
- **NavigationStack**:
  - `HomeView`: Displays the item list.
  - `AddItemView`: View for creating a new item.
  - `EditItemView`: View for editing an item.
  - `ViewItemView`: View for viewing item details.

### Mobile (Jetpack Compose, Android)
- **NavHost**:
  ```kotlin
  @Composable
  fun AppNavigation() {
      val navController = rememberNavController()
      NavHost(navController, startDestination = "home") {
          composable("home") { HomeScreen(navController) }
          composable("add") { AddItemScreen(navController) }
          composable("edit/{id}") { backStackEntry ->
              EditItemScreen(navController, backStackEntry.arguments?.getString("id") ?: "")
          }
          composable("view/{id}") { backStackEntry ->
              ViewItemScreen(navController, backStackEntry.arguments?.getString("id") ?: "")
          }
      }
  }
  ```

### Notes
- The web navigation has been updated to use modals within a single route (`/`), aligning with the project’s current implementation.
- Mobile platforms use screen-based navigation for a native feel, consistent with platform conventions.