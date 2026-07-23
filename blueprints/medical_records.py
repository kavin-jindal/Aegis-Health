import os
from flask import Blueprint, request, jsonify
from db import supabase

medical_records_bp = Blueprint("medical_records", __name__)

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/dicom",
    "application/dicom",
}
MIME_MAP = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".dcm": "application/dicom",
    ".dicom": "application/dicom",
}
ALLOWED_EXTENSIONS = set(MIME_MAP.keys())
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@medical_records_bp.route("/api/records", methods=["GET"])
def list_records():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("medical_records")
            .select("*")
            .eq("family_member_id", family_member_id)
            .order("record_date", desc=True)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medical_records_bp.route("/api/records/<uuid:record_id>", methods=["GET"])
def get_record(record_id):
    try:
        result = (
            supabase.table("medical_records")
            .select("*")
            .eq("id", str(record_id))
            .single()
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Record not found"}), 404
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medical_records_bp.route("/api/records", methods=["POST"])
def create_record():
    file = request.files.get("file")
    family_member_id = request.form.get("family_member_id")
    title = request.form.get("title", "").strip()

    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    if not title:
        return jsonify({"error": "title is required"}), 400
    if not file or not file.filename:
        return jsonify({"error": "file is required"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"File type {ext} not allowed"}), 400

    content_type = MIME_MAP.get(ext, file.content_type or "application/octet-stream")

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_SIZE:
        return jsonify({"error": "File exceeds 10 MB limit"}), 400

    try:
        import uuid
        storage_path = f"{family_member_id}/{uuid.uuid4().hex}{ext}"
        supabase.storage.from_("medical-records").upload(
            storage_path, file.read(), {"content-type": content_type}
        )

        bucket_url = supabase.storage.from_("medical-records").get_public_url(storage_path)

        result = (
            supabase.table("medical_records")
            .insert(
                {
                    "family_member_id": family_member_id,
                    "title": title,
                    "file_url": bucket_url,
                    "record_type": request.form.get("record_type") or ext.lstrip("."),
                    "record_date": request.form.get("record_date") or None,
                    "hospital": request.form.get("hospital") or None,
                    "cost": float(request.form.get("cost")) if request.form.get("cost") else None,
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medical_records_bp.route("/api/records/<uuid:record_id>", methods=["PUT"])
def update_record(record_id):
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "title is required"}), 400
    try:
        result = (
            supabase.table("medical_records")
            .update(
                {
                    "title": data["title"],
                    "record_type": data.get("record_type"),
                    "record_date": data.get("record_date"),
                    "hospital": data.get("hospital"),
                    "cost": float(data["cost"]) if data.get("cost") else None,
                }
            )
            .eq("id", str(record_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Record not found"}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@medical_records_bp.route("/api/records/<uuid:record_id>", methods=["DELETE"])
def delete_record(record_id):
    try:
        existing = (
            supabase.table("medical_records")
            .select("file_url")
            .eq("id", str(record_id))
            .single()
            .execute()
        )
        if not existing.data:
            return jsonify({"error": "Record not found"}), 404

        file_url = existing.data.get("file_url", "")
        if "/storage/v1/object/public/medical-records/" in file_url:
            storage_path = file_url.split("/storage/v1/object/public/medical-records/", 1)[-1]
            try:
                supabase.storage.from_("medical-records").remove([storage_path])
            except Exception:
                pass

        result = (
            supabase.table("medical_records")
            .delete()
            .eq("id", str(record_id))
            .execute()
        )
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
