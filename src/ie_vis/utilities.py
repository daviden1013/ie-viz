import os
import json
from typing import List, Dict, Iterable, Callable
from flask import Flask, render_template_string, url_for
from flask_socketio import SocketIO, emit
import re

""" Flask app """
app = Flask(__name__)
socketio = SocketIO(app)

@socketio.on('connect')
def handle_connect():
    data = {
        'text': app.config['text'],
        'entities': app.config['entities'],
        'theme': app.config['theme']
    }
    if 'relations' in app.config:
        data['relations'] = app.config['relations']

    emit('receive_text', data)


@app.route('/')
def render():
    """
    Generates the HTML content for the Named Entity Visualization.

    Returns:
    --------
    str
        The HTML content as a string.
    """
    html_content = f"""
    <html>
    <head>
        <title>Named Entity Visualization</title>
        <link rel="stylesheet" type="text/css" href="{url_for('static', filename='style.css')}">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
        <script type="text/javascript" charset="utf-8" src="{url_for('static', filename='script.js')}"></script>
    </head>
    <body>
        <div id="display-textbox-container">
            <div id="display-textbox"></div>
            <svg id="display-relation"></svg>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_content)


def load_theme_colors(theme):
    with open(os.path.join(app.static_folder, 'color_code.json'), 'r') as f:
        data = json.load(f)
    if theme == 'light':
        return data['light_theme_colors']
    if theme == 'dark':
        return data['dark_theme_colors']
        

def get_attr_color_map(unique_attr:List, theme_colors:List[str]) -> Dict[str, str]:
    """
    This function generates a color map between an attribute level and a color code.

    Parameters:
    -----------
    attr : List
        The unique levels of an attribute.
    theme_colors : List[str]
        The list of color codes to be used for the attributes.

    Returns:
    --------
    Dict[str, str]
        The color map for the attributes of the entity.
    """
    color_map = {}
    for i, attr in enumerate(unique_attr):
        color_map[attr] = theme_colors[i % len(theme_colors)]
    return color_map
    

def serve(text: str,
          entities: List[Dict[str, str]],
          relations: List[Dict[str, str]]=None,
          host: str = '0.0.0.0', 
          port: int = 3000,
          theme:str = "light",
          color_attr_key:str=None,
          color_map_func:Callable=None
          ):
    """
    This function serves the information extracton visualization App.

    Parameters:
    -----------
    text : str
        The text content to be displayed.
    entities : List[Dict[str, str]]
        The list of entities to be displayed. Must be a list of dictionaries with the following keys:
            - entity_id: str
            - start: int
            - end: int
            - attr: Dict[str, str], Optional
                The attributes of the entity. 
    relations : List[Dict[str, str]], Optional
        The list of relations to be displayed. Must be a list of dictionaries with the following keys:
            - entity_1_id: str
            - entity_2_id: str
    host : str, Optional
        The host IP address to serve the app.
    port : int, Optional
        The port number to serve the app.
    theme : str, Optional
        The theme of the visualization. Must be either "light" or "dark".
    color_attr_key : str, Optional
        The attribute key to be used for coloring the entities.
    color_map_func : Callable, Optional
        The function to be used for mapping the entity attributes to colors. When provided, the color_attr_key and 
        theme will be overwritten. The function must take an entity dictionary as input and return a color string (hex).
    """
    # Check text type is str
    if not isinstance(text, str):
        raise TypeError("text must be a string.")
    
    # Check entities type is List[Dict[str, str]]
    if not isinstance(entities, Iterable):
        raise TypeError("entities must be an List or Iterable.")
    for entity in entities:
        if not isinstance(entity, Dict):
            raise TypeError("entities must be a list of dictionaries.")
        if not all(key in entity for key in ['entity_id', 'start', 'end']):
            raise ValueError("entities must have the keys 'entity_id', 'start', 'end'.")

    # Check relations type is List[Dict[str, str]]
    if relations:
        if not isinstance(relations, Iterable):
            raise TypeError("relations must be an List or Iterable.")
        for relation in relations:
            if not isinstance(relation, Dict):
                raise TypeError("relations must be a list of dictionaries.")
            if not all(key in relation for key in ['entity_1_id', 'entity_2_id']):
                raise ValueError("relations must have the keys 'entity_1_id', 'entity_2_id'.")
            
    # Check theme is either "light" or "dark"
    if theme not in {'light', 'dark'}:
        raise ValueError("theme must be either 'light' or 'dark'.")
                         
    # Check host is a string following the format of an IP address
    if not isinstance(host, str):
        raise TypeError("host must be a string.")
    if not all(part.isdigit() and 0 <= int(part) <= 255 for part in host.split('.')):
        raise ValueError("host must be a valid IP address.")

    # Check port is an integer
    if not isinstance(port, int):
        raise TypeError("port must be an integer.")
    
    # Assign eneity colors
    if color_map_func:
        # Check color_map_func is a callable
        if not callable(color_map_func):
            raise TypeError("color_map_func must be a callable.")
        
        for entity in entities:
            hex_color = color_map_func(entity)
            # Check color_map_func returns a string for hex color code
            if not isinstance(hex_color, str):
                raise TypeError("color_map_func must return a string.")
            
            hex_pattern = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            if not bool(re.match(hex_pattern, hex_color)):
                raise ValueError(f"color_map_func must return a string for hex color code, received {hex_color} instead.")
            
            entity['color'] = hex_color

    elif color_attr_key:
        # Check color_attr_key is a string
        if not isinstance(color_attr_key, str):
            raise TypeError("color_attr_key must be a string.")
        
        # Check color_attr_key is in entity attributes
        for entity in entities:
            if color_attr_key not in entity['attr']:
                raise ValueError(f"color_attr_key {color_attr_key} not found in entity attributes.")
        
        # Get unique attribute values
        theme_colors = load_theme_colors(theme)
        unique_attr = set([entity['attr'][color_attr_key] for entity in entities])
        attr_color_map = get_attr_color_map(unique_attr, theme_colors)

        # Apply colors to entities
        for entity in entities:
            entity['color'] = attr_color_map[entity['attr'][color_attr_key]]


    # Set app configuration
    app.config['text'] = text
    app.config['entities'] = entities
    app.config['theme'] = theme
    if relations:
        app.config['relations'] = relations

    # Run the app
    socketio.run(app, host=host, port=port, allow_unsafe_werkzeug=True)

