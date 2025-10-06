# 🔐 Security Implementation Guide

This document explains the secure authentication system implemented in Study Buddy, focusing on HTTP-only cookies, JWT handling, and CSRF protection.

## 🛡️ Security Features Implemented

### 1. HTTP-Only Cookies
- **Access Token**: Short-lived (15 minutes), stored in HTTP-only cookie
- **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie
- **CSRF Token**: Session-based, stored in HTTP-only cookie

### 2. JWT Implementation
- **Access Tokens**: Short-lived for API requests
- **Refresh Tokens**: Long-lived for token renewal
- **Secure Signing**: Separate secrets for access and refresh tokens

### 3. CSRF Protection
- **CSRF Tokens**: Required for all state-changing operations
- **SameSite**: Strict cookie policy
- **Origin Validation**: CORS configuration

## 🔧 Backend Security Configuration

### Environment Variables
```env
# JWT Secrets (Generate strong, random secrets)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters_long

# Security Settings
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_DOMAIN=yourdomain.com
```

### Cookie Configuration
```javascript
// Access Token Cookie (15 minutes)
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
}

// Refresh Token Cookie (7 days)
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

// CSRF Token Cookie (1 hour)
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
}
```

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
```

## 🚀 Frontend Security Implementation

### Axios Configuration
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### CSRF Token Handling
```javascript
// Request interceptor adds CSRF token
api.interceptors.request.use((config) => {
  if (config.method !== 'get' && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### Automatic Token Refresh
```javascript
// Response interceptor handles token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 🔒 Security Benefits

### 1. XSS Protection
- **HTTP-only cookies** cannot be accessed by JavaScript
- **No localStorage** token storage eliminates XSS token theft
- **Content Security Policy** prevents script injection

### 2. CSRF Protection
- **CSRF tokens** required for state-changing operations
- **SameSite cookies** prevent cross-site request forgery
- **Origin validation** ensures requests come from trusted domains

### 3. Session Security
- **Short-lived access tokens** limit exposure window
- **Automatic token refresh** provides seamless user experience
- **Token revocation** on logout ensures clean session termination

### 4. Transport Security
- **Secure cookies** in production (HTTPS only)
- **CORS configuration** restricts cross-origin requests
- **Rate limiting** prevents brute force attacks

## 🛠️ Implementation Details

### Backend Routes
```javascript
// Login endpoint
POST /api/auth/login
- Validates credentials
- Issues access and refresh tokens as HTTP-only cookies
- Returns user data

// Refresh endpoint
POST /api/auth/refresh
- Validates refresh token
- Issues new access token
- Updates cookies

// Logout endpoint
POST /api/auth/logout
- Revokes refresh token
- Clears all cookies
- Invalidates session

// CSRF token endpoint
GET /api/csrf-token
- Returns CSRF token for forms
- Sets CSRF cookie
```

### Frontend Components
```javascript
// Login component
const handleSubmit = async (e) => {
  const response = await authAPI.login(formData);
  await onLogin(response.data.user); // No token handling needed
};

// Logout component
const handleLogout = async () => {
  await authAPI.logout(); // Clears all cookies server-side
  setUser(null);
};
```

## 🔍 Security Testing

### Manual Testing Checklist
- [ ] Verify cookies are HTTP-only
- [ ] Test token expiration and refresh
- [ ] Validate CSRF protection on forms
- [ ] Check CORS configuration
- [ ] Test logout functionality
- [ ] Verify secure cookie settings in production

### Automated Testing
```javascript
// Example security test
describe('Authentication Security', () => {
  it('should set HTTP-only cookies', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(validCredentials);
    
    expect(response.headers['set-cookie']).toContain('HttpOnly');
  });
});
```

## 🚨 Security Considerations

### Production Deployment
1. **Generate Strong Secrets**: Use cryptographically secure random strings
2. **Enable HTTPS**: Required for secure cookies
3. **Set Proper CORS**: Restrict to your domain only
4. **Monitor Logs**: Watch for suspicious activity
5. **Regular Updates**: Keep dependencies updated

### Common Pitfalls
1. **Weak Secrets**: Use strong, random JWT secrets
2. **Insecure Cookies**: Always use secure flag in production
3. **CORS Misconfiguration**: Don't use wildcard origins with credentials
4. **Token Storage**: Never store tokens in localStorage
5. **CSRF Bypass**: Always validate CSRF tokens

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [HTTP-Only Cookies](https://owasp.org/www-community/HttpOnly)
- [CSRF Prevention](https://owasp.org/www-community/attacks/csrf)

## 🔧 Troubleshooting

### Common Issues
1. **CORS Errors**: Check origin configuration
2. **Cookie Not Set**: Verify secure flag and domain
3. **CSRF Errors**: Ensure token is included in requests
4. **Token Refresh Fails**: Check refresh token validity

### Debug Mode
```javascript
// Enable detailed logging
DEBUG=auth:* npm start

// Check cookie settings
console.log('Cookies:', document.cookie); // Should be empty (HTTP-only)
```

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures as new threats emerge and best practices evolve.
