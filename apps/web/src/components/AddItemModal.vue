<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Add New Item</h2>
      <form @submit.prevent="submitItem" class="space-y-4">
        <div>
          <label class="block text-gray-700">Name</label>
          <input v-model="name" type="text" class="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label class="block text-gray-700">Quantity</label>
          <input v-model.number="quantity" type="number" min="0" class="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label class="block text-gray-700">Location</label>
          <input v-model="location" type="text" class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-gray-700">Description</label>
          <textarea v-model="description" class="w-full border rounded px-3 py-2" rows="3"></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button type="button" class="px-4 py-2 border rounded" @click="$emit('close')">Cancel</button>
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createItem } from '@shared/api'

const emit = defineEmits(['refresh', 'close'])

const name = ref('')
const quantity = ref(1)
const location = ref('')
const description = ref('')

const submitItem = async () => {
  const newItem = { name: name.value, quantity: quantity.value, location: location.value, description: description.value }

  try {
    await createItem(newItem)
    emit('refresh')
    emit('close')
  } catch (err) {
    console.error('Error adding item:', err)
    alert('Could not add item.')
  }
}
</script>
