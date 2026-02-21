// Portfolio Professionnel - Version Avancée
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // ===== CONFIGURATION =====
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
    
    // ===== STATE MANAGEMENT =====
    const STATE = {
        theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
        scrollPosition: 0,
        menuOpen: false,
        formSubmitting: false
    };
    
    // ===== CORE UTILITIES =====
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
    
    // ===== THEME MANAGER =====
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
            
            // Update meta theme-color
            const themeColor = theme === 'dark' ? '#111827' : '#ffffff';
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', themeColor);
            }
        }
        
        toggleTheme() {
            const newTheme = STATE.theme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('themeChange', {
                detail: { theme: newTheme }
            }));
        }
        
        bindEvents() {
            if (this.themeSwitcher) {
                this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
            }
            
            // Listen for system preference changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    // ===== NAVIGATION MANAGER =====
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
            // Menu toggle
            if (this.menuToggle) {
                this.menuToggle.addEventListener('click', () => this.toggleMenu());
                this.menuToggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleMenu();
                    }
                });
            }
            
            // Close menu on link click
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
            
            // Close menu on ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
            
            // Smooth scroll for anchor links
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
            
            // Update active link on scroll
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
                        
                        // Update nav links
                        this.navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${sectionId}`) {
                                link.classList.add('active');
                            }
                        });
                        
                        // Dispatch custom event
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
    
    // ===== ANIMATION MANAGER =====
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
            
            // Observe elements with data-animate attribute
            document.querySelectorAll('[data-animate]').forEach(el => {
                this.observer.observe(el);
            });
        }
        
        animateElement(element) {
            const animation = element.dataset.animate;
            element.classList.add('animate__animated', `animate__${animation}`);
            
            // Remove animation class after completion
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
            animateOnScroll(); // Initial check
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
    
    // ===== PROJECTS MANAGER =====
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
            // Filter buttons
            this.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filter = button.dataset.filter;
                    this.setActiveFilter(filter);
                    this.filterProjects(filter);
                });
            });
            
            // Load more
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
                
                // Animate appearance
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
            // Simulate loading more projects
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
    
    // ===== CONTACT FORM MANAGER =====
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
            
            // Real-time validation
            this.form.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', () => this.validateField(input));
                input.addEventListener('blur', () => this.validateField(input));
            });
        }
        
        initValidation() {
            // Add custom validation messages
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
                
                // Simulate API call
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
            // In a real application, replace with actual API call
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Simulate network delay
                    if (Math.random() > 0.1) { // 90% success rate for demo
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
                
                // Hide after 5 seconds
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
    
    // ===== PERFORMANCE MANAGER =====
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
                // Native lazy loading is supported
                lazyImages.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                });
            } else {
                // Fallback to Intersection Observer
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
            // Preload critical resources
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
            // Monitor CLS (Cumulative Layout Shift)
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
                
                // Report CLS to analytics (simulated)
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
    
    // ===== UI ENHANCEMENTS =====
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
                return; // Don't use custom cursor on touch devices
            }
            
            document.addEventListener('mousemove', (e) => {
                this.customCursor.style.left = e.clientX + 'px';
                this.customCursor.style.top = e.clientY + 'px';
            });
            
            // Add hover effects
            const hoverElements = document.querySelectorAll('a, button, [data-cursor="hover"]');
            hoverElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.customCursor.classList.add('hover');
                });
                el.addEventListener('mouseleave', () => {
                    this.customCursor.classList.remove('hover');
                });
            });
            
            // Hide cursor when mouse leaves window
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
    
    // ===== ANALYTICS MANAGER =====
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
            // Track clicks on important elements
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
            
            // Track form interactions
            document.addEventListener('submit', (e) => {
                this.logEvent('form_submit', {
                    formId: e.target.id,
                    formAction: e.target.action
                });
            });
        }
        
        trackPerformance() {
            // Track page load performance
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
            
            // In a real application, send to analytics service
            console.log('Analytics Event:', event);
            
            // Keep only last 100 events in memory
            if (this.events.length > 100) {
                this.events = this.events.slice(-100);
            }
        }
    }
    
    // ===== INITIALIZATION =====
    class PortfolioApp {
        constructor() {
            this.modules = {};
            this.init();
        }
        
        init() {
            console.log('🚀 Portfolio App Initializing...');
            
            // Remove no-js class
            document.documentElement.classList.remove('no-js');
            
            // Initialize modules
            this.modules.theme = new ThemeManager();
            this.modules.navigation = new NavigationManager();
            this.modules.animations = new AnimationManager();
            this.modules.projects = new ProjectsManager();
            this.modules.contact = new ContactFormManager();
            this.modules.performance = new PerformanceManager();
            this.modules.ui = new UIEnhancements();
            this.modules.analytics = new AnalyticsManager();
            
            // Add keyboard shortcuts
            this.initKeyboardShortcuts();
            
            // Initialize error handling
            this.initErrorHandling();
            
            console.log('✅ Portfolio App Initialized!');
        }
        
        initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K to focus search (if implemented)
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    const searchInput = document.querySelector('input[type="search"]');
                    if (searchInput) searchInput.focus();
                }
                
                // Escape to close modals/menus
                if (e.key === 'Escape') {
                    if (this.modules.navigation) {
                        this.modules.navigation.closeMenu();
                    }
                }
                
                // T for theme toggle (Alt+T)
                if (e.key === 't' && e.altKey) {
                    e.preventDefault();
                    if (this.modules.theme) {
                        this.modules.theme.toggleTheme();
                    }
                }
            });
        }
        
        initErrorHandling() {
            // Global error handler
            window.addEventListener('error', (e) => {
                console.error('Global error:', e.error);
                // In production, send to error tracking service
            });
            
            // Unhandled promise rejection
            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
            });
        }
    }
    
    // ===== START THE APP =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PortfolioApp = new PortfolioApp();
        });
    } else {
        window.PortfolioApp = new PortfolioApp();
    }
    
    // ===== GLOBAL EXPORTS =====
    window.portfolioUtils = Utils;
    
    // Performance monitoring (LCP, FID)
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

// ===== AMÉLIORATIONS SUPPLÉMENTAIRES =====

// Gestionnaire de chargement des images
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
                    
                    // Gestion des erreurs de chargement
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

// Gestionnaire de formulaire newsletter
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
            // Simulation d'envoi
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
        // Utiliser le système de notification existant
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

// Analytics personnalisé (version légère)
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
        
        // Envoyer à votre backend ou Google Analytics
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
            if (timeSpent >= 300) { // 5 minutes
                clearInterval(interval);
                console.log('Time on page:', timeSpent, 'seconds');
            }
        }, 30000);
    }
}

// Initialiser les améliorations
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

// Lancer les améliorations après le chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portfolioEnhancements = new PortfolioEnhancements();
    });
} else {
    window.portfolioEnhancements = new PortfolioEnhancements();
}
