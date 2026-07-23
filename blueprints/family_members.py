from flask import Blueprint, request, jsonify
from db import supabase

family_members_bp = Blueprint("family_members", __name__)


@family_members_bp.route("/api/family_members", methods=["GET"])
def list_family_members():
    try:
        result = supabase.table("family_members").select("*").order("name").execute()
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@family_members_bp.route("/api/family_members", methods=["POST"])
def add_family_member():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    relation = (data.get("relation") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    if not relation:
        return jsonify({"error": "relation is required"}), 400
    try:
        result = (
            supabase.table("family_members")
            .insert({"name": name, "relation": relation})
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@family_members_bp.route("/api/family_members/<member_id>", methods=["DELETE"])
def delete_family_member(member_id):
    try:
        supabase.table("family_members").delete().eq("id", member_id).execute()
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
