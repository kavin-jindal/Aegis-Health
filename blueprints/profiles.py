import os
import uuid
from flask import Blueprint, request, jsonify
from db import supabase

profiles_bp = Blueprint("profiles", __name__)

PHOTO_MAX = 5 * 1024 * 1024
PHOTO_ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}
PHOTO_MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
BUCKET = "profile-photos"


@profiles_bp.route("/api/profiles/<family_member_id>", methods=["GET"])
def get_profile(family_member_id):
    try:
        result = (
            supabase.table("member_profiles")
            .select("*")
            .eq("family_member_id", family_member_id)
            .execute()
        )
        if result.data:
            return jsonify(result.data[0]), 200
        return jsonify(None), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profiles_bp.route("/api/profiles", methods=["POST"])
def upsert_profile():
    data = request.get_json(silent=True) or {}
    family_member_id = data.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        existing = (
            supabase.table("member_profiles")
            .select("id")
            .eq("family_member_id", family_member_id)
            .execute()
        )
        payload = {
            "family_member_id": family_member_id,
            "full_name": data.get("full_name"),
            "relation": data.get("relation"),
            "date_of_birth": data.get("date_of_birth"),
            "gender": data.get("gender"),
            "location": data.get("location"),
            "blood_group": data.get("blood_group"),
        }
        if existing.data:
            profile_id = existing.data[0]["id"]
            result = (
                supabase.table("member_profiles")
                .update(payload)
                .eq("id", profile_id)
                .execute()
            )
        else:
            result = (
                supabase.table("member_profiles")
                .insert(payload)
                .execute()
            )
        return jsonify(result.data[0] if result.data else payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profiles_bp.route("/api/profiles/<family_member_id>/photo", methods=["POST"])
def upload_photo(family_member_id):
    file = request.files.get("photo")
    if not file or not file.filename:
        return jsonify({"error": "photo file is required"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in PHOTO_ALLOWED:
        return jsonify({"error": f"File type {ext} not allowed. Use JPG, PNG, or WebP."}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > PHOTO_MAX:
        return jsonify({"error": "File exceeds 5 MB limit"}), 400

    content_type = PHOTO_MIME.get(ext, "image/jpeg")
    storage_path = f"{family_member_id}/{uuid.uuid4().hex}{ext}"

    try:
        supabase.storage.from_(BUCKET).upload(
            storage_path, file.read(), {"content-type": content_type}
        )
        public_url = supabase.storage.from_(BUCKET).get_public_url(storage_path)

        existing = (
            supabase.table("member_profiles")
            .select("id, profile_photo_url")
            .eq("family_member_id", family_member_id)
            .execute()
        )

        if existing.data:
            old_url = existing.data[0].get("profile_photo_url", "")
            if old_url and "/storage/v1/object/public/" + BUCKET + "/" in old_url:
                old_path = old_url.split("/storage/v1/object/public/" + BUCKET + "/", 1)[-1]
                try:
                    supabase.storage.from_(BUCKET).remove([old_path])
                except Exception:
                    pass
            supabase.table("member_profiles").update(
                {"profile_photo_url": public_url}
            ).eq("family_member_id", family_member_id).execute()
        else:
            supabase.table("member_profiles").insert(
                {"family_member_id": family_member_id, "profile_photo_url": public_url}
            ).execute()

        return jsonify({"profile_photo_url": public_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profiles_bp.route("/api/profiles/<family_member_id>/photo", methods=["DELETE"])
def delete_photo(family_member_id):
    try:
        existing = (
            supabase.table("member_profiles")
            .select("profile_photo_url")
            .eq("family_member_id", family_member_id)
            .execute()
        )
        if not existing.data or not existing.data[0].get("profile_photo_url"):
            return jsonify({"message": "No photo to delete"}), 200

        old_url = existing.data[0]["profile_photo_url"]
        if "/storage/v1/object/public/" + BUCKET + "/" in old_url:
            old_path = old_url.split("/storage/v1/object/public/" + BUCKET + "/", 1)[-1]
            try:
                supabase.storage.from_(BUCKET).remove([old_path])
            except Exception:
                pass

        supabase.table("member_profiles").update(
            {"profile_photo_url": None}
        ).eq("family_member_id", family_member_id).execute()

        return jsonify({"message": "Photo deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profiles_bp.route("/api/profiles/<family_member_id>", methods=["DELETE"])
def delete_profile(family_member_id):
    try:
        existing = (
            supabase.table("member_profiles")
            .select("profile_photo_url")
            .eq("family_member_id", family_member_id)
            .execute()
        )
        if existing.data and existing.data[0].get("profile_photo_url"):
            url = existing.data[0]["profile_photo_url"]
            if "/storage/v1/object/public/" + BUCKET + "/" in url:
                path = url.split("/storage/v1/object/public/" + BUCKET + "/", 1)[-1]
                try:
                    supabase.storage.from_(BUCKET).remove([path])
                except Exception:
                    pass

        supabase.table("member_profiles").delete().eq("family_member_id", family_member_id).execute()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
