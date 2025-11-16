// js/utils.js

// =============================================
// CONFIGURAÇÕES GLOBAIS
// =============================================

const API_BASE = 'http://localhost:3000/api';
let currentUser = null;
let token = localStorage.getItem('token');
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// =============================================
// SISTEMA DE GERENCIAMENTO DE ESTADO
// =============================================

class StateManager {
    constructor() {
        this.state = {
            user: null,
            theme: 'light',
            accessibility: false,
            loading: false,
            offline: false
        };
        this.listeners = new Map();
        this.init();
    }

    init() {
        // Carregar estado do localStorage
        this.loadState();
        
        // Configurar listeners globais
        this.setupGlobalListeners();
        
        console.log('🔄 State Manager inicializado');
    }

    setupGlobalListeners() {
        // Monitorar conexão
        window.addEventListener('online', () => this.set({ offline: false }));
        window.addEventListener('offline', () => this.set({ offline: true }));

        // Monitorar mudanças de storage entre abas
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    set(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Salvar estado persistente
        this.savePersistentState();
        
        // Emitir mudanças
        this.emit('stateChanged', { 
            newState: this.state, 
            oldState,
            changes: newState 
        });

        // Emitir eventos específicos
        Object.keys(newState).forEach(key => {
            this.emit(`${key}Changed`, newState[key]);
        });
    }

    get(key = null) {
        return key ? this.state[key] : { ...this.state };
    }

    loadState() {
        try {
            const saved = localStorage.getItem('bytewave_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.state = { ...this.state, ...state };
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    savePersistentState() {
        try {
            const persistentState = {
                theme: this.state.theme,
                accessibility: this.state.accessibility
            };
            localStorage.setItem('bytewave_state', JSON.stringify(persistentState));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    handleStorageChange(e) {
        if (e.key === 'bytewave_state') {
            this.loadState();
            this.emit('stateChanged', { 
                newState: this.state, 
                oldState: this.state,
                changes: { external: true }
            });
        }
    }

    reset() {
        this.state = {
            user: null,
            theme: 'light',
            accessibility: false,
            loading: false,
            offline: false
        };
        localStorage.removeItem('bytewave_state');
        this.emit('stateChanged', { 
            newState: this.state, 
            oldState: this.state,
            changes: { reset: true }
        });
    }
}

// =============================================
// UTILITÁRIOS DE DOM
// =============================================

const DOMUtils = {
    // Seleção de elementos
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    // Manipulação de elementos
    showElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.classList.remove('hidden');
            element.style.display = '';
        }
        return element;
    },

    hideElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.classList.add('hidden');
        }
        return element;
    },

    toggleElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.classList.toggle('hidden');
        }
        return element;
    },

    hideAllElements(ids) {
        ids.forEach(id => this.hideElement(id));
    },

    getElement(id) {
        return typeof id === 'string' ? document.getElementById(id) : id;
    },

    // Manipulação de conteúdo
    setInnerHTML(id, html) {
        const element = this.getElement(id);
        if (element) {
            element.innerHTML = html;
        }
        return element;
    },

    appendHTML(id, html) {
        const element = this.getElement(id);
        if (element) {
            element.insertAdjacentHTML('beforeend', html);
        }
        return element;
    },

    prependHTML(id, html) {
        const element = this.getElement(id);
        if (element) {
            element.insertAdjacentHTML('afterbegin', html);
        }
        return element;
    },

    getValue(id) {
        const element = this.getElement(id);
        return element ? element.value : '';
    },

    setValue(id, value) {
        const element = this.getElement(id);
        if (element) {
            element.value = value;
        }
        return element;
    },

    // Criação de elementos
    createElement(tag, attributes = {}, innerHTML = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        return element;
    },

    createElementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    },

    // Classes e atributos
    addClass(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.add(className);
        }
        return element;
    },

    removeClass(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.remove(className);
        }
        return element;
    },

    toggleClass(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.toggle(className);
        }
        return element;
    },

    setAttribute(id, attr, value) {
        const element = this.getElement(id);
        if (element) {
            element.setAttribute(attr, value);
        }
        return element;
    },

    getAttribute(id, attr) {
        const element = this.getElement(id);
        return element ? element.getAttribute(attr) : null;
    },

    // Event listeners
    on(id, event, handler, options = {}) {
        const element = this.getElement(id);
        if (element) {
            element.addEventListener(event, handler, options);
        }
        return element;
    },

    off(id, event, handler) {
        const element = this.getElement(id);
        if (element) {
            element.removeEventListener(event, handler);
        }
        return element;
    },

    once(id, event, handler) {
        return this.on(id, event, handler, { once: true });
    },

    // Formulários
    serializeForm(formId) {
        const form = this.getElement(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    },

    validateForm(formId, rules = {}) {
        const form = this.getElement(formId);
        if (!form) return { isValid: false, errors: {} };

        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const value = field.value.trim();
                const fieldRules = rules[fieldName];

                for (const rule of fieldRules) {
                    const error = this.validateField(value, rule);
                    if (error) {
                        errors[fieldName] = error;
                        isValid = false;
                        this.markFieldInvalid(field, error);
                        break;
                    } else {
                        this.markFieldValid(field);
                    }
                }
            }
        });

        return { isValid, errors };
    },

    validateField(value, rule) {
        const { type, required, minLength, maxLength, pattern, message } = rule;

        if (required && !value) {
            return message || 'Este campo é obrigatório';
        }

        if (value) {
            if (minLength && value.length < minLength) {
                return message || `Mínimo ${minLength} caracteres`;
            }

            if (maxLength && value.length > maxLength) {
                return message || `Máximo ${maxLength} caracteres`;
            }

            if (pattern && !pattern.test(value)) {
                return message || 'Formato inválido';
            }

            if (type === 'email' && !this.isValidEmail(value)) {
                return message || 'Email inválido';
            }
        }

        return null;
    },

    markFieldInvalid(field, error) {
        field.classList.add('error');
        field.classList.remove('valid');

        // Adicionar mensagem de erro
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = this.createElement('div', { class: 'field-error' });
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = error;
    },

    markFieldValid(field) {
        field.classList.remove('error');
        field.classList.add('valid');

        // Remover mensagem de erro
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Utilidades de formulário
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Animações
    animate(element, animation, duration = 300) {
        const el = this.getElement(element);
        if (el) {
            el.style.animation = `${animation} ${duration}ms ease`;
            return new Promise(resolve => {
                setTimeout(resolve, duration);
            });
        }
        return Promise.resolve();
    },

    fadeIn(element, duration = 300) {
        return this.animate(element, 'fadeIn', duration);
    },

    fadeOut(element, duration = 300) {
        return this.animate(element, 'fadeOut', duration);
    },

    slideDown(element, duration = 300) {
        return this.animate(element, 'slideDown', duration);
    },

    slideUp(element, duration = 300) {
        return this.animate(element, 'slideUp', duration);
    },

    // LocalStorage utilities
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    clearStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// =============================================
// UTILITÁRIOS DE NOTIFICAÇÃO
// =============================================

const NotificationUtils = {
    types: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        LOADING: 'loading'
    },

    show(message, type = this.types.INFO, duration = 5000) {
        // Remover notificação anterior se existir
        this.hide();

        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-remover se não for loading
        if (type !== this.types.LOADING && duration > 0) {
            setTimeout(() => this.hide(notification), duration);
        }

        return notification;
    },

    createNotification(message, type) {
        const icons = {
            [this.types.SUCCESS]: 'fa-check-circle',
            [this.types.ERROR]: 'fa-exclamation-circle',
            [this.types.WARNING]: 'fa-exclamation-triangle',
            [this.types.INFO]: 'fa-info-circle',
            [this.types.LOADING]: 'fa-spinner fa-spin'
        };

        const notification = DOMUtils.createElement('div', {
            id: 'global-notification',
            class: `notification notification-${type}`
        }, `
            <div class="notification-content">
                <i class="fas ${icons[type]}"></i>
                <span>${this.escapeHTML(message)}</span>
            </div>
            ${type !== this.types.LOADING ? '<button class="notification-close"><i class="fas fa-times"></i></button>' : ''}
        `);

        // Configurar evento de fechar
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide(notification));
        }

        return notification;
    },

    hide(notification = null) {
        const notif = notification || document.getElementById('global-notification');
        if (notif) {
            notif.classList.remove('show');
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.parentNode.removeChild(notif);
                }
            }, 300);
        }
    },

    showSuccess(message, duration = 5000) {
        return this.show(message, this.types.SUCCESS, duration);
    },

    showError(message, duration = 5000) {
        return this.show(message, this.types.ERROR, duration);
    },

    showWarning(message, duration = 5000) {
        return this.show(message, this.types.WARNING, duration);
    },

    showInfo(message, duration = 5000) {
        return this.show(message, this.types.INFO, duration);
    },

    showLoading(message = 'Carregando...') {
        return this.show(message, this.types.LOADING, 0);
    },

    // Toast notifications rápidas
    toast(message, type = this.types.INFO) {
        const toast = this.createNotification(message, type);
        toast.classList.add('notification-toast');
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => this.hide(toast), 3000);
    },

    // Confirmação customizada
    async confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, title, resolve);
            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 100);
        });
    },

    createConfirmModal(message, title, resolve) {
        const modal = DOMUtils.createElement('div', {
            class: 'modal-overlay'
        }, `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3>${this.escapeHTML(title)}</h3>
                </div>
                <div class="modal-body">
                    <p>${this.escapeHTML(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                    <button class="btn btn-primary" id="confirm-ok">OK</button>
                </div>
            </div>
        `);

        modal.querySelector('#confirm-cancel').addEventListener('click', () => {
            this.hideModal(modal);
            resolve(false);
        });

        modal.querySelector('#confirm-ok').addEventListener('click', () => {
            this.hideModal(modal);
            resolve(true);
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(modal);
                resolve(false);
            }
        });

        return modal;
    },

    hideModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    },

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// =============================================
// UTILITÁRIOS DE DATA E HORA
// =============================================

const DateUtils = {
    // Formatação
    formatDateTime(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleString('pt-BR', { ...defaultOptions, ...options });
    },

    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        return date.toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
    },

    formatTime(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleTimeString('pt-BR', { ...defaultOptions, ...options });
    },

    formatRelative(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'agora';
        if (diffMins < 60) return `há ${diffMins} min`;
        if (diffHours < 24) return `há ${diffHours} h`;
        if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        
        return this.formatDate(dateString);
    },

    // Cálculos
    getDaysRemaining(dateString) {
        const dataEntrega = new Date(dateString);
        const agora = new Date();
        const diffMs = dataEntrega - agora;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    },

    isOverdue(dateString) {
        return this.getDaysRemaining(dateString) < 0;
    },

    isToday(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },

    isTomorrow(dateString) {
        const date = new Date(dateString);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.toDateString() === tomorrow.toDateString();
    },

    isThisWeek(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

        return date >= startOfWeek && date <= endOfWeek;
    },

    // Manipulação
    addDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        return date.toISOString();
    },

    addHours(dateString, hours) {
        const date = new Date(dateString);
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    },

    startOfDay(dateString) {
        const date = new Date(dateString);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    },

    endOfDay(dateString) {
        const date = new Date(dateString);
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
    },

    // Validação
    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    },

    isFuture(dateString) {
        const date = new Date(dateString);
        return date > new Date();
    },

    isPast(dateString) {
        const date = new Date(dateString);
        return date < new Date();
    }
};

// =============================================
// UTILITÁRIOS DE API
// =============================================

const APIUtils = {
    // Request base
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
            
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');

            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Resposta não é JSON: ${text.substring(0, 200)}`);
            }

            console.log(`📨 API Response:`, data);

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error(`💥 API Error (${endpoint}):`, error);
            
            // Disparar evento de erro
            document.dispatchEvent(new CustomEvent('apiError', { 
                detail: { endpoint, error: error.message } 
            }));

            throw error;
        }
    },

    // Métodos HTTP
    async get(endpoint) {
        return this.request(endpoint);
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Upload de arquivos
    async upload(endpoint, formData) {
        const url = `${API_BASE}${endpoint}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: formData
        });

        return response.json();
    },

    // Health check
    async testConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`, { 
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        console.log('🌐 API offline, usando modo desenvolvimento');
        return false; // Não é um erro crítico
    }
},

    // Cache simples
    cache: new Map(),

    async getWithCache(endpoint, ttl = 60000) { // 1 minuto default
        const now = Date.now();
        const cached = this.cache.get(endpoint);

        if (cached && (now - cached.timestamp < ttl)) {
            console.log(`📦 Cache hit: ${endpoint}`);
            return cached.data;
        }

        console.log(`🔄 Cache miss: ${endpoint}`);
        const data = await this.get(endpoint);
        
        this.cache.set(endpoint, {
            data,
            timestamp: now
        });

        return data;
    },

    clearCache(endpoint = null) {
        if (endpoint) {
            this.cache.delete(endpoint);
        } else {
            this.cache.clear();
        }
    },

    // Retry com exponential backoff
    async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                
                // Não tentar novamente para erros 4xx
                if (error.message.includes('4')) {
                    break;
                }

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
                    console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    },

    // Utilitários
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), ms)
            )
        ]);
    }
};

// =============================================
// UTILITÁRIOS DE PERFORMANCE
// =============================================

const PerformanceUtils = {
    // Debounce
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Memoização
    memoize(func) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    // Medição de performance
    measure(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },

    async measureAsync(name, asyncFunc) {
        const start = performance.now();
        const result = await asyncFunc();
        const end = performance.now();
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
};

// =============================================
// UTILITÁRIOS DE STRING E FORMATAÇÃO
// =============================================

const StringUtils = {
    // Capitalização
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    capitalizeWords(text) {
        return text.replace(/\b\w/g, char => char.toUpperCase());
    },

    // Truncamento
    truncate(text, length, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length - suffix.length) + suffix;
    },

    truncateWords(text, wordCount, suffix = '...') {
        const words = text.split(' ');
        if (words.length <= wordCount) return text;
        return words.slice(0, wordCount).join(' ') + suffix;
    },

    // Limpeza
    sanitizeHTML(text) {
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    },

    removeAccents(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    // Formatação
    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    formatPhone(phone) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    },

    formatCurrency(value, locale = 'pt-BR', currency = 'BRL') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(value);
    },

    // Validação
    isEmpty(text) {
        return !text || text.trim().length === 0;
    },

    isEmail(text) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text);
    },

    isURL(text) {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    }
};

// =============================================
// UTILITÁRIOS DE ARRAY E OBJETO
// =============================================

const ArrayUtils = {
    // Ordenação
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (order === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    },

    sortByMultiple(array, keys) {
        return [...array].sort((a, b) => {
            for (const { key, order = 'asc' } of keys) {
                const aVal = a[key];
                const bVal = b[key];
                
                if (aVal !== bVal) {
                    if (order === 'desc') {
                        return aVal < bVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                }
            }
            return 0;
        });
    },

    // Filtros
    filterBy(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (typeof value === 'function') {
                    return value(item[key]);
                }
                return item[key] === value;
            });
        });
    },

    search(array, query, fields) {
        if (!query) return array;
        
        const searchTerm = query.toLowerCase();
        return array.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(searchTerm);
            });
        });
    },

    // Agrupamento
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },

    // Utilidades
    unique(array, key = null) {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    },

    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

const ObjectUtils = {
    // Merge
    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    },

    // Clone
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    // Utilidades
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    pick(obj, keys) {
        return keys.reduce((result, key) => {
            if (key in obj) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    },

    omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }
};

// =============================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// =============================================

// Instanciar gerenciador de estado
const stateManager = new StateManager();

// Exportar para uso global
window.APIUtils = APIUtils;
window.DOMUtils = DOMUtils;
window.NotificationUtils = NotificationUtils;
window.DateUtils = DateUtils;
window.PerformanceUtils = PerformanceUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.ObjectUtils = ObjectUtils;
window.stateManager = stateManager;

// Exportar variáveis globais
window.API_BASE = API_BASE;
window.currentUser = currentUser;
window.token = token;
window.isDarkMode = isDarkMode;

console.log('🛠️ Utilitários carregados e prontos!');

// Inicialização automática
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema ByteWave inicializado com sucesso!');
    
    // Configurar tema inicial
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});