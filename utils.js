// Utilitários e funções auxiliares

/**
 * Classe para gerenciar notificações
 */
class NotificationManager {
    static show(message, type = 'success') {
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'warning' ? 'bg-yellow-500' : 
                       type === 'error' ? 'bg-red-500' :
                       type === 'info' ? 'bg-blue-500' : 'bg-gray-500';
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, APP_CONFIG.notifications.duration);
    }
}

/**
 * Classe para gerenciar armazenamento local
 */
class StorageManager {
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return null;
        }
    }
    
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    }
}

/**
 * Classe para validação de dados
 */
class ValidationUtils {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    static isValidGoogleAppsScriptUrl(url) {
        if (!this.isValidUrl(url)) return false;
        return APP_CONFIG.googleSheets.validDomains.some(domain => url.includes(domain));
    }
    
    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }
    
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
}

/**
 * Classe para formatação de dados
 */
class FormatUtils {
    static formatDate(date, locale = 'pt-BR') {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString(locale);
    }
    
    static formatDateTime(date, locale = 'pt-BR') {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleString(locale);
    }
    
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    static capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/**
 * Classe para manipulação de DOM
 */
class DOMUtils {
    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }
    
    static getElement(selector) {
        return document.querySelector(selector);
    }
    
    static getElements(selector) {
        return document.querySelectorAll(selector);
    }
    
    static show(element) {
        if (element) element.classList.remove('hidden');
    }
    
    static hide(element) {
        if (element) element.classList.add('hidden');
    }
    
    static toggle(element) {
        if (element) element.classList.toggle('hidden');
    }
    
    static addEventListeners(elements, event, handler) {
        if (elements) {
            elements.forEach(element => {
                element.addEventListener(event, handler);
            });
        }
    }
}

/**
 * Classe para utilitários de array
 */
class ArrayUtils {
    static shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    static unique(array) {
        return [...new Set(array)];
    }
    
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }
    
    static sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }
    
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

/**
 * Classe para utilitários de string
 */
class StringUtils {
    static slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
    
    static generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    static unescapeHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    static removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}

/**
 * Classe para utilitários de rede
 */
class NetworkUtils {
    static async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    static isOnline() {
        return navigator.onLine;
    }
    
    static async checkConnection(url = 'https://www.google.com/favicon.ico') {
        try {
            const response = await this.fetchWithTimeout(url, { mode: 'no-cors' }, 5000);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Classe para utilitários de arquivo
 */
class FileUtils {
    static downloadText(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    static downloadJSON(data, filename) {
        const content = JSON.stringify(data, null, 2);
        this.downloadText(content, filename, 'application/json');
    }
    
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}

/**
 * Classe para utilitários de performance
 */
class PerformanceUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static measureTime(name, func) {
        console.time(name);
        const result = func();
        console.timeEnd(name);
        return result;
    }
    
    static async measureAsyncTime(name, asyncFunc) {
        console.time(name);
        const result = await asyncFunc();
        console.timeEnd(name);
        return result;
    }
}

/**
 * Função global para alternar seções colapsáveis
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const arrowId = sectionId.replace('Section', 'Arrow')
                            .replace('Instructions', 'Arrow')
                            .replace('Warning', 'Arrow')
                            .replace('troubleshooting', 'troubleshootingArrow')
                            .replace('Test', 'Arrow');
    const arrow = document.getElementById(arrowId);
    
    if (section && arrow) {
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
        } else {
            section.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

// Exportar utilitários para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotificationManager,
        StorageManager,
        ValidationUtils,
        FormatUtils,
        DOMUtils,
        ArrayUtils,
        StringUtils,
        NetworkUtils,
        FileUtils,
        PerformanceUtils,
        toggleSection
    };
}