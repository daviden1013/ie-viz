// Global variables
let activeEntities = data.entities;
let filteredRelations = null;
if ('relations' in data) {
    filteredRelations = data.relations;
};
let relationPathLevel = 5;

// This function wait until an element is rendered
const checkElement = async selector => {
    while ( document.getElementById(selector) === null) {
        await new Promise( resolve =>  requestAnimationFrame(resolve) )
    }
    return document.getElementById(selector);
};


function initializeFilters() {
    // Create header container
    const header = document.createElement('div');
    header.className = 'header-container';
    document.body.appendChild(header);

    // Create filter button
    const button = document.createElement('button');
    button.className = 'filters-button';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>';
    header.appendChild(button);

    const panel = document.createElement('div');
    panel.className = 'filters-panel';
    panel.innerHTML = '<div style="padding: 2rem;"><h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Filters</h2></div>';
    document.body.appendChild(panel);

    const overlay = document.createElement('div');
    overlay.className = 'filters-overlay';
    document.body.appendChild(overlay);

    button.addEventListener('click', () => {
        panel.classList.toggle('open');
        overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
        panel.classList.remove('open');
        overlay.classList.remove('open');
    });
    
    const filterState = extractAttributeFilters(data.entities);
    createFilterUI(filterState, panel.querySelector('div'));
}


// Function to extract unique attributes and their values
function extractAttributeFilters(entities) {
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
    
    return {
        keys: Array.from(attributeFilters.entries()).map(([key, values]) => ({
            key,
            values: Array.from(values),
            selected: true,
            valueFilters: Array.from(values).map(value => ({
                value,
                selected: true
            }))
        })),
        useAndLogic: false // Default to OR logic between keys
    };
}

// Function to create the filter UI
function createFilterUI(filterState, panel) {
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
    toggleInput.checked = filterState.useAndLogic;
    toggleInput.addEventListener('change', (e) => {
        filterState.useAndLogic = e.target.checked;
        applyFilters(filterState);
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
    filterState.keys.forEach(filter => {
        const keySection = document.createElement('div');
        keySection.className = 'filter-section';
        keySection.style.marginBottom = '1rem';

        // Create key checkbox
        const keyCheckbox = document.createElement('input');
        keyCheckbox.type = 'checkbox';
        keyCheckbox.checked = filter.selected;
        keyCheckbox.id = `filter-${filter.key}`;
        keyCheckbox.style.marginRight = '0.5rem';

        // Create key label
        const keyLabel = document.createElement('label');
        keyLabel.htmlFor = `filter-${filter.key}`;
        keyLabel.textContent = filter.key;
        keyLabel.style.fontWeight = 'bold';

        // Create values container
        const valuesContainer = document.createElement('div');
        valuesContainer.style.marginLeft = '1.5rem';
        valuesContainer.style.marginTop = '0.5rem';

        // Add key checkbox and label
        keySection.appendChild(keyCheckbox);
        keySection.appendChild(keyLabel);

        // Add value checkboxes
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

            // Add value checkbox event listener
            valueCheckbox.addEventListener('change', (e) => {
                valueFilter.selected = e.target.checked;
                applyFilters(filterState);
            });
        });

        keySection.appendChild(valuesContainer);
        filterContainer.appendChild(keySection);

        // Add key checkbox event listener
        keyCheckbox.addEventListener('change', (e) => {
            filter.selected = e.target.checked;
            // Update all value checkboxes under this key
            filter.valueFilters.forEach(valueFilter => {
                valueFilter.selected = e.target.checked;
                const valueCheckbox = document.getElementById(`filter-${filter.key}-${valueFilter.value}`);
                if (valueCheckbox) {
                    valueCheckbox.checked = e.target.checked;
                }
            });
            applyFilters(filterState);
        });
    });

    panel.appendChild(filterContainer);
}

// Function to apply filters to entities
function applyFilters(filterState) {
    activeEntities = data.entities.filter(entity => {
        if (!entity.attr) {
            return false;
        }
        
        // Get only selected filters
        const selectedFilters = filterState.keys.filter(f => f.selected);
        
        if (selectedFilters.length === 0) {
            return true;
        }

        // Function to check if entity matches a single filter key
        const matchesFilter = (filter) => {
            const entityValue = entity.attr[filter.key];
            
            if (!entityValue) {
                return false;
            }
            
            // OR logic within key's values - match any selected value
            const matches = filter.valueFilters.some(valueFilter => 
                valueFilter.selected && valueFilter.value === entityValue
            );
            return matches;
        };

        let result;
        if (filterState.useAndLogic) {
            // AND logic between keys - must match ALL selected filter keys
            result = selectedFilters.every(matchesFilter);
        } else {
            // OR logic between keys - must match ANY selected filter key
            result = selectedFilters.some(matchesFilter);
        }
        
        return result;
    });
    
    // Update display with filtered entities and handle relations after entities are updated
    updateEntities(data.text, activeEntities);
    
    // Wait for the next frame to ensure entities are rendered
    requestAnimationFrame(() => {
        if (data.relations) {
            const activeEntityIds = new Set(activeEntities.map(e => e.entity_id));
            
            filteredRelations = data.relations.filter(rel => {
                const entity1Exists = document.getElementById(rel.entity_1_id) !== null;
                const entity2Exists = document.getElementById(rel.entity_2_id) !== null;

                return activeEntityIds.has(rel.entity_1_id) && 
                       activeEntityIds.has(rel.entity_2_id) &&
                       entity1Exists && entity2Exists;
            });
            
            updateRelations(filteredRelations, relationPathLevel);
        } 
    });
}


function alineDisplayRelation() {
    // Get the display-textbox (div) and display-relation (svg) elements
    const textDiv = document.getElementById("display-textbox");
    const svgContainer = document.getElementById("display-relation");
    
    if (!textDiv || !svgContainer) {
        console.error("Required elements not found");
        return;
    }

    // Get dimensions of the display-textbox
    const textDivRect = textDiv.getBoundingClientRect();

    // Set dimensions of the SVG container
    svgContainer.style.height = `${textDivRect.height}px`;
    svgContainer.style.width = `${textDivRect.width}px`;
    
    // Ensure SVG viewport is set correctly
    svgContainer.setAttribute('viewBox', `0 0 ${textDivRect.width} ${textDivRect.height}`);
}

function updateEntities(text, entities) {
    // Clear current display textbox
    var textElement = document.getElementById("display-textbox");
    textElement.innerHTML = '';

    // If no entities
    if (!entities || entities.length === 0) {
        text.split('\n').forEach((line, index, array) => {
            textElement.appendChild(document.createTextNode(line));
            if (index < array.length - 1) {
                textElement.appendChild(document.createElement("br"));
            }
        });
        return null;
    }

    // Sort entities by start index
    entities.forEach(ent => {
        ent.start = parseInt(ent.start);
        ent.end = parseInt(ent.end);
    });
    entities.sort((a, b) => a.start - b.start);

    // Add entities to the display textbox
    var lastIndex = 0;
    entities.forEach(ent => {
        // Add text before the entity
        if (lastIndex < ent.start) {
            var nonEntityText = text.substring(lastIndex, ent.start);
            nonEntityText.split('\n').forEach((line, index, array) => {
                textElement.appendChild(document.createTextNode(line));
                if (index < array.length - 1) {
                    textElement.appendChild(document.createElement("br"));
                }
            });
        }

        // Add the entity text
        var entityText = text.substring(ent.start, ent.end);
        var entityElement = document.createElement("mark");
        entityElement.id = ent.entity_id;
        entityElement.className = "entity-mark";
        entityElement.textContent = entityText;
        if (ent.color) {
            entityElement.style.background = 'none';
            entityElement.style.backgroundColor = ent.color;
        }
        entityElement.addEventListener('mouseenter', function(event) {
            if (ent.attr) {
                const prettyAttributes = JSON.stringify(ent.attr, null, 2).replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
                showTooltip(event, `Entity ID: ${ent.entity_id}<br>Text: ${entityText}<br>Attributes: ${prettyAttributes}`);
            }
            else {
                showTooltip(event, `Entity ID: ${ent.entity_id}<br>Text: ${entityText}`);
            }
        });
        entityElement.addEventListener('mouseleave', function() {
            hideTooltip();
        });
        textElement.appendChild(entityElement);

        lastIndex = ent.end;
    });

    // Add remaining text after the last entity
    if (lastIndex < text.length) {
        var remainingText = text.substring(lastIndex);
        remainingText.split('\n').forEach((line, index, array) => {
            textElement.appendChild(document.createTextNode(line));
            if (index < array.length - 1) {
                textElement.appendChild(document.createElement("br"));
            }
        });
    }
}

function showTooltip(event, content) {
    // Remove any existing tooltip
    var existingTooltip = document.getElementById("custom-tooltip");
    if (existingTooltip) {
        existingTooltip.remove();
    }

    // Create a new tooltip
    var tooltip = document.createElement("div");
    tooltip.id = "custom-tooltip";
    tooltip.className = "custom-tooltip";
    tooltip.innerHTML = content;
    document.body.appendChild(tooltip); 

    // Limit the tooltip width to 1/3 of the screen width
    var maxWidth = window.innerWidth / 3;
    tooltip.style.maxWidth = maxWidth + "px";
    
    // Position the tooltip
    var rect = event.target.getBoundingClientRect();
    var x = rect.left + window.scrollX;
    // 5px above the entity
    var y = rect.top + window.scrollY - tooltip.offsetHeight - 5; 

    // Ensure the tooltip doesn't go off-screen
    if (x + tooltip.offsetWidth > window.innerWidth) {
        // 10px padding from the right edge
        x = window.innerWidth - tooltip.offsetWidth - 10; 
    }
    if (y < 0) {
        // 5px below the entity if it goes off-screen
        y = rect.bottom + window.scrollY + 5; 
    }

    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
}

function hideTooltip() {
    var tooltip = document.getElementById("custom-tooltip");
    if (tooltip) {
        tooltip.remove();
    }
}

function updateRelations(relations, r) {
    // Get the display-textbox (div) and display-relation (svg) elements
    const textDiv = document.getElementById("display-textbox");
    const svgContainer = document.getElementById("display-relation");
    
    if (!textDiv || !svgContainer) {
        console.error("Required elements not found for updating relations");
        return;
    }

    const textDivRect = textDiv.getBoundingClientRect();

    // Clear current relation lines
    svgContainer.innerHTML = '';

    // If no relations
    if (!relations || relations.length === 0) {
        return null;
    }

    relations.forEach((rel, index) => {
        const entity1Element = document.getElementById(rel.entity_1_id);
        const entity2Element = document.getElementById(rel.entity_2_id);

        // Check if elements exist
        if (!entity1Element || !entity2Element) {
            console.error('Entity elements not found:', {
                relation: rel,
                entity1Found: !!entity1Element,
                entity2Found: !!entity2Element
            });
            return;
        }

        const entity1Rect = entity1Element.getBoundingClientRect();
        const entity2Rect = entity2Element.getBoundingClientRect();

        // Get the computed style of the entity elements
        const entity1Style = window.getComputedStyle(entity1Element);
        const entity2Style = window.getComputedStyle(entity2Element);
        const entity1LineHeight = parseFloat(entity1Style.lineHeight);
        const entity2LineHeight = parseFloat(entity2Style.lineHeight);

        // Calculate the number of lines
        const entity1Lines = entity1Rect.height / entity1LineHeight;
        const entity2Lines = entity2Rect.height / entity2LineHeight;

        // Handle line-broken entity
        const entity1X = entity1Lines > 2 
            ? (entity1Rect.right - textDivRect.left)
            : (entity1Rect.left + entity1Rect.width / 2 - textDivRect.left);
        
        const entity1Y = entity1Rect.top - textDivRect.top;
        
        const entity2X = entity2Lines > 2 
            ? (entity2Rect.right - textDivRect.left)
            : (entity2Rect.left + entity2Rect.width / 2 - textDivRect.left);
        
        const entity2Y = entity2Rect.top - textDivRect.top;

        // start with entity on left
        var startX = null;
        var startY = null;
        var endX = null;
        var endY = null;
        if (entity1X < entity2X) {
            startX = entity1X;
            startY = entity1Y;
            endX = entity2X;
            endY = entity2Y;
        } else {
            startX = entity2X;
            startY = entity2Y;
            endX = entity1X;
            endY = entity1Y;
        }

        // Create the SVG path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let pathD;
        // If start and end entities are on the same y-axis
        if (startY === endY) {
            pathD = `M${startX} ${startY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${startY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`;
        }
        // If start entity is below end entities
        else if (startY > endY) {
            pathD = `M${startX} ${startY} L${startX} ${endY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${endY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`;
        }
        // If start entity is above end entities
        else {
            pathD = `M${startX} ${startY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${startY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`;
        }
        
        path.setAttribute("d", pathD);
        path.setAttribute("class", "relation-path");
        svgContainer.appendChild(path);
    });
}

// Get the data from the script tag
if ('theme' in data) {
    if (data.theme === 'dark') {
        document.body.className = '';
        document.body.classList.add('dark-theme');
    }
}

// Update the entities and relations
updateEntities(data.text, activeEntities);

if ('relations' in data) {
    alineDisplayRelation();
    updateRelations(filteredRelations, relationPathLevel);

    // Add event listener for the main page scroll
    window.addEventListener('scroll', () => {
        updateRelations(filteredRelations, relationPathLevel);
    });

    // Add event listener for the main page resize
    window.addEventListener('resize', () => {
        updateRelations(filteredRelations, relationPathLevel);
    });
}

// Initialize filters
document.addEventListener('DOMContentLoaded', initializeFilters);
