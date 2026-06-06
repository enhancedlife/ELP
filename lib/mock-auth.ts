// Simple mock authentication for test account
// This bypasses Supabase and uses cookies for session management

const TEST_USER = {
  email: "test@test.com",
  password: "test",
  id: "test-user-123",
  name: "Test User"
}

export function isTestAccount(email: string, password: string): boolean {
  return email === TEST_USER.email && password === TEST_USER.password
}

export function getTestUser() {
  return {
    id: TEST_USER.id,
    email: TEST_USER.email,
    name: TEST_USER.name
  }
}

export function setMockSession() {
  if (typeof window !== 'undefined') {
    document.cookie = `mock_auth_session=${TEST_USER.id}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
    localStorage.setItem('mock_user', JSON.stringify(getTestUser()))
  }
}

export function clearMockSession() {
  if (typeof window !== 'undefined') {
    document.cookie = 'mock_auth_session=; path=/; max-age=0'
    localStorage.removeItem('mock_user')
  }
}

export function getMockUser() {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('mock_user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export function hasMockSession(): boolean {
  if (typeof window !== 'undefined') {
    return document.cookie.includes('mock_auth_session=')
  }
  return false
}
