class DisplayTextBoxManager {
    constructor(light_theme_colors, dark_theme_colors) {
        this.light_theme_colors = light_theme_colors;
        this.dark_theme_colors = dark_theme_colors;
    }


    updateEntities(text, entities, currentTheme) {
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
        entities.forEach(entity => {
            entity.start = parseInt(entity.start);
            entity.end = parseInt(entity.end);
        });
        entities.sort((a, b) => a.start - b.start);

        // Add entities to the display textbox
        var lastIndex = 0;
        entities.forEach(entity => {
            // Add text before the entity
            if (lastIndex < entity.start) {
                var nonEntityText = text.substring(lastIndex, entity.start);
                nonEntityText.split('\n').forEach((line, index, array) => {
                    textElement.appendChild(document.createTextNode(line));
                    if (index < array.length - 1) {
                        textElement.appendChild(document.createElement("br"));
                    }
                });
            }

            // Add the entity text
            var entityText = text.substring(entity.start, entity.end);
            var entityElement = document.createElement("mark");
            entityElement.id = entity.entity_id;
            entityElement.setAttribute('entity-id', entity.entity_id);
            entityElement.className = "entity-mark";
            entityElement.textContent = entityText;
            entityElement.addEventListener('mouseenter', () => this.handleEntityHighlight(entity.entity_id, true));
            entityElement.addEventListener('mouseleave', () => this.handleEntityHighlight(entity.entity_id, false));

            // Assign entity color. If no color is provided, use the default background color in CSS
            if (entity.color !== undefined) {
                entityElement.style.background = 'none';
                // if entity.color is a string, use it as the background color
                if (typeof entity.color === 'string') {
                    entityElement.style.backgroundColor = entity.color;
                }
                // if entity.color is a integer, use it as the index of the color palette
                else if (typeof entity.color === 'number') {
                    if (currentTheme === 'light') {
                        entityElement.style.backgroundColor = this.light_theme_colors[entity.color]["color_code"];
                    }
                    else {
                        entityElement.style.backgroundColor = this.dark_theme_colors[entity.color]["color_code"];
                    }
                }
            }

            entityElement.addEventListener('mouseenter', (event) => {
                if (entity.attr) {
                    const prettyAttributes = JSON.stringify(entity.attr, null, 2).replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
                    this.showTooltip(event, `Entity ID: ${entity.entity_id}<br>Text: ${entityText}<br>Attributes: ${prettyAttributes}`);
                }
                else {
                    this.showTooltip(event, `Entity ID: ${entity.entity_id}<br>Text: ${entityText}`);
                }
            });

            entityElement.addEventListener('mouseleave', (event) => {
                this.hideTooltip();
            });
            textElement.appendChild(entityElement);

            lastIndex = entity.end;
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

    
    showTooltip(event, content) {
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

    hideTooltip() {
        var tooltip = document.getElementById("custom-tooltip");
        if (tooltip) {
            tooltip.remove();
        }
    }


    handleEntityHighlight(entityId, isEnter) {
        // Find all entities with this ID in the text display
        const textEntities = document.querySelectorAll(`mark[entity-id="${entityId}"]`);
        
        textEntities.forEach(entity => {
            if (isEnter) {
                entity.classList.add('entity-highlight');
                // Get the background color and use it for the glow
                const style = window.getComputedStyle(entity);
                const backgroundColor = style.backgroundColor;
                const glowColor = backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent' ? '#3f87a6' : backgroundColor;
                entity.style.boxShadow = `0 0 8px ${glowColor}, 0 0 12px ${glowColor}`;
            } else {
                entity.classList.remove('entity-highlight');
                entity.style.boxShadow = '';
            }
        });
    }

    alineDisplayRelation() {
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

    updateRelations(relations, r) {
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

}