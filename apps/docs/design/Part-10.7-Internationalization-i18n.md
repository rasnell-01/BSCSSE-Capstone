# Inventory App Design Document - Part 10.7: Internationalization (i18n)

## 10.7 Internationalization (i18n)

### Overview
Add multi-language support to broaden global accessibility.

### Why
Supporting languages like Spanish or Chinese reaches diverse users, such as warehouse staff in different regions.

### Implementation
- **Backend (Express.js)**:
  - Add `translations` field:
    ```javascript
    const itemSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      translations: {
        name: { en: String, es: String, fr: String, zh: String },
        description: { en: String, es: String, fr: String, zh: String }
      },
      quantity: { type: Number, required: true, min: 0 }
    });
    ```

- **Web (Vue.js)**:
  - Use `vue-i18n`:
    ```vue
    <template>
      <div>
        <select v-model="$i18n.locale">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button>{{ $t('addItem') }}</button>
        <div v-for="item in items" :key="item._id">
          <ItemCard
            :item="item"
            @view="openViewModal(item)"
            @edit="openEditModal(item)"
            @delete="deleteItem(item._id)"
          />
        </div>
      </div>
    </template>
    <script>
    import { createI18n } from 'vue-i18n';
    import { getItems, deleteItem } from '@/shared/api';
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: { addItem: 'Add Item', name: 'Name' },
        es: { addItem: 'Agregar Artículo', name: 'Nombre' }
      }
    });
    export default {
      setup() { return { i18n }; },
      data: () => ({
        items: [],
        loading: false,
        error: null,
        showEditModal: false,
        showViewModal: false,
        selectedItem: null
      }),
      async created() {
        this.fetchItems();
      },
      methods: {
        async fetchItems() {
          this.loading = true;
          this.error = null;
          try {
            this.items = await getItems();
          } catch (err) {
            this.error = err.message;
          } finally {
            this.loading = false;
          }
        },
        async deleteItem(id) {
          if (confirm('Are you sure you want to delete this item?')) {
            try {
              await deleteItem(id);
              this.fetchItems();
            } catch (err) {
              alert(err.message);
            }
          }
        },
        openEditModal(item) {
          this.selectedItem = item;
          this.showEditModal = true;
        },
        openViewModal(item) {
          this.selectedItem = item;
          this.showViewModal = true;
        }
      }
    };
    </script>
    ```

- **Mobile (React Native)**:
  - Use `i18next`:
    ```javascript
    import i18n from 'i18next';
    import { initReactI18next } from 'react-i18next';
    import { useTranslation } from 'react-i18next';
    import { useState, useEffect } from 'react';
    import { View, Text, Picker, Button, FlatList } from 'react-native';
    import { getItems } from '@/shared/api';

    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: { addItem: 'Add Item', name: 'Name' } },
        es: { translation: { addItem: 'Agregar Artículo', name: 'Nombre' } }
      },
      lng: 'en'
    });

    export default function HomePage() {
      const { t, i18n } = useTranslation();
      const [items, setItems] = useState([]);
      useEffect(() => {
        async function fetchItems() { setItems(await getItems()); }
        fetchItems();
      }, []);
      return (
        <View>
          <Picker selectedValue={i18n.language} onValueChange={lang => i18n.changeLanguage(lang)}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Español" value="es" />
          </Picker>
          <Button title={t('addItem')} onPress={() => navigation.navigate('AddItem')} />
          <FlatList data={items} renderItem={({ item }) => <Text>{item.translations.name[i18n.language]}</Text>} />
        </View>
      );
    }
    ```

- **Mobile (Swift, iOS)**:
  - Use `NSLocalizedString`:
    ```swift
    struct HomeView: View {
        @StateObject private var viewModel = InventoryViewModel()
        @State private var locale = Locale.current.languageCode ?? "en"
        var body: some View {
            NavigationStack {
                VStack {
                    Picker("Language", selection: $locale) {
                        Text("English").tag("en")
                        Text("Español").tag("es")
                    }
                    Button(NSLocalizedString("add_item", comment: "")) {
                        // Navigate to AddItemView
                    }
                    List(viewModel.items) { item in
                        Text(item.translations.name[locale] ?? item.name)
                    }
                }
            }
        }
    }
    // Localizable.strings (en)
    "add_item" = "Add Item";
    "name" = "Name";
    // Localizable.strings (es)
    "add_item" = "Agregar Artículo";
    "name" = "Nombre";
    ```

- **Mobile (Kotlin, Android)**:
  - Use Android resources:
    ```kotlin
    @Composable
    fun HomeScreen(navController: NavController, viewModel: InventoryViewModel = viewModel()) {
        const context = LocalContext.current
        var locale by remember { mutableStateOf("en") }
        Column {
            Spinner(items = listOf("en", "es"), selected = locale, onSelected = { locale = it })
            Button(onClick = { navController.navigate("add") }) {
                Text(stringResource(id = R.string.add_item))
            }
            LazyColumn {
                items(viewModel.items) { item ->
                    Text(item.translations.name[locale] ?: item.name)
                }
            }
        }
    }
    ```
    ```xml
    <!-- res/values/strings.xml -->
    <resources>
        <string name="add_item">Add Item</string>
        <string name="name">Name</string>
    </resources>
    <!-- res/values-es/strings.xml -->
    <resources>
        <string name="add_item">Agregar Artículo</string>
        <string name="name">Nombre</string>
    </resources>
    ```

### Impact
- Broadens market reach.
- Improves accessibility for non-English users.
- Enhances user experience with localized interfaces.

### Related Considerations
- **Authentication**: Store language preferences (Part 10, Section 10.1).
- **Search and Filtering**: Support multi-language searches (Part 10, Section 10.2).