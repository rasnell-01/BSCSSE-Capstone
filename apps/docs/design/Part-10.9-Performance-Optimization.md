# Inventory App Design Document - Part 10.9: Performance Optimization

## 10.9 Performance Optimization

### Overview
Optimize the app to ensure fast load times and smooth interactions for large inventories, supporting up to 10,000 items per user. This section addresses performance bottlenecks in the backend and frontend, implementing pagination, caching, and virtual scrolling to meet the non-functional requirement of API response times under 500ms for 95% of requests (excluding network latency).

### Why
Performance is critical for user satisfaction, especially with large datasets. Slow load times or laggy interactions can frustrate users, particularly in inventory management where quick access to data is essential. Optimizations like pagination reduce the amount of data transferred, caching minimizes redundant database queries, and virtual scrolling improves frontend rendering efficiency.

### Implementation
- **Backend (Express.js)**:
  - **Add Pagination (Sprint 9, Day 113–117):**  
    Pagination reduces the amount of data fetched per request, improving API response times and frontend rendering. The `GET /api/items` endpoint is updated to support `page` and `limit` query parameters, returning a paginated response with metadata (`total`, `page`, `limit`).
    ```javascript
    router.get('/', async (req, res, next) => {
      try {
        const { page = 1, limit = 20 } = req.query;
        const items = await Item.find()
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
        const total = await Item.countDocuments();
        res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
      } catch (err) {
        next(err);
      }
    });
    ```
    - **Explanation**:
      - `page` and `limit` are extracted from query parameters with defaults (page 1, 20 items per page).
      - `skip` and `limit` methods paginate the MongoDB query.
      - `countDocuments` provides the total number of items for frontend pagination controls.
      - Response includes `items` (array of paginated items), `total`, `page`, and `limit`.

  - **Cache with Redis (Sprint 9, Day 118–122):**  
    Redis caching reduces database load by storing frequently accessed data in memory, with a TTL (time-to-live) of 1 hour. The `GET /api/items` endpoint is updated to check Redis first, falling back to MongoDB if the cache misses.
    ```javascript
    const redis = require('redis');
    const client = redis.createClient();

    // Connect to Redis (ensure Redis server is running)
    client.connect().catch((err) => console.error('Redis connection error:', err));

    router.get('/', async (req, res, next) => {
      try {
        const cacheKey = `items:${JSON.stringify(req.query)}`;
        const cached = await client.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
        const { page = 1, limit = 20 } = req.query;
        const items = await Item.find()
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
        const total = await Item.countDocuments();
        const response = { items, total, page: parseInt(page), limit: parseInt(limit) };
        await client.setEx(cacheKey, 3600, JSON.stringify(response));
        res.json(response);
      } catch (err) {
        next(err);
      }
    });
    ```
    - **Explanation**:
      - Install Redis: `npm install redis` in the `api` directory.
      - Create a Redis client and connect to the Redis server (ensure Redis is running locally or on a hosted service like AWS ElastiCache).
      - Generate a unique cache key based on the query parameters.
      - Check Redis for cached data; if found, parse and return it.
      - If cache misses, query MongoDB, store the response in Redis with a 1-hour TTL (`setEx`), and return the response.
      - **Dependencies**: Requires a running Redis instance (`redis-server` locally or a hosted service).

  - **Test Backend Performance:**  
    Add a test to verify pagination and caching:
    ```javascript
    const mongoose = require('mongoose');
    const request = require('supertest');
    const app = require('../index');
    const Item = require('../models/Item');

    describe('Items API - Performance', () => {
      beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI);
      });

      afterEach(async () => {
        await Item.deleteMany({});
      });

      afterAll(async () => {
        await mongoose.connection.close();
      });

      it('should paginate items', async () => {
        // Seed 30 items
        for (let i = 0; i < 30; i++) {
          await new Item({ name: `Item ${i}`, quantity: i }).save();
        }
        const res = await request(app).get('/api/items?page=1&limit=10');
        expect(res.statusCode).toEqual(200);
        expect(res.body.items).toHaveLength(10);
        expect(res.body.total).toEqual(30);
        expect(res.body.page).toEqual(1);
        expect(res.body.limit).toEqual(10);
      });

      it('should cache items', async () => {
        const res1 = await request(app).get('/api/items?page=1&limit=10');
        const res2 = await request(app).get('/api/items?page=1&limit=10');
        expect(res1.body).toEqual(res2.body); // Should be cached
      });
    });
    ```
    - Run tests: `npm test` in the `api` directory.

- **Web (Vue.js)**:
  - **Update `shared/api.js` to Handle Pagination (Sprint 9, Day 123–124):**  
    Modify the `getItems` method to pass pagination parameters and handle the paginated response:
    ```javascript
    import axios from 'axios';

    const api = axios.create({
      baseURL: 'http://localhost:5055/api',
      headers: { 'Content-Type': 'application/json' }
    });

    api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    export const getItems = async (params = {}) => {
      try {
        const { data } = await api.get('/items', { params });
        return data; // { items, total, page, limit }
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to fetch items');
      }
    };

    export const getItem = async (id) => {
      try {
        const { data } = await api.get(`/items/${id}`);
        return data;
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to fetch item');
      }
    };

    export const createItem = async (data) => {
      try {
        const { data: newItem } = await api.post('/items', data);
        return newItem;
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to create item');
      }
    };

    export const updateItem = async (id, data) => {
      try {
        const { data: updatedItem } = await api.put(`/items/${id}`, data);
        return updatedItem;
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to update item');
      }
    };

    export const deleteItem = async (id) => {
      try {
        await api.delete(`/items/${id}`);
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to delete item');
      }
    };
    ```

  - **Use Lazy Loading/Virtual Scrolling in `HomePage.vue` (Sprint 9, Day 123–126):**  
    Implement pagination controls and virtual scrolling to handle large lists efficiently. We'll use `vue-virtual-scroller` for simplicity, which is a Vue.js library for efficient list rendering. This aligns with the project's current setup, including custom PostCSS styles and modal-based navigation.
    - Install the package: `npm install vue-virtual-scroller` in the `web` directory.
    - Update `HomePage.vue` to include pagination and virtual scrolling, building on the existing search/filter functionality:
    ```vue
    <template>
      <div class="container content-padding">
        <h2 class="section-title">Inventory Items</h2>
        <div class="search-filter">
          <input
            v-model="filters.name"
            placeholder="Search by name..."
            class="form-input"
            @input="fetchItems(1)"
          />
          <select v-model="filters.category" class="form-input" @change="fetchItems(1)">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
          </select>
        </div>
        <div class="refresh-section">
          <button @click="fetchItems(currentPage)" class="btn btn-secondary">Refresh</button>
        </div>
        <div v-if="loading" class="text-center">Loading...</div>
        <div v-else-if="error" class="error-text text-center">{{ error }}</div>
        <div v-else-if="!items.length" class="empty-text text-center">
          No items found. Click "Add Item" to get started!
        </div>
        <div v-else class="items-container">
          <RecycleScroller
            v-slot="{ item }"
            :items="items"
            :item-size="120"
            key-field="_id"
            class="scroller"
          >
            <div class="item-wrapper">
              <ItemCard
                :item="item"
                @view="openViewModal"
                @edit="openEditModal"
                @delete="deleteItem(item._id)"
              />
            </div>
          </RecycleScroller>
          <div class="pagination">
            <button
              :disabled="currentPage === 1"
              @click="fetchItems(currentPage - 1)"
              class="btn btn-secondary"
            >
              Previous
            </button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              :disabled="currentPage === totalPages"
              @click="fetchItems(currentPage + 1)"
              class="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
        <AddItemModal
          :is-open="showAddModal"
          @close="$emit('close-add-modal')"
          @refresh="fetchItems(currentPage)"
        />
        <EditItemModal
          :is-open="showEditModal"
          :item="selectedItem"
          @close="showEditModal = false"
          @refresh="fetchItems(currentPage)"
        />
        <ViewItemModal
          :is-open="showViewModal"
          :item="selectedItem"
          @close="showViewModal = false"
        />
      </div>
    </template>
    <script>
    import { RecycleScroller } from 'vue-virtual-scroller';
    import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
    import ItemCard from './ItemCard.vue';
    import AddItemModal from './AddItemModal.vue';
    import EditItemModal from './EditItemModal.vue';
    import ViewItemModal from './ViewItemModal.vue';
    import { getItems, deleteItem } from '@/shared/api';

    export default {
      components: { RecycleScroller, ItemCard, AddItemModal, EditItemModal, ViewItemModal },
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
          filters: { name: '', category: '' },
          currentPage: 1,
          total: 0,
          limit: 20,
          totalPages: 1
        };
      },
      computed: {
        totalPages() {
          return Math.ceil(this.total / this.limit);
        }
      },
      methods: {
        async fetchItems(page = 1) {
          this.loading = true;
          this.error = null;
          try {
            const params = { page, limit: this.limit, ...this.filters };
            const data = await getItems(params);
            this.items = data.items;
            this.total = data.total;
            this.currentPage = data.page;
            this.totalPages = Math.ceil(data.total / data.limit);
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
              this.fetchItems(this.currentPage);
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
      },
      created() {
        this.fetchItems();
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
    .items-container {
      margin-top: 1rem;
    }
    .scroller {
      height: 400px;
      overflow-y: auto;
    }
    .item-wrapper {
      height: 120px;
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }
    </style>
    ```
    - **Explanation**:
      - **Pagination**: Added `currentPage`, `total`, `limit`, and `totalPages` to manage paginated data from the backend. The `fetchItems` method passes the `page` parameter to the API and updates the state with the response.
      - **Virtual Scrolling**: Used `vue-virtual-scroller`'s `RecycleScroller` to render only visible items, improving performance for large lists. Each `ItemCard` is assumed to have a fixed height of 120px (`item-size="120"`).
      - **Integration with Filters**: Combined with existing search/filter inputs, resetting to page 1 when filters change.
      - **Delete Handling**: Updated to use the shared `deleteItem` function and refresh the current page after deletion.
      - **Styling**: Uses custom PostCSS styles from `main.pcss` (e.g., `.container`, `.btn-secondary`, `.form-input`), consistent with the project's styling approach.

  - **Test Web Performance (Sprint 9, Day 123–126):**  
    Add a test to verify pagination and scrolling behavior:
    ```javascript
    import { mount } from '@vue/test-utils';
    import HomePage from '@/components/HomePage.vue';

    jest.mock('@/shared/api', () => ({
      getItems: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
      deleteItem: jest.fn().mockResolvedValue(undefined)
    }));

    describe('HomePage.vue - Performance', () => {
      it('renders pagination controls', async () => {
        const wrapper = mount(HomePage, {
          props: { showAddModal: false }
        });
        await wrapper.setData({
          items: Array(20).fill().map((_, i) => ({ _id: `${i}`, name: `Item ${i}`, quantity: i })),
          total: 50,
          currentPage: 1,
          limit: 20
        });
        expect(wrapper.find('.pagination').exists()).toBe(true);
        expect(wrapper.find('.pagination span').text()).toBe('Page 1 of 3');
      });

      it('fetches next page', async () => {
        const wrapper = mount(HomePage, {
          props: { showAddModal: false }
        });
        await wrapper.setData({
          items: Array(20).fill().map((_, i) => ({ _id: `${i}`, name: `Item ${i}`, quantity: i })),
          total: 50,
          currentPage: 1,
          limit: 20
        });
        const nextButton = wrapper.findAll('.btn-secondary').at(1); // "Next" button
        await nextButton.trigger('click');
        expect(wrapper.vm.currentPage).toBe(2);
      });
    });
    ```
    - Run tests: `npm run test:unit` in the `web` directory.
    - **Performance Monitoring**: Use browser DevTools to measure rendering time, ensuring virtual scrolling reduces DOM nodes for large lists (e.g., only 10–15 items rendered at a time instead of 1,000).

- **Mobile (React Native, Sprint 9, Day 123–126)**:
  - **Optimize `FlatList` in `ItemList.js`:**  
    Update `ItemList.js` to use `FlatList` optimization techniques (e.g., `initialNumToRender`, `windowSize`) and support pagination, building on the existing implementation from Sprint 3:
    ```javascript
    import React from 'react';
    import { FlatList, View, Text, Button, StyleSheet } from 'react-native';
    import { deleteItem } from '../shared/api';

    export default function ItemList({ items, onView, onEdit, onRefresh, onEndReached }) {
      const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
          try {
            await deleteItem(id);
            onRefresh();
          } catch (err) {
            alert(err.message);
          }
        }
      };

      return (
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
                <Button title="View" onPress={() => onView(item)} />
                <Button title="Edit" onPress={() => onEdit(item)} />
                <Button title="Delete" color="#ef4444" onPress={() => handleDelete(item._id)} />
              </View>
            </View>
          )}
          initialNumToRender={10}
          windowSize={5}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
        />
      );
    }

    const styles = StyleSheet.create({
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

  - **Update `HomePage.js` for Pagination:**  
    Modify `HomePage.js` to support pagination, fetching additional items as the user scrolls, and integrating with the existing search functionality:
    ```javascript
    import React, { useState, useEffect, useCallback } from 'react';
    import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
    import ItemList from './ItemList';
    import { getItems } from '../shared/api';

    export default function HomePage({ navigation }) {
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [page, setPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [filters, setFilters] = useState({ name: '', category: '' });

      const fetchItems = async (pageNum = 1, append = false) => {
        setLoading(true);
        setError(null);
        try {
          const params = { page: pageNum, limit: 20, ...filters };
          const data = await getItems(params);
          setItems(append ? [...items, ...data.items] : data.items);
          setTotalPages(Math.ceil(data.total / data.limit));
          setPage(data.page);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchItems();
      }, [filters]);

      const handleEndReached = useCallback(() => {
        if (page < totalPages && !loading) {
          fetchItems(page + 1, true);
        }
      }, [page, totalPages, loading]);

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Inventory Items</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by name..."
            value={filters.name}
            onChangeText={(text) => setFilters({ ...filters, name: text })}
          />
          <Button title="Refresh" onPress={() => fetchItems(1)} />
          {loading && <Text style={styles.textCenter}>Loading...</Text>}
          {error && <Text style={[styles.textCenter, styles.errorText]}>{error}</Text>}
          {!loading && !error && items.length === 0 && (
            <Text style={[styles.textCenter, styles.emptyText]}>No items found. Add an item to get started!</Text>
          )}
          {!loading && !error && items.length > 0 && (
            <ItemList
              items={items}
              onView={(item) => navigation.navigate('ViewItem', { item })}
              onEdit={(item) => navigation.navigate('EditItem', { item })}
              onRefresh={() => fetchItems(1)}
              onEndReached={handleEndReached}
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
      emptyText: { color: '#6b7280' }
    });
    ```
    - **Explanation**:
      - **Pagination**: Added `page` and `totalPages` state, fetching more items on `onEndReached`.
      - **FlatList Optimization**: Used `initialNumToRender` and `windowSize` to limit the number of rendered items, improving performance for large lists.
      - **Filters**: Integrated with search input, resetting to page 1 on filter change.
      - **Navigation**: Maintained the existing screen-based navigation (e.g., `AddItem`, `EditItem`, `ViewItem`) as per the **Navigation Flow** section (Part 8).

### Considerations
- **Backend**:
  - Ensure Redis is configured with appropriate memory limits to avoid excessive memory usage.
  - Add cache invalidation on item create/update/delete to keep data consistent:
    ```javascript
    router.post('/', async (req, res, next) => {
      try {
        const item = new Item(req.body);
        await item.save();
        await client.del('items:*'); // Invalidate cache
        res.status(201).json(item);
      } catch (err) {
        next(err);
      }
    });
    ```
  - **Performance Note**: Use MongoDB indexes (already present on `name` and `location`) to ensure efficient queries, especially with pagination.

- **Frontend**:
  - **Web**: Monitor performance with browser DevTools to ensure virtual scrolling reduces rendering time (e.g., only 10–15 items rendered at a time for a list of 1,000 items).
  - **Mobile**: Test on low-end devices to verify `FlatList` optimizations (e.g., `initialNumToRender`, `windowSize`) improve scrolling performance.
  - For very large lists (>10,000 items), consider implementing a "Load More" button instead of automatic `onEndReached` to give users control over data loading.

### Summary
This section enhances the app’s performance by:
- Implementing pagination and Redis caching on the backend to reduce database load and improve API response times.
- Adding pagination and virtual scrolling to the Vue.js frontend for efficient rendering of large lists.
- Optimizing `FlatList` in React Native with pagination support for smooth scrolling on mobile devices.

### Test the App to Confirm Performance Improvements
To ensure the performance optimizations are effective:
1. **Seed Test Data:**  
   Add 1,000 items to MongoDB for testing:
   ```javascript
   const mongoose = require('mongoose');
   const Item = require('./models/Item');

   async function seedItems() {
     await mongoose.connect('mongodb://localhost/inventory');
     await Item.deleteMany({});
     const items = Array.from({ length: 1000 }, (_, i) => ({
       name: `Item ${i}`,
       quantity: i,
       location: `Shelf ${i % 10}`,
       description: `Description for item ${i}`,
       category: i % 2 === 0 ? 'Electronics' : 'Books'
     }));
     await Item.insertMany(items);
     console.log('Seeded 1000 items');
     await mongoose.connection.close();
   }

   seedItems();
   ```

2. **Ensure Backend and Redis are Running:**
   - Start Redis: `redis-server` (or ensure a hosted Redis instance is available).
   - Run the backend: `npm start` in the `api` directory.

3. **Test the Frontend:**
   - Run `npm run dev` in the `web` directory and open `http://localhost:5173/`.
   - Verify that the list loads only 20 items initially, with pagination controls.
   - Scroll through the list to ensure virtual scrolling works (only visible items are rendered).
   - Use browser DevTools (Network tab) to confirm paginated API requests (`GET /api/items?page=1&limit=20`).

### Next Steps
- **Analytics and CI/CD (Sprint 10):** Implement the analytics dashboard (Part 10, Section 10.6) and set up the CI/CD pipeline (Part 10, Section 10.8).
- **Native Mobile Transition (Sprints 11–12):** Begin transitioning the React Native app to SwiftUI and Jetpack Compose, applying similar performance optimizations (Part 11, Section 11.2).