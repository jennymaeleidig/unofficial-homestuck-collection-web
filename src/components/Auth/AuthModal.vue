<template>
  <div class="auth-modal-overlay" v-if="isVisible">
    <div class="auth-modal">
      <h2>{{ isLogin ? "Login" : "Sign Up" }}</h2>
      <br />
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <button type="submit">{{ isLogin ? "Login" : "Sign Up" }}</button>
      </form>
      <p @click="toggleMode">
        {{
          isLogin
            ? "Need an account? Sign Up"
            : "Already have an account? Login"
        }}
      </p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

const API_BASE_URL =
  typeof window !== "undefined" && window.webAppAuthServerUrl
    ? `${window.webAppAuthServerUrl}/api`
    : typeof process !== "undefined" && process.env.AUTH_SERVER_URL
    ? `${process.env.AUTH_SERVER_URL}/api`
    : "http://localhost:9413/api";

export default {
  name: "AuthModal",
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLogin: true,
      username: "",
      password: "",
      errorMessage: "",
      successMessage: ""
    };
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin;
      this.errorMessage = "";
      this.successMessage = "";
    },
    async handleSubmit() {
      this.errorMessage = "";
      try {
        let response;
        if (this.isLogin) {
          response = await axios.post(`${API_BASE_URL}/login`, {
            username: this.username,
            password: this.password
          });
        } else {
          response = await axios.post(`${API_BASE_URL}/signup`, {
            username: this.username,
            password: this.password
          });
        }

        if (
          response.data.message === "success" ||
          response.data.success ||
          response.status === 201
        ) {
          // Store JWT token if present
          if (response.data.token) {
            localStorage.setItem("jwt_token", response.data.token);
          }
          if (this.isLogin) {
            // For login, emit success immediately
            this.$emit("auth-success", response.data);
          } else {
            // For signup, show success message and then emit success
            this.successMessage = `Account created successfully! Welcome, ${response
              .data.username || this.username}!`;
            // Clear form fields
            this.username = "";
            this.password = "";
            // Emit success event after a short delay to allow user to see success message
            setTimeout(() => {
              this.$emit("auth-success", response.data);
            }, 1500);
          }
        }
      } catch (error) {
        this.errorMessage =
          error.response?.data?.error || "An unexpected error occurred.";
        console.error("Authentication error:", error);
      }
    }
  }
};
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.auth-modal {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  margin-bottom: 15px;
}

h2 {
  margin-bottom: 20px; /* Add space between header and form */
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 200px; /* Adjust width as needed */
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

p {
  margin-top: 10px;
  color: #007bff;
  cursor: pointer;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
  font-weight: bold;
}
</style>
