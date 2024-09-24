import importlib.resources
from flask import Flask, render_template_string
from flask_socketio import SocketIO, emit

""" Load static files """
js_file_path = importlib.resources.files('ie_vis.asset').joinpath("script.js")
with open(js_file_path, 'r') as f:
    js = f.read()

css_file_path = importlib.resources.files('ie_vis.asset').joinpath("style.css")
with open(css_file_path, 'r') as f:
    css = f.read()

""" Flask app """
app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    html_content = f"""
    <html>
    <head>
        <title>Named Entity Visualization</title>
        <style>
            {css}
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
        <script type="text/javascript" charset="utf-8">
            {js}
        </script>
    </head>
    <body>
        <h1>Named Entity Visualization</h1>
        <div id="display-textbox-container">
            <div id="display-textbox"></div>
            <svg id="display-relation"></svg>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_content)


@socketio.on('request_text')
def handle_request_text():
    text = "a" + "\n" + "Barack Obama was born in Hawaii."
    entities = [
        {"frame_id": "1", "start": "2", "end": "14", "entity_text": "Barack Obama", "color": "#1f77b4"},
        {"frame_id": "2", "start": "27", "end": "33", "entity_text": "Hawaii", "color": "#ff7f0e"}
    ]
    relations = [
        {"entity_1_id": "1", "entity_2_id": "2"}
    ]

    emit('receive_text', {'text': text, 'entities': entities, 'relations': relations})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=3000)
