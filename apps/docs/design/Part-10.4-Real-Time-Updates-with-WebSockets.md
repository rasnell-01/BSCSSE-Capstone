# Inventory App Design Document - Part 10.4: Real-Time Updates with WebSockets

## 10.4 Real-Time Updates with WebSockets

### Overview
Implement WebSockets to enable real-time item updates for multi-user collaboration.

### Why
Instant updates prevent data conflicts in team settings, ensuring all users see the latest inventory changes immediately.

### Implementation
- **Backend (Express.js)**:
  - Use `socket.io`:
    ```javascript
    const express = require('express');
    const http = require('http');
    const socketIo = require('socket.io');
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);
    io.on('connection', socket => {
      socket.on('item:created', item => socket.broadcast.emit('item:created', item));
      socket.on('item:updated', item => socket.broadcast.emit('item:updated', item));
      socket.on('item:deleted', id => socket.broadcast.emit('item:deleted', id));
    });
    router.post('/', async (req, res, next) => {
      try {
        const item = new Item(req.body);
        await item.save();
        io.emit('item:created', item);
        res.status(201).json(item);
      } catch (err) { next(err); }
    });
    server.listen(5055);
    ```

- **Web (Vue.js)**:
  - Use `socket.io-client`:
    ```vue
    <template>
      <div class="container content-padding">
        <h2 class="section-title">Inventory Items</h2>
        <div class="refresh-section">
          <button @click="fetchItems" class="btn btn-secondary">Refresh</button>
        </div>
        <div v-if="loading" class="text-center">Loading...</div>
        <div v-else-if="error" class="error-text text-center">{{ error }}</div>
        <div v-else-if="!items.length" class="empty-text text-center">
          No items found. Click "Add Item" to get started!
        </div>
        <div v-else>
          <div v-for="item in items" :key="item._id">
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
    import io from 'socket.io-client';
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
          items: [],
          loading: false,
          error: null,
          showEditModal: false,
          showViewModal: false,
          selectedItem: null,
          socket: null
        };
      },
      async created() {
        this.fetchItems();
        this.socket = io('http://localhost:5055');
        this.socket.on('item:created', item => { this.items.push(item); });
        this.socket.on('item:updated', updatedItem => {
          const index = this.items.findIndex(i => i._id === updatedItem._id);
          if (index !== -1) this.items[index] = updatedItem;
        });
        this.socket.on('item:deleted', id => {
          this.items = this.items.filter(i => i._id !== id);
        });
      },
      beforeDestroy() {
        this.socket.disconnect();
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
    <style scoped>
    .content-padding {
      padding: 1rem;
    }
    .section-title {
      font-size: 1.25rem;
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
  - Use `socket.io-client`:
    ```javascript
    import { useState, useEffect } from 'react';
    import { FlatList, View, Text, Button, StyleSheet } from 'react-native';
    import io from 'socket.io-client';
    import { getItems, deleteItem } from '@/shared/api';

    export default function HomePage({ navigation }) {
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      useEffect(() => {
        let socket;
        async function init() {
          setLoading(true);
          setError(null);
          try {
            const data = await getItems();
            setItems(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
          socket = io('http://localhost:5055');
          socket.on('item:created', item => setItems(prev => [...prev, item]));
          socket.on('item:updated', updatedItem => {
            setItems(prev => prev.map(i => i._id === updatedItem._id ? updatedItem : i));
          });
          socket.on('item:deleted', id => setItems(prev => prev.filter(i => i._id !== id)));
        }
        init();
        return () => socket?.disconnect();
      }, []);

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
  - Use `Starscream`:
    ```swift
    import Starscream
    class InventoryViewModel: ObservableObject {
        @Published var items: [Item] = []
        private var socket: WebSocket?
        init() {
            let url = URL(string: "ws://localhost:5055")!
            socket = WebSocket(request: URLRequest(url: url))
            socket?.onEvent = { event in
                switch event {
                case .text(let string):
                    if let data = string.data(using: .utf8) {
                        if string.contains("item:created") {
                            let item = try! JSONDecoder().decode(Item.self, from: data)
                            DispatchQueue.main.async { self.items.append(item) }
                        }
                    }
                default: break
                }
            }
            socket?.connect()
        }
        deinit { socket?.disconnect() }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Use `okhttp3` WebSocket:
    ```kotlin
    class InventoryViewModel : ViewModel() {
        private val _items = MutableStateFlow<List<Item>>(emptyList())
        val items: StateFlow<List<Item>> = _items.asStateFlow()
        private val client = OkHttpClient()
        private val request = Request.Builder().url("ws://localhost:5055").build()
        private val listener = object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                val gson = Gson()
                when {
                    text.contains("item:created") -> {
                        val item = gson.fromJson(text, Item::class.java)
                        _items.update { it + item }
                    }
                    text.contains("item:updated") -> {
                        val item = gson.fromJson(text, Item::class.java)
                        _items.update { items -> items.map { if (it.id == item.id) item else it } }
                    }
                    text.contains("item:deleted") -> {
                        val id = // Parse ID
                        _items.update { it.filter { item -> item.id != id } }
                    }
                }
            }
        }
        init {
            client.newWebSocket(request, listener)
        }
        override fun onCleared() {
            client.dispatcher.executorService.shutdown()
        }
    }
    ```

### Impact
- Enables real-time collaboration.
- Enhances user experience with instant updates.

### Related Considerations
- **Offline Support**: Combine with hybrid sync strategies (Part 10, Section 10.3).
- **Authentication**: Respect user roles (Part 10, Section 10.1).