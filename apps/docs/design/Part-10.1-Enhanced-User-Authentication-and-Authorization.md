# Inventory App Design Document - Part 10.1: Enhanced User Authentication and Authorization

## 10.1 Enhanced User Authentication and Authorization

### Overview
Implement JWT-based authentication with Role-Based Access Control (RBAC) to enhance security and support multi-user collaboration.

### Why
Authentication restricts access to authorized users, and RBAC enables role-specific permissions (e.g., Admins can delete items, Viewers can only read), which is essential for collaborative environments like warehouse teams.

### Implementation
- **Backend (Express.js)**:
  - Add `User` model:
    ```javascript
    const mongoose = require('mongoose');
    const bcrypt = require('bcrypt');
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'manager', 'viewer'], default: 'viewer' }
    });
    userSchema.pre('save', async function(next) {
      if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
      next();
    });
    module.exports = mongoose.model('User', userSchema);
    ```
  - Create `/api/auth` endpoints:
    ```javascript
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcrypt');
    const router = express.Router();
    const User = require('../models/User');
    router.post('/register', async (req, res, next) => {
      try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'User created' });
      } catch (err) { next(err); }
    });
    router.post('/login', async (req, res, next) => {
      try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '1h' });
        res.json({ token });
      } catch (err) { next(err); }
    });
    module.exports = router;
    ```
  - Protect routes:
    ```javascript
    const jwt = require('jsonwebtoken');
    const auth = (roles = []) => (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });
      try {
        const decoded = jwt.verify(token, 'secret');
        if (roles.length && !roles.includes(decoded.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        req.user = decoded;
        next();
      } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
    router.delete('/:id', auth(['admin']), async (req, res, next) => { /* Deletion logic */ });
    ```

- **Web (Vue.js)**:
  - Add `Login.vue`:
    ```vue
    <template>
      <div class="modal">
        <form @submit.prevent="login">
          <input v-model="username" placeholder="Username" required />
          <input v-model="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>
    </template>
    <script>
    import { getItems } from '@/shared/api';
    export default {
      data: () => ({ username: '', password: '' }),
      methods: {
        async login() {
          try {
            const { token } = await this.$api.post('/auth/login', {
              username: this.username,
              password: this.password
            });
            localStorage.setItem('token', token);
            this.$router.push('/');
          } catch (err) {
            alert('Login failed');
          }
        }
      }
    };
    </script>
    ```
  - Update `shared/api.js`:
    ```javascript
    import axios from 'axios';
    const api = axios.create({
      baseURL: 'http://localhost:5055/api',
      headers: { 'Content-Type': 'application/json' }
    });
    api.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    export const getItems = async (params = {}) => {
      try {
        const { data } = await api.get('/items', { params });
        return data;
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

- **Mobile (React Native)**:
  - Add `Login.js`:
    ```javascript
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import { useNavigation } from '@react-navigation/native';
    import { useState } from 'react';
    import { View, TextInput, Button } from 'react-native';
    import { getItems } from '../shared/api';

    export default function Login() {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const navigation = useNavigation();
      const login = async () => {
        try {
          const { token } = await getItems('/auth/login', { method: 'POST', data: { username, password } });
          await AsyncStorage.setItem('token', token);
          navigation.navigate('HomePage');
        } catch (err) {
          alert('Login failed');
        }
      };
      return (
        <View>
          <TextInput value={username} onChangeText={setUsername} placeholder="Username" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button title="Login" onPress={login} />
        </View>
      );
    }
    ```

- **Mobile (Swift, iOS)**:
  - Add `LoginView.swift`:
    ```swift
    struct LoginView: View {
        @State private var username = ""
        @State private var password = ""
        @EnvironmentObject var auth: AuthViewModel
        var body: some View {
            VStack {
                TextField("Username", text: $username)
                SecureField("Password", text: $password)
                Button("Login") {
                    Task { await auth.login(username: username, password: password) }
                }
            }
        }
    }
    class AuthViewModel: ObservableObject {
        func login(username: String, password: String) async {
            do {
                let response = try await URLSession.shared.data(for: URLRequest(url: URL(string: "http://localhost:5055/api/auth/login")!))
                let token = // Parse JSON
                try await KeychainWrapper.standard.set(token, forKey: "authToken")
            } catch { /* Show error */ }
        }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Add `LoginScreen.kt`:
    ```kotlin
    @Composable
    fun LoginScreen(navController: NavController, viewModel: AuthViewModel = viewModel()) {
        var username by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        Column {
            TextField(value = username, onValueChange = { username = it }, label = { Text("Username") })
            TextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation())
            Button(onClick = { viewModel.login(username, password) { navController.navigate("home") } }) {
                Text("Login")
            }
        }
    }
    class AuthViewModel : ViewModel() {
        fun login(username: String, password: String, onSuccess: () -> Unit) {
            viewModelScope.launch {
                try {
                    val response = api.login(LoginRequest(username, password))
                    // Save token to SharedPreferences
                    onSuccess()
                } catch (e: Exception) {
                    // Show error
                }
            }
        }
    }
    ```

### Impact
- Enhances security by restricting access to authorized users.
- Supports enterprise use with role-based collaboration.

### Related Considerations
- **Rate Limiting**: Prevent brute-force attacks (see **Deployment and Future Considerations**, Part 11).
- **Internationalization**: Store user language preferences (Part 10, Section 10.7).