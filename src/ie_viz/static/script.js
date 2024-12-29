function alineDisplayRelation(svg_padding_size) {
    // Get the display-textbox (div) and display-relation (svg) elements
    const textDiv = document.getElementById("display-textbox");
    const svgContainer = document.getElementById("display-relation");
    // Get dimensions of the display-textbox
    const textDivRect = textDiv.getBoundingClientRect();
    // Set dimensions of the SVG container
    svgContainer.style.top = (textDivRect.top - svg_padding_size) + 'px';
    svgContainer.style.left = (textDivRect.left - svg_padding_size) + 'px';
    svgContainer.style.height = (textDivRect.height + 2*svg_padding_size) + 'px';
    svgContainer.style.width = (textDivRect.width + 2*svg_padding_size) + 'px';
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
    // 15px above the entity
    var y = rect.top + window.scrollY - tooltip.offsetHeight - 15; 

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

function updateRelations(relations, r, svg_padding_size) {
    /* 
    * Update the relation lines between entities 
    *
    * relations: list of relation objects with entity_1_id and entity_2_id
    * r: level size for the relation paths
    * svg_padding_size: padding size for the svg container
    */

    // If no relations
    if (!relations || relations.length === 0) {
        return null;
    }

    // Get the display-textbox (div) and display-relation (svg) elements
    const textDiv = document.getElementById("display-textbox");
    const svgContainer = document.getElementById("display-relation");
    const textDivRect = textDiv.getBoundingClientRect();

    // Clear current relation lines
    svgContainer.innerHTML = '';

    relations.forEach(rel => {
        const entity1Element = document.getElementById(rel.entity_1_id);
        const entity2Element = document.getElementById(rel.entity_2_id);

        // Check if elements exist
        if (!entity1Element || !entity2Element) {
            console.error('Entity elements not found:', rel.entity_1_id, rel.entity_2_id);
            return;
        }

        const entity1Rect = entity1Element.getBoundingClientRect();
        const entity2Rect = entity2Element.getBoundingClientRect();

        // Get the computed style of the entity elements to determine the line height
        const entity1Style = window.getComputedStyle(entity1Element);
        const entity2Style = window.getComputedStyle(entity2Element);
        const entity1LineHeight = parseFloat(entity1Style.lineHeight);
        const entity2LineHeight = parseFloat(entity2Style.lineHeight);

        // Calculate the number of lines
        const entity1Lines = entity1Rect.height / entity1LineHeight;
        const entity2Lines = entity2Rect.height / entity2LineHeight;

        // Handle line-broken entity
        // When an entity is split by line change, we use the top-left as StartX
        const entity1X = entity1Lines > 2 ? entity1Rect.right - textDivRect.left + svg_padding_size : entity1Rect.left + entity1Rect.width / 2 - textDivRect.left + svg_padding_size;
        const entity1Y = entity1Rect.top - textDivRect.top + svg_padding_size;
        const entity2X = entity2Lines > 2 ? entity2Rect.right - textDivRect.left + svg_padding_size : entity2Rect.left + entity2Rect.width / 2 - textDivRect.left + svg_padding_size;
        const entity2Y = entity2Rect.top - textDivRect.top + svg_padding_size;

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
        // If start and end entities are on the same y-axis
        if (startY === endY) {
            path.setAttribute("d", `M${startX} ${startY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${startY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`);
        }
        // If start entity is below end entities
        else if (startY > endY) {
            path.setAttribute("d", `M${startX} ${startY} L${startX} ${endY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${endY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`);
        }
        // If start entity is above end entities
        else {
            path.setAttribute("d", `M${startX} ${startY} a ${r} ${r} 0 0 1 ${r} -${r} L${endX - r} ${startY - r} a ${r} ${r} 0 0 1 ${r} ${r} L${endX} ${endY}`);
        }
        path.setAttribute("class", "relation-path");
        svgContainer.appendChild(path);
    });
}

// Global variables for relation lines
let relations = null;
let relationPathLevel = 5;
let svgPaddingSize = 20;

// This function wait until an element is rendered
const checkElement = async selector => {
    while ( document.getElementById(selector) === null) {
        await new Promise( resolve =>  requestAnimationFrame(resolve) )
    }
    return document.getElementById(selector);
};

updateEntities(data.text, data.entities);

if ('theme' in data) {
    if (data.theme === 'dark') {
        document.body.className = '';
        document.body.classList.add('dark-theme');
    }
}

if ('relations' in data) {
    relations = data.relations;
    alineDisplayRelation(svgPaddingSize);
    updateRelations(relations, relationPathLevel, svgPaddingSize);

    // Add event listener for the main page scroll
    window.addEventListener('scroll', () => {
        updateRelations(relations, relationPathLevel, svgPaddingSize);
    });

    // Add event listener for the main page resize
    window.addEventListener('resize', () => {
        updateRelations(relations, relationPathLevel, svgPaddingSize);
    });
}
