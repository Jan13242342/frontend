<template>
  <div class="register-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form" label-position="left">
      <div class="title-container">
        <h3 class="title">Register</h3>
      </div>

      <el-form-item prop="email">
        <el-input
          v-model="registerForm.email"
          placeholder="Email"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item prop="code">
        <el-row :gutter="10">
          <el-col :span="16">
            <el-input
              v-model="registerForm.code"
              placeholder="Verification Code"
              autocomplete="off"
            />
          </el-col>
          <el-col :span="8" style="display: flex; align-items: center;">
            <el-button
              :disabled="emailSending || !registerForm.email"
              @click="sendCode"
            >
              {{ emailSending ? countdown + 's' : 'Send Code' }}
            </el-button>
            <span v-if="testCode" style="margin-left:8px;color:#409EFF;">{{ testCode }}</span>
          </el-col>
        </el-row>
      </el-form-item>

      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          placeholder="Username"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="Password"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="Confirm Password"
          autocomplete="off"
        />
      </el-form-item>

      <el-button
        :loading="loading"
        type="primary"
        style="width:100%;margin-bottom:20px;"
        @click.native.prevent="handleRegister"
      >
        Register
      </el-button>
      <el-button type="text" style="width:100%;" @click="goLogin">
        Already have an account? Login
      </el-button>
    </el-form>
  </div>
</template>

<script>
import { sendRegisterEmailCode, register } from '@/api/user'

export default {
  name: 'Register',
  data() {
    return {
      registerForm: {
        email: '',
        code: '',
        username: '',
        password: '',
        confirmPassword: ''
      },
      loading: false,
      emailSending: false,
      countdown: 60,
      timer: null,
      testCode: '', // For testing: show code
      registerRules: {
        email: [
          { required: true, message: 'Please enter email', trigger: 'blur' },
          { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
        ],
        code: [{ required: true, message: 'Please enter verification code', trigger: 'blur' }],
        username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
        password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
        confirmPassword: [
          { required: true, message: 'Please confirm password', trigger: 'blur' },
          { validator: (rule, value, callback) => {
            if (value !== this.registerForm.password) {
              callback(new Error('Passwords do not match'))
            } else {
              callback()
            }
          }, trigger: 'blur'
          }
        ]
      }
    }
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    async sendCode() {
      if (!this.registerForm.email) {
        this.$message.error('Please enter email')
        return
      }
      this.emailSending = true
      this.countdown = 60
      try {
        const res = await sendRegisterEmailCode(this.registerForm.email)
        this.testCode = res.data.code // For testing
        console.log('Verification code:', res.data.code)
        this.$message.success('Verification code sent to your email')
      } catch (e) {
        const msg =
          e?.response?.data?.msg_en ||
          e?.response?.data?.detail?.msg_en ||
          e?.response?.data?.msg ||
          e?.response?.data?.detail?.msg ||
          e?.message ||
          'Failed to send code'
        this.$message.error(msg)
        this.emailSending = false
        return
      }
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.emailSending = false
        }
      }, 1000)
    },
    async handleRegister() {
      this.$refs.registerForm.validate(async valid => {
        if (valid) {
          this.loading = true
          try {
            const data = {
              username: this.registerForm.username,
              email: this.registerForm.email,
              password: this.registerForm.password,
              code: this.registerForm.code
            }
            await register(data)
            this.$message.success('Register success! Please login.')
            this.$router.push({ path: '/login' })
          } catch (e) {
            const msg =
              e?.response?.data?.msg_en ||
              e?.response?.data?.detail?.msg_en ||
              e?.response?.data?.msg ||
              e?.response?.data?.detail?.msg ||
              e?.message ||
              'Register failed'
            this.$message.error(msg)
          } finally {
            this.loading = false
          }
        }
      })
    },
    goLogin() {
      this.$router.push({ path: '/login' })
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2d3a4b;
}
.register-form {
  width: 400px;
  background: #fff;
  border-radius: 8px;
  padding: 40px 30px 20px 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.title-container {
  text-align: center;
  margin-bottom: 30px;
}
.title {
  font-size: 26px;
  color: #333;
  font-weight: bold;
}
</style>
