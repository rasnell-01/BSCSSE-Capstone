<template>
  <div class="p-4 max-w-4xl mx-auto">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Inventory Dashboard</h1>
      <p class="text-gray-500">Track and manage your inventory in real-time.</p>
    </header>

    <section class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-700">Items</h2>
        <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            @click="goToAddItem"
        >
          + Add Item
        </button>
      </div>

      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-800">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
        </tr>
        </thead>
        <tbody class="bg-gray-900 divide-y divide-gray-700">
        <tr v-for="item in items" :key="item._id || item.id">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.quantity }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.location || 'N/A' }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.description || 'N/A' }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button
                @click.stop="openEditModal(item)"
                class="text-sm text-white bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
                @click.stop="confirmDelete(item)"
                class="ml-2 text-sm text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
            >
              Delete
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </section>

    <section class="form-section" v-if="showAddModal">
      <h2 class="form-heading">Add New Item</h2>
      <AddItemModal @close="showAddModal = false" @refresh="loadItems" />
    </section>
    <ViewItemModal
        v-if="showViewModal"
        :item="selectedItem"
        @close="showViewModal = false"
        @refresh="loadItems"
    />
    <section class="form-section" v-if="showEditModal">
      <h2 class="form-heading">Edit Item</h2>
      <EditItemModal :item="selectedItem" @close="showEditModal = false" @updated="loadItems" />
    </section>
    <DeleteItemModal
      v-if="showDeleteConfirm"
      :item="itemToDelete"
      @cancel="cancelDelete"
      @confirm="deleteItem"
    />
  </div>
</template>

<script setup>

import {onMounted, ref} from 'vue'
import ViewItemModal from '@/components/ViewItemModal.vue'
import AddItemModal from '@/components/AddItemModal.vue'
import EditItemModal from "@/components/EditItemModal.vue";
import DeleteItemModal from '@/components/DeleteItemModal.vue'
import { fetchItems } from '@shared/api';

const items = ref([])
const showAddModal = ref(false)
const selectedItem = ref(null)
const showViewModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const itemToDelete = ref(null)

const loadItems = async () => {
  try {
    const res = await fetchItems();
    console.log('Fetch items:', res.data)
    items.value = res.data;
  } catch (err) {
    console.error('Failed to fetch items:', err);
  }
};

const goToAddItem = () => {
  showAddModal.value = true
}

const openEditModal = (item) => {
  selectedItem.value = item
  showEditModal.value = true
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  itemToDelete.value = null
  showDeleteConfirm.value = false
}

const deleteItem = async () => {
  if (!itemToDelete.value || !itemToDelete.value._id) return;
  try {
    await fetch(`http://localhost:5055/api/items/${itemToDelete.value._id}`, {
      method: 'DELETE'
    });
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
    await loadItems();
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
};

onMounted(loadItems)
</script>
