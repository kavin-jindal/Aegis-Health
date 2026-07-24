import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv
from db import supabase

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="/static")

    from blueprints.family_members import family_members_bp
    from blueprints.doctors import doctors_bp
    from blueprints.checkups import checkups_bp
    from blueprints.medicines import medicines_bp
    from blueprints.medical_records import medical_records_bp
    from blueprints.fitness import fitness_bp
    from blueprints.emergency import emergency_bp
    from blueprints.prices import prices_bp
    from blueprints.assistant import assistant_bp
    from blueprints.profiles import profiles_bp
    from blueprints.settings import settings_bp

    app.register_blueprint(family_members_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(checkups_bp)
    app.register_blueprint(medicines_bp)
    app.register_blueprint(medical_records_bp)
    app.register_blueprint(fitness_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(prices_bp)
    app.register_blueprint(assistant_bp)
    app.register_blueprint(profiles_bp)
    app.register_blueprint(settings_bp)

    @app.route("/")
    def index():
        return send_from_directory(".", "index.html")

    @app.route("/css/<path:filename>")
    def serve_css(filename):
        return send_from_directory("css", filename)

    @app.route("/js/<path:filename>")
    def serve_js(filename):
        return send_from_directory("js", filename)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
