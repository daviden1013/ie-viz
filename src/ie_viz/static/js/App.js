class App {
    constructor(data) {
        // Store initial data
        this.data = data;
        this.currentTheme = data.theme;
        this.activeEntities = data.entities;
        this.activeRelations = data.relations || null;
        this.relationPathLevel = 5;

        // Initialize managers
        this.displayManager = new DisplayTextBoxManager(
            data.light_theme_colors,
            data.dark_theme_colors
        );
        this.filterManager = new FilterManager(this.applyFilters.bind(this));
        this.tableManager = new TableManager(
            data.light_theme_colors,
            data.dark_theme_colors,
            this.handleEntityClick.bind(this)
        );

        // Bind methods
        this.toggleTheme = this.toggleTheme.bind(this);
        this.initializeUI = this.initializeUI.bind(this);
        this.handleEntityHighlight = this.handleEntityHighlight.bind(this);
        this.handleEntityClick = this.handleEntityClick.bind(this);
    }

    async initialize() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize UI elements
        this.initializeUI();

        // Set initial theme
        if (this.data.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Initialize displays
        this.displayManager.updateEntities(this.data.text, this.activeEntities, this.currentTheme);

        if (this.activeRelations) {
            this.displayManager.alineDisplayRelation();
            this.displayManager.updateRelations(this.activeRelations, this.relationPathLevel);

            // Add event listeners for relations
            window.addEventListener('scroll', () => {
                this.displayManager.updateRelations(this.activeRelations, this.relationPathLevel);
            });

            window.addEventListener('resize', () => {
                this.displayManager.updateRelations(this.activeRelations, this.relationPathLevel);
            });
        }
    }

    initializeUI() {
        const header = document.createElement('div');
        header.className = 'header-container';
        document.body.appendChild(header);

        const themeButton = this.createThemeButton();
        header.appendChild(themeButton);

        const {filterButton, filterPanel, filterOverlay} = this.createFilterElements();
        header.appendChild(filterButton);
        document.body.appendChild(filterPanel);
        document.body.appendChild(filterOverlay);

        const filterState = this.filterManager.extractAttributeFilters(this.data.entities);
        this.filterManager.createFilterUI(filterPanel.querySelector('div'));

        const {tableButton, tablePanel} = this.createTableElements();
        header.appendChild(tableButton);
        document.body.appendChild(tablePanel);

        this.setupEventListeners(filterButton, filterPanel, filterOverlay, tableButton, tablePanel);
    }

    createThemeButton() {
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-button';
        themeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
        themeButton.addEventListener('click', this.toggleTheme);
        return themeButton;
    }

    createFilterElements() {
        const filterButton = document.createElement('button');
        filterButton.className = 'filters-button';
        filterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>';

        const filterPanel = document.createElement('div');
        filterPanel.className = 'filters-panel';
        filterPanel.innerHTML = '<div style="padding: 2rem;"><h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Filters</h2></div>';

        const filterOverlay = document.createElement('div');
        filterOverlay.className = 'filters-overlay';

        return { filterButton, filterPanel, filterOverlay };
    }

    createTableElements() {
        const tableButton = document.createElement('button');
        tableButton.className = 'table-button';
        tableButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>';

        const tablePanel = this.tableManager.createTablePanel(this.data.text, this.activeEntities, this.activeRelations, this.currentTheme);

        return { tableButton, tablePanel };
    }

    setupEventListeners(filterButton, filterPanel, filterOverlay, tableButton, tablePanel) {
        // Filter panel events
        filterButton.addEventListener('click', () => {
            filterPanel.classList.toggle('open');
            filterOverlay.classList.toggle('open');
        });

        filterOverlay.addEventListener('click', () => {
            filterPanel.classList.remove('open');
            filterOverlay.classList.remove('open');
        });

        // Table panel events
        tableButton.addEventListener('click', () => {
            tablePanel.classList.toggle('open');
            const container = document.getElementById('display-textbox-container');
            container.classList.toggle('with-table');
            
            if (this.activeRelations) {
                setTimeout(() => {
                    this.displayManager.alineDisplayRelation();
                    this.displayManager.updateRelations(this.activeRelations, this.relationPathLevel);
                }, 300);
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme');
        this.displayManager.updateEntities(this.data.text, this.activeEntities, this.currentTheme);
        this.tableManager.updateEntityTable(this.data.text, this.activeEntities, this.currentTheme);
        if (this.activeRelations) {
            this.tableManager.updateRelationTable(this.data.text, this.activeEntities, this.activeRelations, this.currentTheme);
        }
    }

    applyFilters(filterState) {
        this.activeEntities = this.data.entities.filter(entity => {
            const selectedFilters = filterState.keys.filter(f => f.selected);
            if (selectedFilters.length === 0) return true;

            const matchesFilter = (filter) => {
                if (entity.attr) {
                    const entityValue = entity.attr[filter.key];
                    if (!entityValue) return false;
                    return filter.valueFilters.some(valueFilter => 
                        valueFilter.selected && valueFilter.value === entityValue
                    );
                }
            };

            if (filterState.useAndLogic) {
                if (!entity.attr) return false;
                return selectedFilters.every(matchesFilter);
            } else {
                if (!entity.attr) return true;
                return selectedFilters.some(matchesFilter);
            }
        });
        
        this.displayManager.updateEntities(this.data.text, this.activeEntities, this.currentTheme);
        this.tableManager.updateEntityTable(this.data.text, this.activeEntities, this.currentTheme);
        
        if (this.data.relations) {
            requestAnimationFrame(() => {
                const activeEntityIds = new Set(this.activeEntities.map(e => e.entity_id));
                
                this.activeRelations = this.data.relations.filter(rel => {
                    const entity1Exists = document.getElementById(rel.entity_1_id) !== null;
                    const entity2Exists = document.getElementById(rel.entity_2_id) !== null;
                    return activeEntityIds.has(rel.entity_1_id) && 
                           activeEntityIds.has(rel.entity_2_id) &&
                           entity1Exists && entity2Exists;
                });
                
                this.displayManager.updateRelations(this.activeRelations, this.relationPathLevel);
                if (this.activeRelations) {
                    this.tableManager.updateRelationTable(this.data.text, this.activeEntities, this.activeRelations, this.currentTheme);
                }
            });
        }
    }

    handleEntityHighlight(entityId, isEnter) {
        this.displayManager.handleEntityHighlight(entityId, isEnter);
        this.tableManager.handleEntityHighlight(entityId, isEnter);
    }

    handleEntityClick(entityId) {
        this.displayManager.scrollToEntity(entityId);
    }
}

// Initialize the application when the script loads
const app = new App(data);
app.initialize();