<template>
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <!-- Navigation Header -->
    <header class="bg-white shadow-md">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <nav class="space-x-4">
          <RouterLink
              v-if="route.name === 'AddItem' || route.name === 'EditItem'"
              to="/"
              class="text-gray-700 hover:text-blue-600 font-medium"
          >
            Home
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Router View -->
    <main class="py-8 px-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style>

body {
  font-family: 'Inter', sans-serif;
}
</style>
