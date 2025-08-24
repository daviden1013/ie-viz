import os
import json
from typing import List, Dict, Iterable, Callable
from flask import Flask, render_template_string, url_for
from flask_socketio import SocketIO, emit
import re
import copy


""" Flask app """
app = Flask(__name__)
socketio = SocketIO(app)


def load_theme_colors(theme:str) -> List[Dict[str, str]]:
    """
    This function loads the color codes for the light and dark themes.
    The return is a list of dicts with "color_name" and "color_code" keys.
    """
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
    for i, attr in sorted(enumerate(unique_attr)):
        color_map[attr] = theme_colors[i % len(theme_colors)]["color_code"]
    return color_map
    

def render(text: str,
          entities: List[Dict[str, str]],
          relations: List[Dict[str, str]]=None,
          theme:str = "light",
          color_attr_key:str=None,
          color_map_func:Callable=None,
          title:str="Named Entity Visualization"
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
    theme : str, Optional
        The theme of the visualization. Must be either "light" or "dark".
    color_attr_key : str, Optional
        The attribute key to be used for coloring the entities.
    color_map_func : Callable, Optional
        The function to be used for mapping the entity attributes to colors. When provided, the color_attr_key and 
        theme will be overwritten. The function must take an entity dictionary as input and 
        return a color string (default color name or hex color code).
    title : str, Optional
        The title of the HTML.
    """
    # Check text type is str
    if not isinstance(text, str):
        raise TypeError("text must be a string.")
    
    # Check entities type is List[Dict[str, str]]
    if not isinstance(entities, Iterable):
        raise TypeError("entities must be a List or Iterable.")
    for entity in entities:
        if not isinstance(entity, Dict):
            raise TypeError("entities must be a list of dictionaries.")
        if not all(key in entity for key in ['entity_id', 'start', 'end']):
            raise ValueError("entity dictionary must have the keys 'entity_id', 'start', 'end'.")
        
    # Check entity_id is unique
    entity_ids = [entity['entity_id'] for entity in entities]
    if len(entity_ids) != len(set(entity_ids)):
        raise ValueError("entity_id must be unique.")

    # Check relations type is List[Dict[str, str]]
    if relations:
        if not isinstance(relations, Iterable):
            raise TypeError("relations must be a List or Iterable.")
        for relation in relations:
            if not isinstance(relation, Dict):
                raise TypeError("relations must be a list of dictionaries.")
            if not all(key in relation for key in ['entity_1_id', 'entity_2_id']):
                raise ValueError("relation dictionary must have the keys 'entity_1_id', 'entity_2_id'.")
            
    # Check theme is either "light" or "dark"
    if theme not in {'light', 'dark'}:
        raise ValueError("theme must be either 'light' or 'dark'.")
    
    # Assign entity colors
    # If color_map_func is provided, use it to assign colors hex code (str) to entities
    if color_map_func:
        # Check color_map_func is a callable
        if not callable(color_map_func):
            raise TypeError("color_map_func must be a callable.")
        
        entities = copy.deepcopy(entities)
        for entity in entities:
            color = color_map_func(entity)
            # Check color_map_func returns a string
            if not isinstance(color, str):
                raise TypeError("color_map_func must return a string.")
            
            # Check color_map_func returns a valid hex color code or one of the predefined colors
            hex_pattern = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            default_color_names = {c["color_name"]: c["color_code"] for c in load_theme_colors("light") + load_theme_colors("dark")}
            if color in default_color_names: 
                entity['color'] = default_color_names[color]
            elif bool(re.match(hex_pattern, color)):
                entity['color'] = color
            else:
                raise ValueError(f'color_map_func must return a string of default color name ({list(default_color_names.keys())})'\
                                 f' or a hex color code, received "{color}" instead.')
        
    # If color_attr_key is provided, use it to assign colors index (int) to entities
    elif color_attr_key:
        # Check color_attr_key is a string
        if not isinstance(color_attr_key, str):
            raise TypeError("color_attr_key must be a string.")
        
        # Check color_attr_key is in entity attributes
        entities = copy.deepcopy(entities)
        for entity in entities:
            if entity['attr'] is None:
                raise ValueError(f'entity["attr"] is None (entity_id: {entity["entity_id"]}).')

            if color_attr_key not in entity['attr']:
                raise ValueError(f'color_attr_key "{color_attr_key}" not found in an entity (entity_id: {entity["entity_id"]}).')
        
        # Get unique attribute values
        unique_attr = set([entity['attr'][color_attr_key] for entity in entities])
        
        # Apply color index to entities
        theme_colors = load_theme_colors(theme)
        attr_color_map = {attr: i % len(theme_colors) for i, attr in sorted(enumerate(unique_attr))}
        for entity in entities:
            entity['color'] = attr_color_map[entity['attr'][color_attr_key]]
            
    # If no color assignment is provided, leave entity["color"] as None and use CSS default colors

    # Read and embed the CSS and JS files directly into the HTML content.
    css_file_path = os.path.join(app.static_folder, 'style.css')

    with open(css_file_path, 'r') as css_file:
        css_content = css_file.read()
    
    js_files = [
        'DisplayTextBoxManager.js',
        'FilterManager.js',
        'TableManager.js',
        'App.js'
    ]
    
    js_content = []
    for js_file in js_files:
        file_path = os.path.join(app.static_folder, 'js', js_file)
        with open(file_path, 'r') as f:
            js_content.append(f.read())

    # Package data into JSON
    data = {
        'text': text,
        'entities': entities,
        'theme': theme,
        'light_theme_colors': load_theme_colors("light"),
        'dark_theme_colors': load_theme_colors("dark")
    }
    if relations:
        data['relations'] = relations

    data_json = json.dumps(data)

    # Render the HTML content
    html_content = f"""
    <html>
    <head>
        <title>{title}</title>
        <style>
        {css_content}
        </style>
    </head>
    <body>
        <div id="display-textbox-container">
            <div id="display-textbox"></div>
            <svg id="display-relation"></svg>
        </div>
        <script type="text/javascript">
            // Embed the data as JavaScript variables
            const data = {data_json};
            
            // Original JavaScript logic
            {chr(10).join(js_content)}

        </script>
    </body>
    </html>
    """
    return html_content


def serve(text: str,
          entities: List[Dict[str, str]],
          relations: List[Dict[str, str]]=None,
          theme:str = "light",
          color_attr_key:str=None,
          color_map_func:Callable=None,
          title:str="Named Entity Visualization",
          host:str="0.0.0.0",
          port:int=5000
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
    theme : str, Optional
        The theme of the visualization. Must be either "light" or "dark".
    color_attr_key : str, Optional
        The attribute key to be used for coloring the entities.
    color_map_func : Callable, Optional
        The function to be used for mapping the entity attributes to colors. When provided, the color_attr_key and 
        theme will be overwritten. The function must take an entity dictionary as input and return a color string (hex).
    title : str, Optional
        The title of the HTML.
    host : str, Optional
        The host address to run the server on.
    port : int, Optional
        The port number to run the server on.
    """
    # Check host is a string following the format of an IP address
    if not isinstance(host, str):
        raise TypeError("host must be a string.")
    if not all(part.isdigit() and 0 <= int(part) <= 255 for part in host.split('.')):
        if host != "localhost":
            raise ValueError("host must be a valid IP address.")

    # Check port is an integer
    if not isinstance(port, int):
        raise TypeError("port must be an integer.")
    
    # Check port is within the valid range
    if not 0 <= port <= 65535:
        raise ValueError("port must be between 0 and 65535.")
    
    # Check port is not in use
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex((host, port)) == 0:
            raise ValueError(f"port {port} is already in use.")

   # Remove the existing route if defined
    if 'render_page' in app.view_functions:
        app.view_functions.pop('render_page')

    html = render(text=text, 
                    entities=entities, 
                    relations=relations, 
                    theme=theme,
                    color_attr_key=color_attr_key,
                    color_map_func=color_map_func,
                    title=title)

    # Render page
    @app.route('/')
    def render_page():
        return html

    # Run the Flask app with SocketIO
    socketio.run(app, host=host, port=port, allow_unsafe_werkzeug=True)
