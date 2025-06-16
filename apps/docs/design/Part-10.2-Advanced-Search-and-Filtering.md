# Inventory App Design Document - Part 10.2: Advanced Search and Filtering

## 10.2 Advanced Search and Filtering

### Overview
Add advanced search and filtering capabilities to improve usability for large inventories.

### Why
Efficient searching by attributes like name, category, or quantity enhances productivity, especially in large-scale inventory settings.

### Implementation
- **Backend (Express.js)**:
  - Extend `GET /api/items`:
    ```javascript
    router.get('/', async (req, res, next) => {
      try {
        const { name, category, quantity, sort } = req.query;
        const query = {};
        if (name) query.name = { $regex: name, $options: 'i' };
        if (category) query.category = category;
        if (quantity) query.quantity = { $gte: parseInt(quantity) };
        const items = await Item.find(query).sort(sort || '-createdAt');
        res.json(items);
      } catch (err) { next(err); }
    });
    ```

- **Web (Vue.js)**:
  - Update `HomePage.vue` with search UI:
    ```vue
    <template>
      <div class="container content-padding">
        <h2 class="section-title">Inventory Items</h2>
        <div class="search-filter">
          <input
            v-model="searchQuery"
            placeholder="Search items..."
            class="form-input"
            @input="debounceSearch"
          />
          <select v-model="categoryFilter" class="form-input" @change="debounceSearch">
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
          </select>
          <input type="number" v-model="quantityFilter" placeholder="Min Quantity" class="form-input" @input="debounceSearch" />
        </div>
        <div class="refresh-section">
          <button @click="fetchItems" class="btn btn-secondary">Refresh</button>
        </div>
        <div v-if="loading" class="text-center">Loading...</div>
        <div v-else-if="error" class="error-text text-center">{{ error }}</div>
        <div v-else-if="!filteredItems.length" class="empty-text text-center">
          No items found. Click "Add Item" to get started!
        </div>
        <div v-else>
          <div v-for="item in filteredItems" :key="item._id">
            <ItemCard
              :item="item"
              @view="openViewModal(item)"
              @edit="openEditModal(item)"
              @delete="deleteItem(item._id)"
            />
          </div>
        </div>
        <AddItemModal
          :is-open="showAddModal"
          @close="$emit('close-add-modal')"
          @refresh="fetchItems"
        />
        <EditItemModal
          :is-open="showEditModal"
          :item="selectedItem"
          @close="showEditModal = false"
          @refresh="fetchItems"
        />
        <ViewItemModal
          :is-open="showViewModal"
          :item="selectedItem"
          @close="showViewModal = false"
        />
      </div>
    </template>
    <script>
    import { debounce } from 'lodash';
    import ItemCard from './ItemCard.vue';
    import AddItemModal from './AddItemModal.vue';
    import EditItemModal from './EditItemModal.vue';
    import ViewItemModal from './ViewItemModal.vue';
    import { getItems, deleteItem } from '@/shared/api';

    export default {
      components: { ItemCard, AddItemModal, EditItemModal, ViewItemModal },
      props: {
        showAddModal: {
          type: Boolean,
          default: false
        }
      },
      emits: ['close-add-modal'],
      data() {
        return {
          searchQuery: '',
          categoryFilter: '',
          quantityFilter: '',
          items: [],
          filteredItems: [],
          loading: false,
          error: null,
          showEditModal: false,
          showViewModal: false,
          selectedItem: null
        };
      },
      created() {
        this.debounceSearch = debounce(this.fetchItems, 300);
        this.fetchItems();
      },
      methods: {
        async fetchItems() {
          this.loading = true;
          this.error = null;
          try {
            const params = new URLSearchParams({
              name: this.searchQuery,
              category: this.categoryFilter,
              quantity: this.quantityFilter
            }).toString();
            this.items = await getItems(params ? `?${params}` : '');
            this.filteredItems = this.items;
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
    <style scoped>
    .content-padding {
      padding: 1rem;
    }
    .section-title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .search-filter {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .refresh-section {
      margin-bottom: 1rem;
    }
    .text-center {
      text-align: center;
    }
    .error-text {
      color: #ef4444;
    }
    .empty-text {
      color: #6b7280;
    }
    </style>
    ```

- **Mobile (React Native)**:
  - Update `HomePage.js` with search UI:
    ```javascript
    import { useState, useEffect } from 'react';
    import { TextInput, Picker, FlatList, View, Text, Button, StyleSheet } from 'react-native';
    import { debounce } from 'lodash';
    import { getItems, deleteItem } from '@/shared/api';

    export default function HomePage({ navigation }) {
      const [searchQuery, setSearchQuery] = useState('');
      const [categoryFilter, setCategoryFilter] = useState('');
      const [quantityFilter, setQuantityFilter] = useState('');
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      const fetchItems = debounce(async () => {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams({
            name: searchQuery,
            category: categoryFilter,
            quantity: quantityFilter
          }).toString();
          const data = await getItems(params ? `?${params}` : '');
          setItems(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }, 300);

      useEffect(() => {
        fetchItems();
      }, [searchQuery, categoryFilter, quantityFilter]);

      const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
          try {
            await deleteItem(id);
            fetchItems();
          } catch (err) {
            alert(err.message);
          }
        }
      };

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Inventory Items</Text>
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
          />
          <Picker
            style={styles.input}
            selectedValue={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <Picker.Item label="All Categories" value="" />
            <Picker.Item label="Electronics" value="electronics" />
          </Picker>
          <TextInput
            style={styles.input}
            value={quantityFilter}
            onChangeText={setQuantityFilter}
            placeholder="Min Quantity"
            keyboardType="numeric"
          />
          <Button title="Refresh" onPress={fetchItems} />
          {loading && <Text style={styles.textCenter}>Loading...</Text>}
          {error && <Text style={[styles.textCenter, styles.errorText]}>{error}</Text>}
          {!loading && !error && items.length === 0 && (
            <Text style={[styles.textCenter, styles.emptyText]}>No items found. Add an item to get started!</Text>
          )}
          {!loading && !error && items.length > 0 && (
            <FlatList
              data={items}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardText}>Quantity: {item.quantity}</Text>
                  <Text style={styles.cardText}>Location: {item.location || 'N/A'}</Text>
                  <Text style={styles.cardText}>Description: {item.description || 'N/A'}</Text>
                  <View style={styles.cardActions}>
                    <Button title="View" onPress={() => navigation.navigate('ViewItem', { item })} />
                    <Button title="Edit" onPress={() => navigation.navigate('EditItem', { item })} />
                    <Button title="Delete" color="#ef4444" onPress={() => handleDelete(item._id)} />
                  </View>
                </View>
              )}
            />
          )}
          <Button title="Add Item" onPress={() => navigation.navigate('AddItem')} />
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: { padding: 16, flex: 1 },
      title: { fontSize: 20, marginBottom: 16 },
      input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: 8,
        borderRadius: 4,
        marginBottom: 16
      },
      textCenter: { textAlign: 'center', marginVertical: 8 },
      errorText: { color: '#ef4444' },
      emptyText: { color: '#6b7280' },
      card: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        marginBottom: 8,
        borderRadius: 4,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3
      },
      cardTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
      cardText: { color: '#6b7280' },
      cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }
    });
    ```

- **Mobile (Swift, iOS)**:
  - Update `HomeView.swift` with search UI:
    ```swift
    struct HomeView: View {
        @StateObject private var viewModel = InventoryViewModel()
        @State private var searchQuery = ""
        @State private var categoryFilter = ""
        @State private var quantityFilter = ""
        var body: some View {
            NavigationStack {
                VStack {
                    TextField("Search items...", text: $searchQuery)
                        .onChange(of: searchQuery) { _ in viewModel.fetchItems() }
                    Picker("Category", selection: $categoryFilter) {
                        Text("All Categories").tag("")
                        Text("Electronics").tag("electronics")
                    }
                    TextField("Min Quantity", text: $quantityFilter)
                        .keyboardType(.numberPad)
                        .onChange(of: quantityFilter) { _ in viewModel.fetchItems() }
                    ItemListView(items: viewModel.items)
                }
            }
        }
    }
    class InventoryViewModel: ObservableObject {
        @Published var items: [Item] = []
        private var searchQuery = ""
        private var categoryFilter = ""
        private var quantityFilter = ""
        func fetchItems() {
            Task {
                let params = ["name": searchQuery, "category": categoryFilter, "quantity": quantityFilter]
                    .compactMap { k, v in v.isEmpty ? nil : "\(k)=\(v)" }
                    .joined(separator: "&")
                let url = URL(string: "http://localhost:5055/api/items?\(params)")!
                let (data, _) = try await URLSession.shared.data(from: url)
                self.items = try JSONDecoder().decode([Item].self, from: data)
            }
        }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Update `HomeScreen.kt` with search UI:
    ```kotlin
    @Composable
    fun HomeScreen(navController: NavController, viewModel: InventoryViewModel = viewModel()) {
        var searchQuery by remember { mutableStateOf("") }
        var categoryFilter by remember { mutableStateOf("") }
        var quantityFilter by remember { mutableStateOf("") }
        LaunchedEffect(searchQuery, categoryFilter, quantityFilter) {
            viewModel.fetchItems(searchQuery, categoryFilter, quantityFilter)
        }
        Column {
            TextField(value = searchQuery, onValueChange = { searchQuery = it }, label = { Text("Search items...") })
            Spinner(items = listOf("", "electronics"), selected = categoryFilter, onSelected = { categoryFilter = it })
            TextField(value = quantityFilter, onValueChange = { quantityFilter = it }, label = { Text("Min Quantity") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            ItemListScreen(items = viewModel.items)
        }
    }
    class InventoryViewModel : ViewModel() {
        private val _items = MutableStateFlow<List<Item>>(emptyList())
        val items: StateFlow<List<Item>> = _items.asStateFlow()
        fun fetchItems(searchQuery: String, category: String, quantity: String) {
            viewModelScope.launch {
                val params = buildMap {
                    if (searchQuery.isNotEmpty()) put("name", searchQuery)
                    if (category.isNotEmpty()) put("category", category)
                    if (quantity.isNotEmpty()) put("quantity", quantity)
                }
                _items.value = api.getItems(params)
            }
        }
    }
    ```

### Impact
- Improves efficiency for managing large inventories.
- Enhances user experience with intuitive filtering options.
- Supports scalability in enterprise settings.

### Related Considerations
- **Analytics Dashboard**: Use search data to inform analytics (Part 10, Section 10.6).
- **Performance Optimization**: Combine with pagination for better performance (Part 10, Section 10.9).