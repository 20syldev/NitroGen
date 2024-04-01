from flask import Flask, render_template, abort

app = Flask(__name__, template_folder="src", static_folder="src")

@app.route('/')
def index():
    return render_template('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 404

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)