# Inventory App Design Document - Part 10.3: Offline Support and Data Sync

## 10.3 Offline Support and Data Sync

### Overview
Enable offline mode with local storage and background synchronization to ensure uninterrupted operation in low-connectivity environments.

### Why
Warehouse workers often operate in areas with limited connectivity, requiring offline functionality with automatic syncing when connectivity is restored.

### Implementation
- **Backend (Express.js)**:
  - Add `/api/sync` endpoint:
    ```javascript
    router.post('/sync', async (req, res, next) => {
      try {
        const { updates } = req.body;
        const results = await Promise.all(updates.map(async update => {
          if (update.operation === 'create') return Item.create(update.data);
          if (update.operation === 'update') {
            const existing = await Item.findById(update.id);
            if (existing.updatedAt > update.timestamp) throw new Error('Conflict');
            return Item.findByIdAndUpdate(update.id, update.data, { new: true });
          }
          if (update.operation === 'delete') return Item.findByIdAndDelete(update.id);
        }));
        res.json(results);
      } catch (err) { next(err); }
    });
    ```

- **Web (Vue.js)**:
  - Use IndexedDB with `dexie.js`:
    ```javascript
    import Dexie from 'dexie';
    const db = new Dexie('InventoryDB');
    db.version(1).stores({ items: '++id, name, quantity', queue: '++id, operation, data, timestamp' });
    async function saveItemOffline(item) {
      await db.items.put(item);
      await db.queue.put({ operation: 'create', data: item, timestamp: new Date() });
    }
    async function syncOffline() {
      if (!navigator.onLine) return;
      const queue = await db.queue.toArray();
      const updates = queue.map(({ operation, data, timestamp }) => ({ operation, data, timestamp }));
      try {
        const results = await api.post('/sync', { updates });
        await db.queue.clear();
        await db.items.bulkPut(results.filter(r => r.operation === 'create' || r.operation === 'update'));
      } catch (err) {
        console.error('Sync failed', err);
      }
    }
    window.addEventListener('online', syncOffline);
    ```

- **Mobile (React Native)**:
  - Use `AsyncStorage` and `react-native-background-fetch`:
    ```javascript
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import BackgroundFetch from 'react-native-background-fetch';
    async function saveItemOffline(item) {
      const queue = JSON.parse(await AsyncStorage.getItem('queue') || '[]');
      queue.push({ operation: 'create', data: item, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem('queue', JSON.stringify(queue));
      await AsyncStorage.setItem(`item_${item.id}`, JSON.stringify(item));
    }
    async function syncOffline() {
      const queue = JSON.parse(await AsyncStorage.getItem('queue') || '[]');
      if (!queue.length) return;
      try {
        const results = await api.post('/sync', { updates: queue });
        await AsyncStorage.setItem('queue', '[]');
        for (const result of results) {
          if (result.operation === 'create' || result.operation === 'update') {
            await AsyncStorage.setItem(`item_${result.id}`, JSON.stringify(result));
          }
        }
      } catch (err) {
        console.error('Sync failed', err);
      }
    }
    BackgroundFetch.configure({ minimumFetchInterval: 15 }, syncOffline);
    ```

- **Mobile (Swift, iOS)**:
  - Use Core Data with `BackgroundTasks`:
    ```swift
    class OfflineStore {
        let context: NSManagedObjectContext
        func saveItem(_ item: Item) async throws {
            let entity = NSEntityDescription.insertNewObject(forEntityName: "Item", into: context)
            entity.setValue(item.id, forKey: "id")
            entity.setValue(item.name, forKey: "name")
            try context.save()
            try await queueChange(operation: "create", data: item, timestamp: Date())
        }
        func queueChange(operation: String, data: Item, timestamp: Date) async throws {
            let change = NSEntityDescription.insertNewObject(forEntityName: "ChangeQueue", into: context)
            change.setValue(operation, forKey: "operation")
            change.setValue(try JSONEncoder().encode(data), forKey: "data")
            change.setValue(timestamp, forKey: "timestamp")
            try context.save()
        }
        func sync() async throws {
            let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: "ChangeQueue")
            let changes = try context.fetch(fetchRequest)
            let updates = changes.map { change in
                [
                    "operation": change.value(forKey: "operation") as! String,
                    "data": try! JSONDecoder().decode(Item.self, from: change.value(forKey: "data") as! Data),
                    "timestamp": change.value(forKey: "timestamp") as! Date
                ]
            }
            let response = try await URLSession.shared.data(for: URLRequest(url: URL(string: "http://localhost:5055/api/sync")!))
        }
    }
    BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.inventory.sync", using: nil) { task in
        Task { try await OfflineStore().sync(); task.setTaskCompleted(success: true) }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Use Room with WorkManager:
    ```kotlin
    @Entity
    data class ItemEntity(
        @PrimaryKey val id: String,
        val name: String,
        val quantity: Int
    )
    @Entity
    data class ChangeQueue(
        @PrimaryKey(autoGenerate = true) val id: Int = 0,
        val operation: String,
        val data: String,
        val timestamp: Long
    )
    @Dao
    interface InventoryDao {
        @Insert suspend fun insertItem(item: ItemEntity)
        @Insert suspend fun insertChange(change: ChangeQueue)
        @Query("SELECT * FROM ChangeQueue") suspend fun getChanges(): List<ChangeQueue>
        @Query("DELETE FROM ChangeQueue") suspend fun clearChanges()
    }
    class OfflineRepository(private val dao: InventoryDao, private val api: InventoryApi) {
        suspend fun saveItemOffline(item: Item) {
            dao.insertItem(ItemEntity(item.id, item.name, item.quantity))
            dao.insertChange(ChangeQueue(operation = "create", data = Gson().toJson(item), timestamp = System.currentTimeMillis()))
        }
        suspend fun sync() {
            val changes = dao.getChanges()
            val updates = changes.map { Gson().fromJson(it.data, Item::class.java) }
            try {
                api.sync(UpdatesRequest(updates))
                dao.clearChanges()
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
        override suspend fun doWork(): Result {
            val repository = OfflineRepository(/* inject */)
            repository.sync()
            return Result.success()
        }
    }
    ```

### Impact
- Ensures uninterrupted operation in low-connectivity environments.
- Maintains data consistency through background syncing.
- Critical for mobile users in remote or unstable network conditions.

### Related Considerations
- **Real-Time Updates**: Combine with hybrid sync strategies (Part 10, Section 10.4).
- **Performance Optimization**: Optimize local storage performance (Part 10, Section 10.9).