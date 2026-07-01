/* script.js - Documentation Portal Interactions */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initDarkMode();
  initSearch();
  initScrollProgress();
  initScrollSpy();
  initMobileNav();
  initAccordions();
  initBackToTop();
  initCounters();
  initScrollAnimations();
  initCharts();
});

/* ==========================================================================
   1. DARK MODE TOGGLE
   ========================================================================== */
function initDarkMode() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  // Check saved preference or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark-mode');
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Re-render charts to update colors for light/dark theme if they exist
    updateChartColors();
  });
}

/* ==========================================================================
   2. LIVE SEARCH SYSTEM
   ========================================================================== */
function initSearch() {
  const searchInput = document.getElementById('doc-search');
  if (!searchInput) return;

  // Create search results dropdown element
  const searchContainer = searchInput.parentElement;
  const resultsDropdown = document.createElement('div');
  resultsDropdown.className = 'search-results-dropdown';
  resultsDropdown.id = 'search-results';
  
  // Custom styling for dropdown in script (avoiding styling leaks)
  resultsDropdown.style.position = 'absolute';
  resultsDropdown.style.top = '100%';
  resultsDropdown.style.left = '0';
  resultsDropdown.style.width = '100%';
  resultsDropdown.style.maxHeight = '300px';
  resultsDropdown.style.overflowY = 'auto';
  resultsDropdown.style.backgroundColor = 'var(--surface)';
  resultsDropdown.style.border = '1px solid var(--surface-border)';
  resultsDropdown.style.borderRadius = 'var(--radius-sm)';
  resultsDropdown.style.boxShadow = 'var(--shadow-lg)';
  resultsDropdown.style.marginTop = '0.5rem';
  resultsDropdown.style.zIndex = '1000';
  resultsDropdown.style.display = 'none';
  resultsDropdown.style.padding = '0.5rem 0';
  
  searchContainer.appendChild(resultsDropdown);

  // Indexing searchable content (section ids, headings, and descriptions)
  const sections = Array.from(document.querySelectorAll('.doc-section'));
  const searchIndex = sections.map(sec => {
    const title = sec.querySelector('.section-title')?.textContent || '';
    const desc = sec.querySelector('.section-desc')?.textContent || '';
    const id = sec.id;
    return { id, title, desc };
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      resultsDropdown.style.display = 'none';
      return;
    }

    const matches = searchIndex.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query)
    );

    renderSearchResults(matches, resultsDropdown, query);
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      resultsDropdown.style.display = 'none';
    }
  });
}

function renderSearchResults(matches, dropdown, query) {
  dropdown.innerHTML = '';
  
  if (matches.length === 0) {
    const noResults = document.createElement('div');
    noResults.style.padding = '0.75rem 1.25rem';
    noResults.style.color = 'var(--text-muted)';
    noResults.style.fontSize = '0.875rem';
    noResults.textContent = 'No documentation sections found';
    dropdown.appendChild(noResults);
    dropdown.style.display = 'block';
    return;
  }

  matches.forEach(match => {
    const item = document.createElement('a');
    item.href = `#${match.id}`;
    item.style.display = 'block';
    item.style.padding = '0.75rem 1.25rem';
    item.style.color = 'var(--text-main)';
    item.style.textDecoration = 'none';
    item.style.fontSize = '0.875rem';
    item.style.transition = 'background-color 0.2s';
    item.style.borderBottom = '1px solid var(--background)';

    // Bold the matching text
    const boldedTitle = match.title.replace(new RegExp(`(${query})`, 'gi'), '<strong>$1</strong>');
    item.innerHTML = `
      <div style="font-weight: 600; color: var(--primary); margin-bottom: 0.15rem;">${boldedTitle}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.desc}</div>
    `;

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = 'var(--background)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.style.display = 'none';
      document.getElementById('doc-search').value = '';
      
      const targetSection = document.getElementById(match.id);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
        
        // Add a clean temporary highlight effect to the selected section
        targetSection.style.transition = 'background-color 0.5s';
        targetSection.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
        setTimeout(() => {
          targetSection.style.backgroundColor = 'transparent';
        }, 1500);
      }
    });

    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
}

/* ==========================================================================
   3. SCROLL PROGRESS INDICATOR
   ========================================================================== */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

/* ==========================================================================
   4. SCROLL SPY (SIDEBAR HIGH-LIGHTING)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.sidebar-menu li a');
  
  if (sections.length === 0 || navLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px', // Trigger when section is in upper-mid viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            
            // Optionally auto-scroll active link into view inside the sidebar
            link.scrollIntoView({ behavior: 'auto', block: 'nearest' });
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Custom click behavior for sidebar links to ensure precise scroll target alignment
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        // Toggle mobile sidebar if active
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
        }
        
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   5. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  if (!hamburgerBtn || !sidebar) return;

  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
  });

  // Close sidebar when clicking outside of it on tablet/mobile screens
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== hamburgerBtn) {
      sidebar.classList.remove('active');
    }
  });
}

/* ==========================================================================
   6. ACCORDION SECTIONS
   ========================================================================== */
function initAccordions() {
  const accordions = document.querySelectorAll('.rule-accordion');
  if (accordions.length === 0) return;

  accordions.forEach(acc => {
    const btn = acc.querySelector('.rule-header-btn');
    const body = acc.querySelector('.rule-body');
    
    // Open the first accordion by default
    if (acc.classList.contains('active') && body) {
      body.style.maxHeight = body.scrollHeight + 'px';
    }

    btn.addEventListener('click', () => {
      const isActive = acc.classList.contains('active');
      
      // Close all other accordions first (accordion style)
      accordions.forEach(item => {
        item.classList.remove('active');
        const itemBody = item.querySelector('.rule-body');
        if (itemBody) itemBody.style.maxHeight = null;
      });

      // Toggle current
      if (!isActive) {
        acc.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        acc.classList.remove('active');
        body.style.maxHeight = null;
      }
    });
  });

  // Handle Functional Module tabs as well
  const moduleTabs = document.querySelectorAll('.module-tab-btn');
  const modulePanels = document.querySelectorAll('.module-panel');
  if (moduleTabs.length > 0 && modulePanels.length > 0) {
    moduleTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-module');
        
        moduleTabs.forEach(t => t.classList.remove('active'));
        modulePanels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }
}

/* ==========================================================================
   7. BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   8. ANIMATED STATISTICS COUNTERS
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length === 0) return;

  const observerOptions = {
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetVal = parseInt(target.getAttribute('data-target'), 10);
        const suffix = target.getAttribute('data-suffix') || '';
        let start = 0;
        const duration = 1500; // Total count up time
        const stepTime = Math.max(Math.floor(duration / targetVal), 15);
        
        const timer = setInterval(() => {
          start += Math.ceil(targetVal / 100) || 1;
          if (start >= targetVal) {
            target.textContent = targetVal + suffix;
            clearInterval(timer);
          } else {
            target.textContent = start + suffix;
          }
        }, stepTime);

        observer.unobserve(target); // Only animate once
      }
    });
  }, observerOptions);

  counters.forEach(counter => observer.observe(counter));
}

/* ==========================================================================
   9. SCROLL ANIMATIONS (FADE-IN AND SLIDE-UP)
   ========================================================================== */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
  if (animatedElements.length === 0) return;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   10. INTERACTIVE CHART.JS CHARTS
   ========================================================================== */
let complaintPieChart, resolutionBarChart, volumeLineChart;

function initCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') return;

  const pieCtx = document.getElementById('complaintPieChart');
  const barCtx = document.getElementById('resolutionBarChart');
  const lineCtx = document.getElementById('volumeLineChart');

  if (!pieCtx || !barCtx || !lineCtx) return;

  // Chart Global Settings based on current mode
  const textPrimary = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
  const borderCol = getComputedStyle(document.body).getPropertyValue('--surface-border').trim();

  // 1. Complaint Distribution Pie Chart
  complaintPieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Academic Issues', 'Infrastructure', 'Hostel Facilities', 'Hostel Mess', 'Administrative Fees', 'Harassment/Safety'],
      datasets: [{
        data: [35, 20, 15, 12, 10, 8],
        backgroundColor: [
          '#2563eb', // Academic
          '#3b82f6', // Infra
          '#10b981', // Hostel
          '#f59e0b', // Mess
          '#ec4899', // Administrative
          '#ef4444'  // Harassment
        ],
        borderWidth: 2,
        borderColor: getComputedStyle(document.body).getPropertyValue('--surface').trim()
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textPrimary,
            font: { family: 'Inter', size: 11, weight: 500 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${context.raw}%`
          }
        }
      }
    }
  });

  // 2. Average Resolution Time Bar Chart (Days by Tier)
  resolutionBarChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Teacher', 'Tutor Guardian', 'Class Incharge', 'HOD', 'Committee', 'Admin'],
      datasets: [{
        label: 'Resolution SLA Limit (Days)',
        data: [2, 4, 5, 7, 10, 15],
        backgroundColor: 'rgba(37, 99, 235, 0.25)',
        borderColor: '#2563eb',
        borderWidth: 1.5
      }, {
        label: 'Average Actual Resolution (Days)',
        data: [1.2, 2.5, 3.1, 4.8, 6.5, 9.2],
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textPrimary, font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: borderCol },
          ticks: { color: textPrimary, font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textPrimary,
            font: { family: 'Inter', size: 10, weight: 500 }
          }
        }
      }
    }
  });

  // 3. Monthly Complaint Volume Line Chart
  volumeLineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Registered Complaints',
        data: [140, 165, 210, 195, 120, 80, 65, 150, 240, 260, 225, 180],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#2563eb'
      }, {
        label: 'Resolved Complaints',
        data: [135, 158, 202, 191, 118, 80, 65, 142, 228, 252, 221, 178],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textPrimary, font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: borderCol },
          ticks: { color: textPrimary, font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textPrimary,
            font: { family: 'Inter', size: 10, weight: 500 }
          }
        }
      }
    }
  });
}

function updateChartColors() {
  if (typeof Chart === 'undefined') return;

  const textPrimary = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
  const borderCol = getComputedStyle(document.body).getPropertyValue('--surface-border').trim();
  const surfaceCol = getComputedStyle(document.body).getPropertyValue('--surface').trim();

  // Update Doughnut border
  if (complaintPieChart) {
    complaintPieChart.data.datasets[0].borderColor = surfaceCol;
    complaintPieChart.options.plugins.legend.labels.color = textPrimary;
    complaintPieChart.update();
  }

  // Update Bar scales and legends
  if (resolutionBarChart) {
    resolutionBarChart.options.scales.x.ticks.color = textPrimary;
    resolutionBarChart.options.scales.y.ticks.color = textPrimary;
    resolutionBarChart.options.scales.y.grid.color = borderCol;
    resolutionBarChart.options.plugins.legend.labels.color = textPrimary;
    resolutionBarChart.update();
  }

  // Update Line scales and legends
  if (volumeLineChart) {
    volumeLineChart.options.scales.x.ticks.color = textPrimary;
    volumeLineChart.options.scales.y.ticks.color = textPrimary;
    volumeLineChart.options.scales.y.grid.color = borderCol;
    volumeLineChart.options.plugins.legend.labels.color = textPrimary;
    volumeLineChart.update();
  }
}
