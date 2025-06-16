# Inventory App Design Document - Part 10.6: Analytics Dashboard with Visualizations

## 10.6 Analytics Dashboard with Visualizations

### Overview
Create a dashboard with visualizations to provide insights into inventory metrics.

### Why
Metrics like stock levels and low-stock alerts enhance decision-making for inventory managers.

### Implementation
- **Backend (Express.js)**:
  - Add `/api/analytics` endpoints:
    ```javascript
    router.get('/summary', async (req, res, next) => {
      try {
        const summary = await Item.aggregate([
          { $group: { _id: '$category', totalQuantity: { $sum: '$quantity' }, count: { $sum: 1 } } }
        ]);
        res.json(summary);
      } catch (err) { next(err); }
    });
    router.get('/low-stock', async (req, res, next) => {
      try {
        const threshold = parseInt(req.query.threshold) || 10;
        const items = await Item.find({ quantity: { $lte: threshold } });
        res.json(items);
      } catch (err) { next(err); }
    });
    ```

- **Web (Vue.js)**:
  - Create `Dashboard.vue`:
    ```vue
    <template>
      <div>
        <h2>Inventory Analytics</h2>
        <canvas ref="categoryChart"></canvas>
        <h3>Low Stock Items</h3>
        <ul>
          <li v-for="item in lowStock" :key="item._id">{{ item.name }}: {{ item.quantity }}</li>
        </ul>
      </div>
    </template>
    <script>
    import Chart from 'chart.js/auto';
    import { getItems } from '@/shared/api';
    export default {
      data: () => ({ categories: [], lowStock: [], chart: null }),
      async mounted() {
        const summary = await getItems('/analytics/summary');
        this.categories = summary;
        this.lowStock = await getItems('/analytics/low-stock?threshold=10');
        this.chart = new Chart(this.$refs.categoryChart, {
          type: 'bar',
          data: {
            labels: this.categories.map(c => c._id || 'Uncategorized'),
            datasets: [{
              label: 'Total Quantity',
              data: this.categories.map(c => c.totalQuantity),
              backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
              borderColor: ['#388E3C', '#1976D2', '#F57C00'],
              borderWidth: 1
            }]
          },
          options: { scales: { y: { beginAtZero: true } } }
        });
      }
    };
    </script>
    ```

- **Mobile (React Native)**:
  - Create `Dashboard.js`:
    ```javascript
    import { useState, useEffect } from 'react';
    import { BarChart } from 'react-native-chart-kit';
    import { getItems } from '@/shared/api';
    import { View, Text, FlatList } from 'react-native';

    export default function Dashboard() {
      const [categories, setCategories] = useState([]);
      const [lowStock, setLowStock] = useState([]);
      useEffect(() => {
        async function fetchData() {
          setCategories(await getItems('/analytics/summary'));
          setLowStock(await getItems('/analytics/low-stock?threshold=10'));
        }
        fetchData();
      }, []);
      return (
        <View>
          <Text>Category Breakdown</Text>
          <BarChart
            data={{
              labels: categories.map(c => c._id || 'Uncategorized'),
              datasets: [{ data: categories.map(c => c.totalQuantity) }]
            }}
            width={300}
            height={200}
            chartConfig={{ backgroundColor: '#e26a00', backgroundGradientFrom: '#fb8c00', backgroundGradientTo: '#ffa726', decimalPlaces: 0, color: () => '#fff' }}
          />
          <Text>Low Stock Items</Text>
          <FlatList data={lowStock} renderItem={({ item }) => <Text>{item.name}: {item.quantity}</Text>} />
        </View>
      );
    }
    ```

- **Mobile (Swift, iOS)**:
  - Use Swift Charts:
    ```swift
    import Charts
    struct DashboardView: View {
        @StateObject private var viewModel = AnalyticsViewModel()
        var body: some View {
            VStack {
                Text("Category Breakdown")
                Chart(viewModel.categories) { category in
                    BarMark(x: .value("Category", category.id), y: .value("Quantity", category.totalQuantity))
                }
                .frame(height: 200)
                Text("Low Stock Items")
                List(viewModel.lowStock) { item in
                    Text("\(item.name): \(item.quantity)")
                }
            }
        }
    }
    class AnalyticsViewModel: ObservableObject {
        @Published var categories: [CategorySummary] = []
        @Published var lowStock: [Item] = []
        struct CategorySummary: Identifiable {
            let id: String
            let totalQuantity: Int
        }
        init() {
            Task {
                let summaryData = try await URLSession.shared.data(from: URL(string: "http://localhost:5055/api/analytics/summary")!)
                self.categories = try JSONDecoder().decode([CategorySummary].self, from: summaryData.0)
                let lowStockData = try await URLSession.shared.data(from: URL(string: "http://localhost:5055/api/analytics/low-stock?threshold=10")!)
                self.lowStock = try JSONDecoder().decode([Item].self, from: lowStockData.0)
            }
        }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Use Charts library (e.g., MPAndroidChart):
    ```kotlin
    @Composable
    fun DashboardScreen(viewModel: AnalyticsViewModel = viewModel()) {
        Column {
            Text("Category Breakdown")
            AndroidView(factory = { context ->
                BarChart(context).apply {
                    data = BarData(viewModel.categories.mapIndexed { index, category ->
                        BarEntry(index.toFloat(), category.totalQuantity.toFloat())
                    }.let { BarDataSet(it, "Quantity").apply { colors = listOf(Color.GREEN, Color.BLUE) } }.let { BarData(it) })
                    invalidate()
                }
            }, modifier = Modifier.height(200.dp))
            Text("Low Stock Items")
            LazyColumn {
                items(viewModel.lowStock) { item ->
                    Text("${item.name}: ${item.quantity}")
                }
            }
        }
    }
    class AnalyticsViewModel : ViewModel() {
        private val _categories = MutableStateFlow<List<CategorySummary>>(emptyList())
        val categories: StateFlow<List<CategorySummary>> = _categories.asStateFlow()
        private val _lowStock = MutableStateFlow<List<Item>>(emptyList())
        val lowStock: StateFlow<List<Item>> = _lowStock.asStateFlow()
        data class CategorySummary(val id: String, val totalQuantity: Int)
        init {
            viewModelScope.launch {
                _categories.value = api.getSummary()
                _lowStock.value = api.getLowStock(threshold = 10)
            }
        }
    }
    ```

### Impact
- Provides actionable insights.
- Enhances decision-making.
- Increases business value.

### Related Considerations
- **Search and Filtering**: Refine analytics with search data (Part 10, Section 10.2).
- **Authentication**: Restrict dashboard access (Part 10, Section 10.1).