class TableManager {
    constructor(light_theme_colors, dark_theme_colors, onEntityClick) {
        this.light_theme_colors = light_theme_colors;
        this.dark_theme_colors = dark_theme_colors;
        this.entityTable = null;
        this.relationTable = null;
        this.onEntityClick = onEntityClick;
    }

    createTablePanel(text, entities, relations, currentTheme) {
        const panel = document.createElement('div');
        panel.className = 'table-panel';

        const closeButton = document.createElement('button');
        closeButton.className = 'table-close-button';
        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        closeButton.addEventListener('click', () => {
            panel.classList.remove('open');
            document.getElementById('display-textbox-container').classList.remove('with-table');
        });
        panel.appendChild(closeButton);
        
        const content = document.createElement('div');
        
        const entitySection = document.createElement('div');
        entitySection.className = 'table-section';
        entitySection.innerHTML = '<h2>Entities</h2>';
        const entityTable = document.createElement('table');
        entitySection.appendChild(entityTable);
        content.appendChild(entitySection);
        this.entityTable = entityTable;
        this.updateEntityTable(text, entities, currentTheme);

        if (data.relations) {
            const relationSection = document.createElement('div');
            relationSection.className = 'table-section';
            relationSection.innerHTML = '<h2>Relations</h2>';
            const relationTable = document.createElement('table');
            relationSection.appendChild(relationTable);
            content.appendChild(relationSection);
            this.relationTable = relationTable;
            this.updateRelationTable(text, entities, relations, currentTheme);
        }

        panel.appendChild(content);
        return panel;
    }

    updateEntityTable(text, entities, currentTheme) {
        if (!this.entityTable) return;
        this.entityTable.innerHTML = '';
        
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const attributeKeys = new Set();
        entities.forEach(entity => {
            if (entity.attr) {
                Object.keys(entity.attr).forEach(key => attributeKeys.add(key));
            }
        });
        const sortedAttributeKeys = Array.from(attributeKeys).sort();

        const headerRow = document.createElement('tr');
        ['ID', 'Text', ...sortedAttributeKeys].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        entities.forEach(entity => {
            const row = document.createElement('tr');
            
            const idCell = document.createElement('td');
            idCell.textContent = entity.entity_id;
            row.appendChild(idCell);
            
            const textCell = document.createElement('td');
            const entityMark = document.createElement('mark');
            entityMark.className = 'entity-table-mark';
            entityMark.setAttribute('entity-id', entity.entity_id);
            entityMark.textContent = text.substring(entity.start, entity.end);
            entityMark.addEventListener('mouseenter', () => this.handleEntityHighlight(entity.entity_id, true));
            entityMark.addEventListener('mouseleave', () => this.handleEntityHighlight(entity.entity_id, false));
            entityMark.addEventListener('click', () => this.onEntityClick(entity.entity_id));
            
            if (entity.color !== undefined) {
                entityMark.style.background = 'none';
                if (typeof entity.color === 'string') {
                    entityMark.style.backgroundColor = entity.color;
                } else if (typeof entity.color === 'number') {
                    entityMark.style.backgroundColor = currentTheme === 'light' ? 
                        this.light_theme_colors[entity.color]["color_code"] : 
                        this.dark_theme_colors[entity.color]["color_code"];
                }
            }

            textCell.appendChild(entityMark);
            row.appendChild(textCell);
            
            sortedAttributeKeys.forEach(attrKey => {
                const attrCell = document.createElement('td');
                if (entity.attr && entity.attr[attrKey] !== undefined) {
                    // if the attribute is an object, display it as a JSON string
                    let rawAtrributes = entity.attr[attrKey];
                    const prettyAttributes = (typeof rawAtrributes === 'object') 
                        ? JSON.stringify(rawAtrributes, null, 2) 
                        : rawAtrributes;
                    attrCell.textContent = prettyAttributes;
                } else {
                    attrCell.textContent = '-';
                    attrCell.style.color = 'rgba(128, 128, 128, 0.5)';
                }
                row.appendChild(attrCell);
            });

            tbody.appendChild(row);
        });

        this.entityTable.appendChild(thead);
        this.entityTable.appendChild(tbody);
    }

    updateRelationTable(text, entities, relations, currentTheme) {
        if (!this.relationTable) return;
        this.relationTable.innerHTML = '';
        
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        ['Entity 1 ID', 'Entity 1', 'Entity 2 ID', 'Entity 2'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        relations.forEach(relation => {
            const row = document.createElement('tr');
            
            const entity1IdCell = document.createElement('td');
            entity1IdCell.textContent = relation.entity_1_id;
            row.appendChild(entity1IdCell);

            const entity1Cell = document.createElement('td');
            const entity1 = entities.find(e => e.entity_id === relation.entity_1_id);
            if (entity1) {
                const entityMark1 = document.createElement('mark');
                entityMark1.className = 'entity-table-mark';
                entityMark1.setAttribute('entity-id', entity1.entity_id);
                entityMark1.textContent = text.substring(entity1.start, entity1.end);
                entityMark1.addEventListener('mouseenter', () => this.handleEntityHighlight(entity1.entity_id, true));
                entityMark1.addEventListener('mouseleave', () => this.handleEntityHighlight(entity1.entity_id, false));
                entityMark1.addEventListener('click', () => this.onEntityClick(entity1.entity_id));
                
                if (entity1.color !== undefined) {
                    entityMark1.style.background = 'none';
                    entityMark1.style.backgroundColor = typeof entity1.color === 'string' ? 
                        entity1.color : 
                        (currentTheme === 'light' ? 
                            this.light_theme_colors[entity1.color]["color_code"] : 
                            this.dark_theme_colors[entity1.color]["color_code"]);
                }
                entity1Cell.appendChild(entityMark1);
            } else {
                entity1Cell.textContent = relation.entity_1_id;
            }
            row.appendChild(entity1Cell);
            
            const entity2IdCell = document.createElement('td');
            entity2IdCell.textContent = relation.entity_2_id;
            row.appendChild(entity2IdCell);

            const entity2Cell = document.createElement('td');
            const entity2 = entities.find(e => e.entity_id === relation.entity_2_id);
            if (entity2) {
                const entityMark2 = document.createElement('mark');
                entityMark2.className = 'entity-table-mark';
                entityMark2.setAttribute('entity-id', entity2.entity_id);
                entityMark2.textContent = text.substring(entity2.start, entity2.end);
                entityMark2.addEventListener('mouseenter', () => this.handleEntityHighlight(entity2.entity_id, true));
                entityMark2.addEventListener('mouseleave', () => this.handleEntityHighlight(entity2.entity_id, false));
                entityMark2.addEventListener('click', () => this.onEntityClick(entity2.entity_id));
                
                if (entity2.color !== undefined) {
                    entityMark2.style.background = 'none';
                    entityMark2.style.backgroundColor = typeof entity2.color === 'string' ? 
                        entity2.color : 
                        (currentTheme === 'light' ? 
                            this.light_theme_colors[entity2.color]["color_code"] : 
                            this.dark_theme_colors[entity2.color]["color_code"]);
                }
                entity2Cell.appendChild(entityMark2);
            } else {
                entity2Cell.textContent = relation.entity_2_id;
            }
            row.appendChild(entity2Cell);
            
            tbody.appendChild(row);
        });

        this.relationTable.appendChild(thead);
        this.relationTable.appendChild(tbody);
    }

    handleEntityHighlight(entityId, isEnter) {
        const textEntities = document.querySelectorAll(`mark[entity-id="${entityId}"]`);
        textEntities.forEach(entity => {
            if (isEnter) {
                entity.classList.add('entity-highlight');
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
}