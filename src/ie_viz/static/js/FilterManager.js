class FilterManager {
    constructor(onFilterChange) {
        this.onFilterChange = onFilterChange;
        this.filterState = null;
    }

    extractAttributeFilters(entities) {
        const attributeFilters = new Map();
        
        entities.forEach(entity => {
            if (entity.attr) {
                Object.entries(entity.attr).forEach(([key, value]) => {
                    if (!attributeFilters.has(key)) {
                        attributeFilters.set(key, new Set());
                    }
                    attributeFilters.get(key).add(value);
                });
            }
        });
        
        this.filterState = {
            keys: Array.from(attributeFilters.entries()).map(([key, values]) => ({
                key,
                values: Array.from(values),
                selected: true,
                valueFilters: Array.from(values).map(value => ({
                    value,
                    selected: true
                }))
            })),
            useAndLogic: false
        };

        return this.filterState;
    }

    handleFilterChange() {
        if (this.onFilterChange) {
            this.onFilterChange(this.filterState);
        }
    }

    createFilterUI(panel) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'attribute-filters';
        filterContainer.style.padding = '0 2rem 2rem 2rem';
    
        // Add logic toggle switch
        const logicToggleContainer = document.createElement('div');
        logicToggleContainer.className = 'logic-toggle';
        logicToggleContainer.style.marginBottom = '1.5rem';
        logicToggleContainer.style.padding = '1rem';
        logicToggleContainer.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
        logicToggleContainer.style.borderRadius = '4px';
    
        const logicLabel = document.createElement('label');
        logicLabel.className = 'logic-label';
        logicLabel.style.display = 'flex';
        logicLabel.style.alignItems = 'center';
        logicLabel.style.justifyContent = 'space-between';
        logicLabel.style.cursor = 'pointer';
    
        const labelText = document.createElement('span');
        labelText.textContent = 'Logic between attribute keys: ';
        labelText.style.marginRight = '8px';
    
        const toggleContainer = document.createElement('div');
        toggleContainer.style.display = 'flex';
        toggleContainer.style.alignItems = 'center';
        toggleContainer.style.gap = '8px';
    
        const orText = document.createElement('span');
        orText.textContent = 'OR';
        orText.style.fontSize = '0.9em';
    
        const toggleSwitch = document.createElement('div');
        toggleSwitch.className = 'toggle-switch';
    
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = this.filterState.useAndLogic;
        toggleInput.addEventListener('change', (e) => {
            this.filterState.useAndLogic = e.target.checked;
            this.handleFilterChange();
        });
    
        const toggleSlider = document.createElement('span');
        toggleSlider.className = 'toggle-slider';
    
        const andText = document.createElement('span');
        andText.textContent = 'AND';
        andText.style.fontSize = '0.9em';
    
        toggleSwitch.appendChild(toggleInput);
        toggleSwitch.appendChild(toggleSlider);
    
        toggleContainer.appendChild(orText);
        toggleContainer.appendChild(toggleSwitch);
        toggleContainer.appendChild(andText);
    
        logicLabel.appendChild(labelText);
        logicLabel.appendChild(toggleContainer);
        logicToggleContainer.appendChild(logicLabel);
        filterContainer.appendChild(logicToggleContainer);
    
        // Create attribute key sections
        this.filterState.keys.forEach(filter => {
            const keySection = document.createElement('div');
            keySection.className = 'filter-section';
            keySection.style.marginBottom = '1rem';
    
            const keyCheckbox = document.createElement('input');
            keyCheckbox.type = 'checkbox';
            keyCheckbox.checked = filter.selected;
            keyCheckbox.id = `filter-${filter.key}`;
            keyCheckbox.style.marginRight = '0.5rem';
    
            const keyLabel = document.createElement('label');
            keyLabel.htmlFor = `filter-${filter.key}`;
            keyLabel.textContent = filter.key;
            keyLabel.style.fontWeight = 'bold';
    
            const valuesContainer = document.createElement('div');
            valuesContainer.style.marginLeft = '1.5rem';
            valuesContainer.style.marginTop = '0.5rem';
    
            keySection.appendChild(keyCheckbox);
            keySection.appendChild(keyLabel);
    
            filter.valueFilters.forEach(valueFilter => {
                const valueDiv = document.createElement('div');
                valueDiv.style.marginBottom = '0.25rem';
    
                const valueCheckbox = document.createElement('input');
                valueCheckbox.type = 'checkbox';
                valueCheckbox.checked = valueFilter.selected;
                valueCheckbox.id = `filter-${filter.key}-${valueFilter.value}`;
                valueCheckbox.style.marginRight = '0.5rem';
    
                const valueLabel = document.createElement('label');
                valueLabel.htmlFor = `filter-${filter.key}-${valueFilter.value}`;
                valueLabel.textContent = valueFilter.value;
    
                valueDiv.appendChild(valueCheckbox);
                valueDiv.appendChild(valueLabel);
                valuesContainer.appendChild(valueDiv);
    
                valueCheckbox.addEventListener('change', (e) => {
                    valueFilter.selected = e.target.checked;
                    this.handleFilterChange();
                });
            });
    
            keySection.appendChild(valuesContainer);
            filterContainer.appendChild(keySection);
    
            keyCheckbox.addEventListener('change', (e) => {
                filter.selected = e.target.checked;
                filter.valueFilters.forEach(valueFilter => {
                    valueFilter.selected = e.target.checked;
                    const valueCheckbox = document.getElementById(`filter-${filter.key}-${valueFilter.value}`);
                    if (valueCheckbox) {
                        valueCheckbox.checked = e.target.checked;
                    }
                });
                this.handleFilterChange();
            });
        });
    
        panel.appendChild(filterContainer);
    }
}