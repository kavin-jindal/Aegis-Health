from flask import Blueprint, request, jsonify
from db import supabase

doctors_bp = Blueprint("doctors", __name__)


@doctors_bp.route("/api/doctors", methods=["GET"])
def list_doctors():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("doctors")
            .select("*")
            .eq("family_member_id", family_member_id)
            .order("name")
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctors_bp.route("/api/doctors/<uuid:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    try:
        result = (
            supabase.table("doctors")
            .select("*")
            .eq("id", str(doctor_id))
            .single()
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Doctor not found"}), 404
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctors_bp.route("/api/doctors", methods=["POST"])
def create_doctor():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("doctors")
            .insert(
                {
                    "family_member_id": data["family_member_id"],
                    "name": data["name"],
                    "specialty": data.get("specialty"),
                    "phone": data.get("phone"),
                    "clinic": data.get("clinic"),
                    "notes": data.get("notes"),
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctors_bp.route("/api/doctors/<uuid:doctor_id>", methods=["PUT"])
def update_doctor(doctor_id):
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    try:
        result = (
            supabase.table("doctors")
            .update(
                {
                    "name": data["name"],
                    "specialty": data.get("specialty"),
                    "phone": data.get("phone"),
                    "clinic": data.get("clinic"),
                    "notes": data.get("notes"),
                }
            )
            .eq("id", str(doctor_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Doctor not found"}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctors_bp.route("/api/doctors/<uuid:doctor_id>", methods=["DELETE"])
def delete_doctor(doctor_id):
    try:
        result = (
            supabase.table("doctors")
            .delete()
            .eq("id", str(doctor_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Doctor not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
