from flask import Blueprint, request, jsonify
from db import supabase

medicines_bp = Blueprint("medicines", __name__)


@medicines_bp.route("/api/medicines", methods=["GET"])
def list_medicines():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("medicines")
            .select("*, doctors(name)")
            .eq("family_member_id", family_member_id)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medicines_bp.route("/api/medicines/<uuid:medicine_id>", methods=["GET"])
def get_medicine(medicine_id):
    try:
        result = (
            supabase.table("medicines")
            .select("*, doctors(name)")
            .eq("id", str(medicine_id))
            .single()
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Medicine not found"}), 404
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medicines_bp.route("/api/medicines", methods=["POST"])
def create_medicine():
    data = request.get_json(silent=True) or {}
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    try:
        result = (
            supabase.table("medicines")
            .insert(
                {
                    "family_member_id": data["family_member_id"],
                    "doctor_id": data.get("doctor_id"),
                    "name": data["name"],
                    "dosage": data.get("dosage"),
                    "frequency": data.get("frequency"),
                    "start_date": data.get("start_date"),
                    "end_date": data.get("end_date"),
                    "reminder_times": data.get("reminder_times"),
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medicines_bp.route("/api/medicines/<uuid:medicine_id>", methods=["PUT"])
def update_medicine(medicine_id):
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    try:
        result = (
            supabase.table("medicines")
            .update(
                {
                    "doctor_id": data.get("doctor_id"),
                    "name": data["name"],
                    "dosage": data.get("dosage"),
                    "frequency": data.get("frequency"),
                    "start_date": data.get("start_date"),
                    "end_date": data.get("end_date"),
                    "reminder_times": data.get("reminder_times"),
                }
            )
            .eq("id", str(medicine_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Medicine not found"}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medicines_bp.route("/api/medicines/<uuid:medicine_id>", methods=["DELETE"])
def delete_medicine(medicine_id):
    try:
        result = (
            supabase.table("medicines")
            .delete()
            .eq("id", str(medicine_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Medicine not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
