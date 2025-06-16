<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2 class="text-white text-lg font-semibold mb-4">Confirm Deletion</h2>
      <p class="text-gray-300 mb-4">Are you sure you want to delete "{{ item?.name }}"?</p>
      <div class="flex justify-end">
        <button class="mr-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded" @click="$emit('cancel')">Cancel</button>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded" @click="confirmDelete">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { deleteItem } from "@shared/api.js";

defineProps({
  item: Object
})
const emit = defineEmits(['confirm', 'cancel'])

const confirmDelete = () => {
  emit('confirm')
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50;
}

.modal-content {
  @apply bg-gray-800 p-6 rounded-lg shadow-lg;
}
</style>
