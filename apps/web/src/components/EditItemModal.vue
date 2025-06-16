<template>
  <div class="form-inline">
    <div class="form-inline">
      <h2>Edit Item</h2>
      <form @submit.prevent="updateItem">
        <input v-model="form.name" placeholder="Name" required />
        <input v-model.number="form.quantity" type="number" placeholder="Quantity" required />
        <input v-model="form.description" placeholder="Description" />
        <input v-model="form.location" placeholder="Location" />
        <button
          type="submit"
          :disabled="loading || !form.name || form.quantity < 0"
        >
          Save
        </button>
        <button @click="$emit('close')">Cancel</button>
      </form>
    </div>
  </div>
</template>

<script>
import api from '@shared/api';

export default {
  props: ['show', 'item'],
  data() {
    return {
      form: { ...this.item },
      loading: false,
    };
  },
  watch: {
    item(newVal) {
      this.form = { ...newVal };
    },
  },
  methods: {
    async updateItem() {
      this.loading = true;
      try {
        this.form.name = String(this.form.name).trim();
        this.form.description = String(this.form.description).trim();
        this.form.location = String(this.form.location).trim();
        await api.put(`/items/${this.form._id}`, this.form);
        this.$emit('updated');
        this.$emit('close');
      } catch (err) {
        console.error('Error updating item:', err);
        alert('Could not update item.');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* .modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
} */

.form-inline {
  background: white;
  color: black;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  /* Additional styles can be inherited from existing PCSS */
}

input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
}

button {
  margin-right: 0.5rem;
}
</style>
