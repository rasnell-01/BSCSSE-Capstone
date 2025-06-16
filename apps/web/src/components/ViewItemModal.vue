<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Item Details</h2>
      <div class="space-y-2 mb-4">
        <p><strong>Name:</strong> <input v-model="editableItem.name" class="w-full border rounded px-2 py-1" /></p>
        <p><strong>Quantity:</strong> <input v-model.number="editableItem.quantity" type="number" class="w-full border rounded px-2 py-1" /></p>
        <p><strong>Location:</strong> <input v-model="editableItem.location" class="w-full border rounded px-2 py-1" /></p>
        <p><strong>Description:</strong> <textarea v-model="editableItem.description" class="w-full border rounded px-2 py-1" rows="3"></textarea></p>
      </div>
      <div class="flex justify-between">
        <button @click="$emit('close')" class="px-4 py-2 border rounded">Close</button>
        <button
          @click="updateItem"
          :disabled="loading || !editableItem.name || editableItem.quantity < 0"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
const props = defineProps({ item: Object })
const emit = defineEmits(['refresh', 'close'])

const editableItem = reactive({ name: '', quantity: 0, location: '', description: '', _id: '' })

watch(() => props.item, (val) => {
  Object.assign(editableItem, val)
}, { immediate: true })

import { updateItem as updateItemApi } from '@shared/api'

const loading = ref(false)

const updateItem = async () => {
  loading.value = true
  try {
    editableItem.name = String(editableItem.name).trim()
    editableItem.location = String(editableItem.location).trim()
    editableItem.description = String(editableItem.description).trim()
    await updateItemApi(editableItem._id, editableItem)
    emit('refresh')
    emit('close')
  } catch (err) {
    console.error('Error updating item:', err)
    alert('Could not update item.')
  } finally {
    loading.value = false
  }
}
</script>
