from flask import Blueprint, request, jsonify
from db import supabase

fitness_bp = Blueprint("fitness", __name__)


@fitness_bp.route("/api/fitness", methods=["GET"])
def list_fitness_logs():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("fitness_logs")
            .select("*")
            .eq("family_member_id", family_member_id)
            .order("log_date", desc=True)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@fitness_bp.route("/api/fitness/<uuid:log_id>", methods=["GET"])
def get_fitness_log(log_id):
    try:
        result = (
            supabase.table("fitness_logs")
            .select("*")
            .eq("id", str(log_id))
            .single()
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Log not found"}), 404
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@fitness_bp.route("/api/fitness", methods=["POST"])
def create_fitness_log():
    data = request.get_json(silent=True) or {}
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    if not data.get("log_date"):
        return jsonify({"error": "log_date is required"}), 400
    try:
        existing = (
            supabase.table("fitness_logs")
            .select("id")
            .eq("family_member_id", data["family_member_id"])
            .eq("log_date", data["log_date"])
            .maybe_single()
            .execute()
        )
        payload = {
            "family_member_id": data["family_member_id"],
            "log_date": data["log_date"],
            "steps": data.get("steps"),
            "calories": data.get("calories"),
            "water_ml": data.get("water_ml"),
            "sleep_hours": data.get("sleep_hours"),
        }
        if existing and existing.data:
            result = (
                supabase.table("fitness_logs")
                .update(payload)
                .eq("id", existing.data["id"])
                .execute()
            )
        else:
            result = (
                supabase.table("fitness_logs")
                .insert(payload)
                .execute()
            )
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@fitness_bp.route("/api/fitness/<uuid:log_id>", methods=["DELETE"])
def delete_fitness_log(log_id):
    try:
        result = (
            supabase.table("fitness_logs")
            .delete()
            .eq("id", str(log_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Log not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
