import json
from flask import Blueprint, request, jsonify
from db import supabase

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/api/settings", methods=["GET"])
def get_settings():
    try:
        result = supabase.table("admin_settings").select("*").limit(1).execute()
        if result.data:
            return jsonify(result.data[0]), 200
        return jsonify({}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.get_json(silent=True) or {}
    try:
        existing = supabase.table("admin_settings").select("id").limit(1).execute()
        payload = {
            "admin_name": data.get("admin_name"),
            "admin_email": data.get("admin_email"),
            "family_name": data.get("family_name"),
        }
        if existing.data:
            sid = existing.data[0]["id"]
            result = (
                supabase.table("admin_settings")
                .update(payload)
                .eq("id", sid)
                .execute()
            )
        else:
            result = (
                supabase.table("admin_settings")
                .insert(payload)
                .execute()
            )
        return jsonify(result.data[0] if result.data else payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/api/settings/family", methods=["GET"])
def list_family():
    try:
        result = (
            supabase.table("family_members")
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/api/settings/family", methods=["POST"])
def add_family():
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


@settings_bp.route("/api/settings/family/<member_id>", methods=["DELETE"])
def remove_family(member_id):
    try:
        supabase.table("family_members").delete().eq("id", member_id).execute()
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
