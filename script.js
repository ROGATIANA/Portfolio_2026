document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    const CONFIG = {
        animations: {
            enable: true,
            scrollReveal: true,
            parallax: true
        },
        performance: {
            lazyLoad: true,
            debounceDelay: 100
        },
        contact: {
            endpoint: 'https://formspree.io/f/YOUR_FORM_ID',
            timeout: 10000
        }
    };
    
    const STATE = {
        theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
        scrollPosition: 0,
        menuOpen: false,
        formSubmitting: false
    };
    
    const Utils = {
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        isInViewport: function(element, offset = 0) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * (1 - offset) &&
                rect.bottom >= 0
            );
        },
        
        formatPhone: function(phone) {
            return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        },
        
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };
    
    class ThemeManager {
        constructor() {
            this.themeSwitcher = document.querySelector('.theme-switcher');
            this.init();
        }
        
        init() {
            this.setTheme(STATE.theme);
            this.bindEvents();
        }
        
        setTheme(theme) {
            STATE.theme = theme;
            document.body.classList.toggle('dark-mode', theme === 'dark');
            localStorage.setItem('theme', theme);
            
            const themeColor = theme === 'dark' ? '#111827' : '#ffffff';
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', themeColor);
            }
        }
        
        toggleTheme() {
            const newTheme = STATE.theme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
            
            document.dispatchEvent(new CustomEvent('themeChange', {
                detail: { theme: newTheme }
            }));
        }
        
        bindEvents() {
            if (this.themeSwitcher) {
                this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
            }
            
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    class NavigationManager {
        constructor() {
            this.navbar = document.querySelector('.navbar');
            this.navMenu = document.querySelector('.nav-menu');
            this.menuToggle = document.querySelector('.menu-toggle');
            this.navLinks = document.querySelectorAll('.nav-link');
            this.progressBar = document.querySelector('.progress-bar');
            this.currentSection = null;
            
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.setActiveNavLink();
            this.updateProgressBar();
        }
        
        bindEvents() {
            if (this.menuToggle) {
                this.menuToggle.addEventListener('click', () => this.toggleMenu());
                this.menuToggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleMenu();
                    }
                });
            }
            
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
            
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        this.scrollToElement(targetElement);
                    }
                });
            });
            
            window.addEventListener('scroll', Utils.throttle(() => {
                this.setActiveNavLink();
                this.updateProgressBar();
                this.updateNavbar();
            }, 100));
        }
        
        toggleMenu() {
            STATE.menuOpen = !STATE.menuOpen;
            this.navMenu.classList.toggle('active', STATE.menuOpen);
            this.menuToggle.setAttribute('aria-expanded', STATE.menuOpen);
            document.body.style.overflow = STATE.menuOpen ? 'hidden' : '';
        }
        
        closeMenu() {
            STATE.menuOpen = false;
            this.navMenu.classList.remove('active');
            this.menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
        
        scrollToElement(element) {
            const navHeight = this.navbar.offsetHeight;
            const elementPosition = element.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
        
        setActiveNavLink() {
            const sections = document.querySelectorAll('section[id]');
            const scrollPos = window.scrollY + 100;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    if (this.currentSection !== sectionId) {
                        this.currentSection = sectionId;
                        
                        this.navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${sectionId}`) {
                                link.classList.add('active');
                            }
                        });
                        
                        document.dispatchEvent(new CustomEvent('sectionChange', {
                            detail: { sectionId }
                        }));
                    }
                }
            });
        }
        
        updateProgressBar() {
            if (!this.progressBar) return;
            
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            
            this.progressBar.style.width = scrolled + '%';
            this.progressBar.setAttribute('aria-valuenow', Math.round(scrolled));
        }
        
        updateNavbar() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                this.navbar.classList.add('scrolled');
                if (currentScroll > STATE.scrollPosition && currentScroll > 200) {
                    this.navbar.classList.add('hidden');
                } else {
                    this.navbar.classList.remove('hidden');
                }
            } else {
                this.navbar.classList.remove('scrolled', 'hidden');
            }
            
            STATE.scrollPosition = currentScroll;
        }
    }
    
    class AnimationManager {
        constructor() {
            this.animatedElements = new Set();
            this.observerOptions = {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            };
            
            this.init();
        }
        
        init() {
            if (!CONFIG.animations.enable) return;
            
            this.initIntersectionObserver();
            this.initScrollAnimations();
            this.initCounters();
            this.initSkillBars();
            this.initRadialProgress();
            this.initParallax();
        }
        
        initIntersectionObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, this.observerOptions);
            
            document.querySelectorAll('[data-animate]').forEach(el => {
                this.observer.observe(el);
            });
        }
        
        animateElement(element) {
            const animation = element.dataset.animate;
            element.classList.add('animate__animated', `animate__${animation}`);
            
            element.addEventListener('animationend', () => {
                element.classList.remove('animate__animated', `animate__${animation}`);
            });
        }
        
        initScrollAnimations() {
            const animateOnScroll = () => {
                document.querySelectorAll('.scroll-animate').forEach(el => {
                    if (Utils.isInViewport(el, 0.2)) {
                        el.classList.add('visible');
                    }
                });
            };
            
            window.addEventListener('scroll', Utils.throttle(animateOnScroll, 100));
            animateOnScroll();
        }
        
        initCounters() {
            const counters = document.querySelectorAll('.stat-number');
            
            const animateCounter = (counter) => {
                const target = parseInt(counter.dataset.count);
                const increment = target / 200;
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            counters.forEach(counter => observer.observe(counter));
        }
        
        initSkillBars() {
            const skillBars = document.querySelectorAll('.skill-progress');
            
            const animateSkillBar = (bar) => {
                const width = bar.dataset.level;
                bar.style.width = width + '%';
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateSkillBar(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            skillBars.forEach(bar => observer.observe(bar));
        }
        
        initRadialProgress() {
            const radialElements = document.querySelectorAll('.radial-progress');
            if (!radialElements.length) return;
            
            const animateRadial = (element) => {
                const value = parseInt(element.dataset.value) || 0;
                const circle = element.querySelector('.radial-fg');
                if (!circle) return;
                
                const radius = 54;
                const circumference = 2 * Math.PI * radius;
                
                circle.style.strokeDasharray = `${circumference}`;
                circle.style.strokeDashoffset = circumference;
                
                let start = null;
                const step = (timestamp) => {
                    if (!start) start = timestamp;
                    const progress = Math.min((timestamp - start) / 1000, 1);
                    const targetOffset = circumference * (1 - (value / 100));
                    const currentOffset = circumference - (circumference - targetOffset) * progress;
                    circle.style.strokeDashoffset = currentOffset;
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        circle.style.strokeDashoffset = targetOffset;
                    }
                };
                requestAnimationFrame(step);
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateRadial(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            radialElements.forEach(el => observer.observe(el));
        }
        
        initParallax() {
            if (!CONFIG.animations.parallax) return;
            
            const parallaxElements = document.querySelectorAll('.parallax');
            
            const updateParallax = () => {
                const scrolled = window.pageYOffset;
                
                parallaxElements.forEach(el => {
                    const speed = parseFloat(el.dataset.speed) || 0.5;
                    const yPos = -(scrolled * speed);
                    el.style.transform = `translateY(${yPos}px)`;
                });
            };
            
            window.addEventListener('scroll', Utils.throttle(updateParallax, 16));
        }
    }
    
    class ProjectsManager {
        constructor() {
            this.filterButtons = document.querySelectorAll('.filter-btn');
            this.projectCards = document.querySelectorAll('.project-card');
            this.loadMoreBtn = document.getElementById('load-more');
            this.activeFilter = 'all';
            
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.filterProjects('all');
        }
        
        bindEvents() {
            this.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filter = button.dataset.filter;
                    this.setActiveFilter(filter);
                    this.filterProjects(filter);
                });
            });
            
            if (this.loadMoreBtn) {
                this.loadMoreBtn.addEventListener('click', () => this.loadMoreProjects());
            }
        }
        
        setActiveFilter(filter) {
            this.activeFilter = filter;
            
            this.filterButtons.forEach(button => {
                const isActive = button.dataset.filter === filter;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-selected', isActive);
            });
        }
        
        filterProjects(filter) {
            this.projectCards.forEach(card => {
                const category = card.dataset.category;
                const shouldShow = filter === 'all' || category === filter;
                
                card.style.display = shouldShow ? 'block' : 'none';
                
                if (shouldShow) {
                    requestAnimationFrame(() => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        
                        requestAnimationFrame(() => {
                            card.style.transition = 'opacity 0.3s, transform 0.3s';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    });
                }
            });
        }
        
        loadMoreProjects() {
            this.loadMoreBtn.disabled = true;
            this.loadMoreBtn.innerHTML = '<span>Chargement...</span><i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                this.loadMoreBtn.style.display = 'none';
                this.showNotification('Tous les projets sont affichés !', 'success');
            }, 1500);
        }
        
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    }
    
    class ContactFormManager {
        constructor() {
            this.form = document.getElementById('contact-form');
            this.submitBtn = document.getElementById('submit-btn');
            this.successMessage = document.getElementById('success-message');
            
            if (this.form) this.init();
        }
        
        init() {
            this.bindEvents();
            this.initValidation();
        }
        
        bindEvents() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            this.form.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', () => this.validateField(input));
                input.addEventListener('blur', () => this.validateField(input));
            });
        }
        
        initValidation() {
            this.form.querySelectorAll('[required]').forEach(input => {
                input.addEventListener('invalid', (e) => {
                    e.preventDefault();
                    this.showError(input, this.getValidationMessage(input));
                });
            });
        }
        
        validateField(field) {
            const errorElement = document.getElementById(`${field.id}-error`);
            
            if (field.validity.valid) {
                this.hideError(field);
                return true;
            } else {
                this.showError(field, this.getValidationMessage(field));
                return false;
            }
        }
        
        getValidationMessage(field) {
            if (field.validity.valueMissing) {
                return 'Ce champ est obligatoire.';
            }
            
            if (field.validity.typeMismatch) {
                if (field.type === 'email') {
                    return 'Veuillez entrer une adresse email valide.';
                }
            }
            
            return 'Veuillez corriger ce champ.';
        }
        
        showError(field, message) {
            const errorElement = document.getElementById(`${field.id}-error`);
            field.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }
        
        hideError(field) {
            const errorElement = document.getElementById(`${field.id}-error`);
            field.classList.remove('error');
            
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
        
        validateForm() {
            let isValid = true;
            
            this.form.querySelectorAll('[required]').forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });
            
            return isValid;
        }
        
        async handleSubmit(e) {
            e.preventDefault();
            
            if (STATE.formSubmitting) return;
            
            if (!this.validateForm()) {
                this.showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
                return;
            }
            
            STATE.formSubmitting = true;
            this.setSubmittingState(true);
            
            try {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData);
                
                await this.submitForm(data);
                
                this.showSuccess();
                this.form.reset();
                this.form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
                
            } catch (error) {
                this.showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
                console.error('Form submission error:', error);
            } finally {
                STATE.formSubmitting = false;
                this.setSubmittingState(false);
            }
        }
        
        async submitForm(data) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() > 0.1) {
                        resolve({ success: true });
                    } else {
                        reject(new Error('Network error'));
                    }
                }, 1500);
            });
        }
        
        setSubmittingState(submitting) {
            const btnText = this.submitBtn.querySelector('.btn-text');
            const btnLoader = this.submitBtn.querySelector('.btn-loader');
            
            this.submitBtn.disabled = submitting;
            
            if (btnText) {
                btnText.textContent = submitting ? 'Envoi en cours...' : 'Envoyer le message';
            }
            
            if (btnLoader) {
                btnLoader.style.display = submitting ? 'block' : 'none';
            }
        }
        
        showSuccess() {
            if (this.successMessage) {
                this.successMessage.style.display = 'flex';
                
                setTimeout(() => {
                    this.successMessage.style.display = 'none';
                }, 5000);
            }
        }
        
        showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    }
    
    class PerformanceManager {
        constructor() {
            this.init();
        }
        
        init() {
            this.initLazyLoading();
            this.initPreloading();
            this.initServiceWorker();
            this.monitorPerformance();
        }
        
        initLazyLoading() {
            if (!CONFIG.performance.lazyLoad) return;
            
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            
            if ('loading' in HTMLImageElement.prototype) {
                lazyImages.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                });
            } else {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                            }
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    });
                });
                
                lazyImages.forEach(img => imageObserver.observe(img));
            }
        }
        
        initPreloading() {
            const preloadLinks = document.querySelectorAll('link[rel="preload"]');
            preloadLinks.forEach(link => {
                const as = link.getAttribute('as');
                if (as === 'style') {
                    link.rel = 'stylesheet';
                }
            });
        }
        
        initServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(
                        registration => {
                            console.log('ServiceWorker registration successful');
                        },
                        error => {
                            console.log('ServiceWorker registration failed:', error);
                        }
                    );
                });
            }
        }
        
        monitorPerformance() {
            let clsValue = 0;
            
            try {
                const observer = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                });
                
                observer.observe({ type: 'layout-shift', buffered: true });
                
                window.addEventListener('beforeunload', () => {
                    if (clsValue > 0.1) {
                        console.warn('High CLS detected:', clsValue);
                    }
                });
            } catch (e) {
                console.warn('PerformanceObserver not fully supported');
            }
        }
    }
    
    class UIEnhancements {
        constructor() {
            this.backToTop = document.querySelector('.back-to-top');
            this.currentYear = document.getElementById('current-year');
            this.customCursor = document.querySelector('.custom-cursor');
            
            this.init();
        }
        
        init() {
            this.initBackToTop();
            this.updateCurrentYear();
            this.initCustomCursor();
            this.initTooltips();
        }
        
        initBackToTop() {
            if (!this.backToTop) return;
            
            const toggleBackToTop = () => {
                if (window.pageYOffset > 300) {
                    this.backToTop.classList.add('visible');
                } else {
                    this.backToTop.classList.remove('visible');
                }
            };
            
            window.addEventListener('scroll', Utils.throttle(toggleBackToTop, 100));
            
            this.backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        updateCurrentYear() {
            if (this.currentYear) {
                this.currentYear.textContent = new Date().getFullYear();
            }
        }
        
        initCustomCursor() {
            if (!this.customCursor || window.matchMedia('(pointer: coarse)').matches) {
                return;
            }
            
            document.addEventListener('mousemove', (e) => {
                this.customCursor.style.left = e.clientX + 'px';
                this.customCursor.style.top = e.clientY + 'px';
            });
            
            const hoverElements = document.querySelectorAll('a, button, [data-cursor="hover"]');
            hoverElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.customCursor.classList.add('hover');
                });
                el.addEventListener('mouseleave', () => {
                    this.customCursor.classList.remove('hover');
                });
            });
            
            document.addEventListener('mouseleave', () => {
                this.customCursor.style.opacity = '0';
            });
            
            document.addEventListener('mouseenter', () => {
                this.customCursor.style.opacity = '1';
            });
        }
        
        initTooltips() {
            const tooltipElements = document.querySelectorAll('[data-tooltip]');
            
            tooltipElements.forEach(el => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = el.dataset.tooltip;
                document.body.appendChild(tooltip);
                
                el.addEventListener('mouseenter', (e) => {
                    const rect = el.getBoundingClientRect();
                    tooltip.style.left = rect.left + rect.width / 2 + 'px';
                    tooltip.style.top = rect.top - 10 + 'px';
                    tooltip.classList.add('visible');
                });
                
                el.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('visible');
                });
            });
        }
    }
    
    class AnalyticsManager {
        constructor() {
            this.events = [];
            this.init();
        }
        
        init() {
            this.trackPageView();
            this.trackInteractions();
            this.trackPerformance();
        }
        
        trackPageView() {
            const pageData = {
                url: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            this.logEvent('page_view', pageData);
        }
        
        trackInteractions() {
            document.addEventListener('click', (e) => {
                const target = e.target;
                const interactiveElements = ['A', 'BUTTON', 'INPUT'];
                
                if (interactiveElements.includes(target.tagName)) {
                    this.logEvent('click', {
                        element: target.tagName,
                        text: target.textContent?.trim(),
                        href: target.href,
                        id: target.id,
                        class: target.className
                    });
                }
            });
            
            document.addEventListener('submit', (e) => {
                this.logEvent('form_submit', {
                    formId: e.target.id,
                    formAction: e.target.action
                });
            });
        }
        
        trackPerformance() {
            window.addEventListener('load', () => {
                if (performance.timing) {
                    const timing = performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    
                    this.logEvent('performance', {
                        loadTime,
                        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                        redirectCount: performance.navigation.redirectCount
                    });
                }
            });
        }
        
        logEvent(name, data) {
            const event = {
                id: Utils.generateId(),
                name,
                data,
                timestamp: new Date().toISOString()
            };
            
            this.events.push(event);
            
            console.log('Analytics Event:', event);
            
            if (this.events.length > 100) {
                this.events = this.events.slice(-100);
            }
        }
    }
    
    class PortfolioApp {
        constructor() {
            this.modules = {};
            this.init();
        }
        
        init() {
            console.log('🚀 Portfolio App Initializing...');
            
            document.documentElement.classList.remove('no-js');
            
            this.modules.theme = new ThemeManager();
            this.modules.navigation = new NavigationManager();
            this.modules.animations = new AnimationManager();
            this.modules.projects = new ProjectsManager();
            this.modules.contact = new ContactFormManager();
            this.modules.performance = new PerformanceManager();
            this.modules.ui = new UIEnhancements();
            this.modules.analytics = new AnalyticsManager();
            
            this.initKeyboardShortcuts();
            
            this.initErrorHandling();
            
            console.log('✅ Portfolio App Initialized!');
        }
        
        initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    const searchInput = document.querySelector('input[type="search"]');
                    if (searchInput) searchInput.focus();
                }
                
                if (e.key === 'Escape') {
                    if (this.modules.navigation) {
                        this.modules.navigation.closeMenu();
                    }
                }
                
                if (e.key === 't' && e.altKey) {
                    e.preventDefault();
                    if (this.modules.theme) {
                        this.modules.theme.toggleTheme();
                    }
                }
            });
        }
        
        initErrorHandling() {
            window.addEventListener('error', (e) => {
                console.error('Global error:', e.error);
            });
            
            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PortfolioApp = new PortfolioApp();
        });
    } else {
        window.PortfolioApp = new PortfolioApp();
    }
    
    window.portfolioUtils = Utils;
    
    if ('PerformanceObserver' in window) {
        try {
            const perfObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                        console.log('LCP:', entry.renderTime || entry.loadTime);
                    }
                    if (entry.entryType === 'first-input') {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    }
                }
            });
            
            perfObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        } catch (e) {
            console.warn('PerformanceObserver not fully supported');
        }
    }
});

class ImageManager {
    constructor() {
        this.initLazyLoading();
    }
    
    initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    
                    img.onerror = () => {
                        img.src = 'img/fallback.jpg';
                        console.warn(`Image failed to load: ${img.dataset.src}`);
                    };
                    
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

class NewsletterManager {
    constructor() {
        this.form = document.querySelector('.newsletter-form');
        if (this.form) this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const email = this.form.querySelector('input[type="email"]').value;
        const button = this.form.querySelector('button');
        
        if (!this.validateEmail(email)) {
            this.showMessage('Veuillez entrer un email valide', 'error');
            return;
        }
        
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('Merci pour votre inscription !', 'success');
            this.form.reset();
        } catch (error) {
            this.showMessage('Une erreur est survenue', 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
    
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

class SimpleAnalytics {
    constructor() {
        this.init();
    }
    
    init() {
        this.trackPageView();
        this.trackOutboundLinks();
        this.trackTimeOnPage();
    }
    
    trackPageView() {
        const data = {
            url: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };
        
        console.log('Page view:', data);
    }
    
    trackOutboundLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const data = {
                    url: link.href,
                    text: link.textContent.trim()
                };
                console.log('Outbound link:', data);
            });
        });
    }
    
    trackTimeOnPage() {
        let timeSpent = 0;
        const interval = setInterval(() => {
            timeSpent += 30;
            if (timeSpent >= 300) { 
                clearInterval(interval);
                console.log('Time on page:', timeSpent, 'seconds');
            }
        }, 30000);
    }
}

class PortfolioEnhancements {
    constructor() {
        this.imageManager = new ImageManager();
        this.newsletterManager = new NewsletterManager();
        this.simpleAnalytics = new SimpleAnalytics();
        this.initSmoothScrolling();
        this.initDownloadTracking();
    }
    
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    initDownloadTracking() {
        document.querySelectorAll('a[download]').forEach(link => {
            link.addEventListener('click', () => {
                console.log('Download:', link.href.split('/').pop());
            });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portfolioEnhancements = new PortfolioEnhancements();
    });
} else {
    window.portfolioEnhancements = new PortfolioEnhancements();
}

const ANIMATION_CONFIG = {
    particles: {
        enabled: true,
        count: 30,
        colors: ['#2563eb', '#7c3aed', '#60a5fa'],
        speed: 0.3
    },
    cursor: {
        enabled: true,
        magnetic: true
    },
    parallax: {
        enabled: true,
        intensity: 0.2
    }
};

class ParticlesBackground {
    constructor() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'particles-canvas';
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0, radius: 100 };
        
        this.init();
    }
    
    init() {
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.2;
        `;
        
        document.body.appendChild(this.canvas);
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < ANIMATION_CONFIG.particles.count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * ANIMATION_CONFIG.particles.speed,
                vy: (Math.random() - 0.5) * ANIMATION_CONFIG.particles.speed,
                size: Math.random() * 3 + 1,
                color: ANIMATION_CONFIG.particles.colors[Math.floor(Math.random() * ANIMATION_CONFIG.particles.colors.length)],
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouse.radius) {
                const angle = Math.atan2(dy, dx);
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                p.x -= Math.cos(angle) * force * 2;
                p.y -= Math.sin(angle) * force * 2;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

class CursorFollower {
    constructor() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        this.cursor = document.querySelector('.custom-cursor');
        if (!this.cursor) this.createCursor();
        else this.cursor = document.querySelector('.custom-cursor');
        
        this.pos = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.defaultSize = 40;
        this.hoverSize = 20;
        this.currentSize = 40;
        
        this.init();
    }
    
    createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
        
        const style = document.createElement('style');
        style.textContent = `
            .custom-cursor {
                position: fixed;
                width: 40px;
                height: 40px;
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: difference;
                left: 0;
                top: 0;
                transition: width 0.2s ease, height 0.2s ease;
            }
            .cursor-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 6px;
                height: 6px;
                background: var(--primary);
                border-radius: 50%;
                transition: width 0.2s, height 0.2s;
            }
            .cursor-ring {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 2px solid var(--primary);
                border-radius: 50%;
                transition: transform 0.2s, border-color 0.2s;
                animation: cursorPulse 2s infinite;
            }
            @keyframes cursorPulse {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.2); opacity: 0.2; }
            }
            .custom-cursor.hover .cursor-dot {
                width: 8px;
                height: 8px;
                background: var(--secondary);
            }
            .custom-cursor.hover .cursor-ring {
                transform: scale(1.2);
                border-color: var(--secondary);
                animation: none;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.cursor);
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.target.x = e.clientX;
            this.target.y = e.clientY;
        });
        
        document.querySelectorAll('a, button, .btn, .project-card, .nav-link, .social-link, .theme-switcher').forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor?.classList.add('hover');
                this.currentSize = this.hoverSize;
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor?.classList.remove('hover');
                this.currentSize = this.defaultSize;
            });
        });
        
        if (ANIMATION_CONFIG.cursor.magnetic) {
            document.querySelectorAll('.btn, .social-link').forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    const distance = Math.sqrt(x*x + y*y);
                    if (distance < 100) {
                        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                    } else {
                        btn.style.transform = '';
                    }
                });
                
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = '';
                });
            });
        }
        
        this.animate();
    }
    
    animate() {
        this.pos.x += (this.target.x - this.pos.x) * 0.2;
        this.pos.y += (this.target.y - this.pos.y) * 0.2;
        
        if (this.cursor) {
            const size = this.currentSize;
            this.cursor.style.width = size + 'px';
            this.cursor.style.height = size + 'px';
            this.cursor.style.transform = `translate(${this.pos.x - size/2}px, ${this.pos.y - size/2}px)`;
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

class ScrollRevealEnhanced {
    constructor() {
        this.elements = [];
        this.init();
    }
    
    init() {
        const selectors = [
            '.section-header',
            '.about-card',
            '.project-card',
            '.skill-item',
            '.language-card',
            '.interest-card',
            '.contact-card'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.dataset.reveal) {
                    const reveals = ['fade-up', 'fade-left', 'zoom-in'];
                    el.dataset.reveal = reveals[Math.floor(Math.random() * reveals.length)];
                }
                this.elements.push(el);
            });
        });
        
        window.addEventListener('scroll', this.throttle(this.checkVisibility.bind(this), 100));
        this.checkVisibility();
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            if (!inThrottle) {
                func.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    checkVisibility() {
        this.elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top <= window.innerHeight * 0.8 && rect.bottom >= 0;
            
            if (isVisible && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.classList.add(`reveal-${el.dataset.reveal}`);
            }
        });
    }
}

class ParallaxSimple {
    constructor() {
        if (!ANIMATION_CONFIG.parallax.enabled) return;
        
        this.elements = document.querySelectorAll('.profile-image, .floating-card, .tech-bubble');
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            this.elements.forEach((el, index) => {
                const speed = 0.1 + (index * 0.05);
                const yPos = scrolled * speed * ANIMATION_CONFIG.parallax.intensity;
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
}

class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('.stat-number');
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        this.counters.forEach(counter => observer.observe(counter));
    }
    
    animateCounter(counter) {
        const target = parseInt(counter.dataset.count) || parseInt(counter.innerText);
        if (isNaN(target)) return;
        
        let current = 0;
        const increment = target / 50;
        const duration = 1500;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 3);
            
            current = Math.floor(target * easeOutQuart);
            counter.innerText = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.innerText = target;
            }
        };
        
        requestAnimationFrame(update);
    }
}

class TypingEffect {
    constructor() {
        this.element = document.querySelector('.hero-title .title-highlight');
        if (!this.element) return;
        
        this.text = this.element.textContent;
        this.init();
    }
    
    init() {
        this.element.textContent = '';
        this.element.style.borderRight = '2px solid var(--primary)';
        this.element.style.animation = 'cursor 1s infinite';
        
        this.typeText(0);
    }
    
    typeText(index) {
        if (index < this.text.length) {
            this.element.textContent += this.text.charAt(index);
            setTimeout(() => this.typeText(index + 1), 100);
        }
    }
}

class RippleEffect {
    constructor() {
        this.init();
    }
    
    init() {
        document.querySelectorAll('.btn, .social-link').forEach(el => {
            el.addEventListener('click', (e) => {
                const rect = el.getBoundingClientRect();
                const ripple = document.createElement('span');
                
                ripple.className = 'ripple-effect';
                ripple.style.cssText = `
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    left: ${e.clientX - rect.left}px;
                    top: ${e.clientY - rect.top}px;
                    transform: translate(-50%, -50%) scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;
                
                el.style.position = 'relative';
                el.style.overflow = 'hidden';
                el.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
        
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: translate(-50%, -50%) scale(20);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

class EnhancedAnimations {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('🎨 Animations avancées initialisées');
        
        try { new ParticlesBackground(); } catch (e) { console.warn('Particles non chargé', e); }
        try { new CursorFollower(); } catch (e) { console.warn('Cursor non chargé', e); }
        try { new ScrollRevealEnhanced(); } catch (e) { console.warn('ScrollReveal non chargé', e); }
        try { new ParallaxSimple(); } catch (e) { console.warn('Parallax non chargé', e); }
        try { new CounterAnimation(); } catch (e) { console.warn('Counter non chargé', e); }
        try { new TypingEffect(); } catch (e) { console.warn('Typing non chargé', e); }
        try { new RippleEffect(); } catch (e) { console.warn('Ripple non chargé', e); }
    }
}

if (!window.enhancedAnimationsInitialized) {
    window.enhancedAnimationsInitialized = true;
    new EnhancedAnimations();
}