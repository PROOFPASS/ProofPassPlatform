# Integración Frontend - ProofPass API

Guía completa para integrar el API de ProofPass desde tu frontend en `proofpass.co`

## 🌐 Endpoints Base

```javascript
const API_BASE_URL = 'https://api.proofpass.co';
const API_VERSION = '/api/v1';
const API_URL = `${API_BASE_URL}${API_VERSION}`;
```

## 🔑 Autenticación

### Cliente HTTP con Auth

```javascript
// api-client.js
class ProofPassAPI {
  constructor(baseURL = 'https://api.proofpass.co/api/v1') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('proofpass_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('proofpass_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('proofpass_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter}s`);
      }

      // Handle auth errors
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async register(data) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  // Blockchain methods
  async anchorData(data, metadata = {}) {
    return await this.request('/blockchain/anchor', {
      method: 'POST',
      body: JSON.stringify({ data, metadata }),
    });
  }

  async verifyAnchor(txHash, data) {
    return await this.request('/blockchain/verify', {
      method: 'POST',
      body: JSON.stringify({ txHash, data }),
    });
  }

  async getTransaction(txHash) {
    return await this.request(`/blockchain/transactions/${txHash}`);
  }

  async getTransactionHistory(limit = 10) {
    return await this.request(`/blockchain/transactions?limit=${limit}`);
  }

  async getBlockchainInfo() {
    return await this.request('/blockchain/info');
  }

  // Attestations methods
  async createAttestation(data) {
    return await this.request('/attestations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAttestation(id) {
    return await this.request(`/attestations/${id}`);
  }

  async verifyAttestation(id) {
    return await this.request(`/attestations/${id}/verify`, {
      method: 'POST',
    });
  }

  // Passports methods
  async createPassport(data) {
    return await this.request('/passports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPassport(id) {
    return await this.request(`/passports/${id}`);
  }
}

// Export singleton instance
export const api = new ProofPassAPI();
```

## 📝 Ejemplos de Uso

### 1. Registro e Inicio de Sesión

```html
<!-- register-form.html -->
<form id="registerForm">
  <input type="email" id="email" placeholder="Email" required>
  <input type="password" id="password" placeholder="Password" required>
  <input type="text" id="name" placeholder="Name" required>
  <input type="text" id="organization" placeholder="Organization">
  <button type="submit">Register</button>
</form>

<script type="module">
import { api } from './api-client.js';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    name: document.getElementById('name').value,
    organization: document.getElementById('organization').value || undefined,
  };

  try {
    const response = await api.register(data);
    console.log('Registered:', response.user);

    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});
</script>
```

### 2. Anclar Certificación en Blockchain

```html
<!-- certification-form.html -->
<div id="certificationSection">
  <h2>Anclar Certificación</h2>
  <textarea id="certData" placeholder="Datos de certificación"></textarea>
  <input type="text" id="certType" placeholder="Tipo (ej: USDA Organic)">
  <button id="anchorBtn">Anclar en Blockchain</button>
  <div id="result"></div>
</div>

<script type="module">
import { api } from './api-client.js';

document.getElementById('anchorBtn').addEventListener('click', async () => {
  const data = document.getElementById('certData').value;
  const type = document.getElementById('certType').value;
  const resultDiv = document.getElementById('result');

  if (!data) {
    alert('Por favor ingresa los datos');
    return;
  }

  try {
    resultDiv.innerHTML = '<p>⏳ Anclando en blockchain...</p>';

    const response = await api.anchorData(data, {
      type: type || 'certification',
      timestamp: new Date().toISOString()
    });

    resultDiv.innerHTML = `
      <div class="success">
        <h3>✅ Certificación Anclada</h3>
        <p><strong>TX Hash:</strong> ${response.txHash}</p>
        <p><strong>Data Hash:</strong> ${response.dataHash}</p>
        <p><strong>Network:</strong> ${response.network}</p>
        <p><strong>Fecha:</strong> ${new Date(response.timestamp).toLocaleString()}</p>
        <a href="https://stellar.expert/explorer/${response.network}/tx/${response.txHash}"
           target="_blank">
          Ver en Block Explorer
        </a>
      </div>
    `;

    // Save TX hash for verification
    localStorage.setItem('lastTxHash', response.txHash);
    localStorage.setItem('lastData', data);

  } catch (error) {
    resultDiv.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
  }
});
</script>
```

### 3. Verificar Certificación

```html
<!-- verify-certification.html -->
<div id="verifySection">
  <h2>Verificar Certificación</h2>
  <input type="text" id="txHash" placeholder="Hash de Transacción">
  <textarea id="originalData" placeholder="Datos originales"></textarea>
  <button id="verifyBtn">Verificar</button>
  <div id="verifyResult"></div>
</div>

<script type="module">
import { api } from './api-client.js';

// Auto-cargar último TX hash si existe
const lastTxHash = localStorage.getItem('lastTxHash');
const lastData = localStorage.getItem('lastData');
if (lastTxHash && lastData) {
  document.getElementById('txHash').value = lastTxHash;
  document.getElementById('originalData').value = lastData;
}

document.getElementById('verifyBtn').addEventListener('click', async () => {
  const txHash = document.getElementById('txHash').value;
  const data = document.getElementById('originalData').value;
  const resultDiv = document.getElementById('verifyResult');

  if (!txHash || !data) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    resultDiv.innerHTML = '<p>⏳ Verificando...</p>';

    // Get transaction details
    const tx = await api.getTransaction(txHash);

    // Verify data
    const verification = await api.verifyAnchor(txHash, data);

    if (verification.valid) {
      resultDiv.innerHTML = `
        <div class="success">
          <h3>✅ Verificación Exitosa</h3>
          <p>Los datos coinciden con el hash almacenado en blockchain.</p>
          <p><strong>TX:</strong> ${tx.hash}</p>
          <p><strong>Fecha:</strong> ${new Date(tx.createdAt).toLocaleString()}</p>
          <p><strong>Estado:</strong> ${tx.successful ? 'Exitosa' : 'Fallida'}</p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="error">
          <h3>❌ Verificación Fallida</h3>
          <p>Los datos NO coinciden con el hash almacenado.</p>
        </div>
      `;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
  }
});
</script>
```

### 4. Dashboard con Historial

```html
<!-- dashboard.html -->
<div id="dashboard">
  <div id="userInfo"></div>
  <h2>Historial de Transacciones</h2>
  <div id="transactionHistory"></div>
</div>

<script type="module">
import { api } from './api-client.js';

async function loadDashboard() {
  try {
    // Load user info
    const user = await api.getMe();
    document.getElementById('userInfo').innerHTML = `
      <h2>Bienvenido, ${user.name}</h2>
      <p>${user.email}</p>
      <p>Organización: ${user.organization || 'N/A'}</p>
    `;

    // Load transaction history
    const { transactions } = await api.getTransactionHistory(20);

    const historyHTML = transactions.map(tx => `
      <div class="transaction-card">
        <div class="tx-header">
          <span class="badge ${tx.successful ? 'success' : 'failed'}">
            ${tx.successful ? '✓' : '✗'}
          </span>
          <span class="tx-date">${new Date(tx.createdAt).toLocaleString()}</span>
        </div>
        <div class="tx-body">
          <p><strong>Hash:</strong> <code>${tx.hash.substring(0, 20)}...</code></p>
          <p><strong>Operaciones:</strong> ${tx.operationCount}</p>
          <p><strong>Fee:</strong> ${parseFloat(tx.feeCharged) / 10000000} XLM</p>
        </div>
        <a href="https://stellar.expert/explorer/testnet/tx/${tx.hash}" target="_blank">
          Ver detalles
        </a>
      </div>
    `).join('');

    document.getElementById('transactionHistory').innerHTML = historyHTML ||
      '<p>No hay transacciones aún</p>';

  } catch (error) {
    if (error.message === 'Authentication required') {
      window.location.href = '/login.html';
    } else {
      console.error('Error loading dashboard:', error);
    }
  }
}

// Load on page load
loadDashboard();
</script>
```

### 5. Widget Embebible para Verificación

```html
<!-- verification-widget.html -->
<!-- Widget que puede ser embebido en cualquier página -->

<div id="proofpass-widget" data-tx-hash="">
  <div class="widget-loading">Cargando verificación...</div>
</div>

<script src="https://proofpass.co/widget.js"></script>

<script>
// widget.js
(function() {
  const API_URL = 'https://api.proofpass.co/api/v1';

  async function loadVerification(txHash) {
    const widget = document.getElementById('proofpass-widget');

    try {
      const response = await fetch(`${API_URL}/blockchain/transactions/${txHash}`);
      const tx = await response.json();

      widget.innerHTML = `
        <div class="proofpass-verification">
          <div class="badge ${tx.successful ? 'verified' : 'failed'}">
            ${tx.successful ? '✓ Verificado' : '✗ No verificado'}
          </div>
          <p><strong>Fecha:</strong> ${new Date(tx.createdAt).toLocaleString()}</p>
          <p><strong>Network:</strong> Stellar ${tx.network || 'Mainnet'}</p>
          <a href="https://stellar.expert/explorer/public/tx/${tx.hash}"
             target="_blank"
             class="explorer-link">
            Ver en Blockchain Explorer
          </a>
        </div>
      `;
    } catch (error) {
      widget.innerHTML = `
        <div class="proofpass-error">
          Error al cargar verificación
        </div>
      `;
    }
  }

  // Auto-load si hay TX hash en data attribute
  const widget = document.getElementById('proofpass-widget');
  const txHash = widget.dataset.txHash;

  if (txHash) {
    loadVerification(txHash);
  }

  // Export global function
  window.ProofPass = { loadVerification };
})();
</script>

<style>
.proofpass-widget {
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.badge.verified {
  background: #28a745;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  display: inline-block;
}

.explorer-link {
  color: #667eea;
  text-decoration: none;
}
</style>
```

## 🎨 Estilos CSS Recomendados

```css
/* proofpass-styles.css */

:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #28a745;
  --error-color: #dc3545;
  --text-color: #333;
  --border-radius: 8px;
}

.proofpass-card {
  background: white;
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.proofpass-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s;
}

.proofpass-btn:hover {
  transform: translateY(-2px);
}

.proofpass-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 16px;
  margin-bottom: 10px;
}

.proofpass-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.success {
  background: #d4edda;
  border-left: 4px solid var(--success-color);
  padding: 15px;
  border-radius: var(--border-radius);
}

.error {
  background: #f8d7da;
  border-left: 4px solid var(--error-color);
  padding: 15px;
  border-radius: var(--border-radius);
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge.success {
  background: var(--success-color);
  color: white;
}

.badge.failed {
  background: var(--error-color);
  color: white;
}
```

## 📦 NPM Package (Opcional)

Si quieres publicar un package npm para facilitar la integración:

```javascript
// @proofpass/client
export class ProofPassClient {
  // ... (usar el código de api-client.js)
}

// Instalación:
// npm install @proofpass/client

// Uso:
import { ProofPassClient } from '@proofpass/client';
const client = new ProofPassClient();
await client.login('email@example.com', 'password');
```

## 🔒 Mejores Prácticas de Seguridad

### 1. Nunca expongas tokens en el código

```javascript
// ❌ MAL
const API_KEY = 'sk_live_abc123...';

// ✅ BIEN
const token = localStorage.getItem('proofpass_token');
```

### 2. Maneja errores de autenticación

```javascript
// ✅ BIEN
api.request('/protected-endpoint')
  .catch(error => {
    if (error.message === 'Authentication required') {
      // Redirect to login
      window.location.href = '/login.html';
    }
  });
```

### 3. Implementa refresh token (futuro)

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const { token } = await response.json();
  api.setToken(token);
}
```

## 📊 Monitoreo de Rate Limits

```javascript
// Leer headers de rate limit
function handleRateLimit(response) {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  console.log(`Rate limit: ${remaining}/${limit} remaining`);

  if (remaining < 10) {
    console.warn('Approaching rate limit!');
  }
}
```

## 🆘 Troubleshooting

### CORS Errors

Si ves errores de CORS, verifica:
1. El dominio está en `CORS_ORIGIN` del API
2. Estás usando HTTPS en producción
3. Headers correctos en requests

### 401 Unauthorized

```javascript
// Debug auth issues
console.log('Token:', api.token);
console.log('Stored token:', localStorage.getItem('proofpass_token'));
```

### Network Errors

```javascript
// Retry logic
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

## 📚 Recursos

- [API Documentation](https://api.proofpass.co/docs)
- [Example App](https://github.com/proofpass/example-app)
- [Support](mailto:support@proofpass.co)
