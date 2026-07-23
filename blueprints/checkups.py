import os
import uuid
from flask import Blueprint, request, jsonify
from db import supabase

checkups_bp = Blueprint("checkups", __name__)

DOC_MAX = 10 * 1024 * 1024
DOC_ALLOWED = {".pdf", ".jpg", ".jpeg", ".png", ".dcm", ".dicom"}
DOC_MIME = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".dcm": "application/dicom",
    ".dicom": "application/dicom",
}
DOC_BUCKET = "checkup-documents"


@checkups_bp.route("/api/checkups", methods=["GET"])
def list_checkups():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        # Query checkups and join doctors
        result = (
            supabase.table("checkups")
            .select("*, doctors(name)")
            .eq("family_member_id", family_member_id)
            .order("checkup_date", desc=True)
            .execute()
        )
        checkups = result.data or []

        # Gracefully query checkup_documents and checkup_payments if tables exist
        checkup_ids = [c["id"] for c in checkups]
        documents_by_checkup = {}
        payments_by_checkup = {}

        if checkup_ids:
            try:
                docs_res = (
                    supabase.table("checkup_documents")
                    .select("*")
                    .in_("checkup_id", checkup_ids)
                    .execute()
                )
                for doc in docs_res.data or []:
                    documents_by_checkup.setdefault(doc["checkup_id"], []).append(doc)
            except Exception:
                pass

            try:
                pays_res = (
                    supabase.table("checkup_payments")
                    .select("*")
                    .in_("checkup_id", checkup_ids)
                    .execute()
                )
                for pay in pays_res.data or []:
                    payments_by_checkup.setdefault(pay["checkup_id"], []).append(pay)
            except Exception:
                pass

        for c in checkups:
            c["checkup_documents"] = documents_by_checkup.get(c["id"], [])
            c["checkup_payments"] = payments_by_checkup.get(c["id"], [])

        return jsonify(checkups), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>", methods=["GET"])
def get_checkup(checkup_id):
    try:
        result = (
            supabase.table("checkups")
            .select("*, doctors(name)")
            .eq("id", str(checkup_id))
            .single()
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Checkup not found"}), 404

        checkup = result.data
        checkup["checkup_documents"] = []
        checkup["checkup_payments"] = []

        try:
            docs_res = (
                supabase.table("checkup_documents")
                .select("*")
                .eq("checkup_id", str(checkup_id))
                .execute()
            )
            checkup["checkup_documents"] = docs_res.data or []
        except Exception:
            pass

        try:
            pays_res = (
                supabase.table("checkup_payments")
                .select("*")
                .eq("checkup_id", str(checkup_id))
                .execute()
            )
            checkup["checkup_payments"] = pays_res.data or []
        except Exception:
            pass

        return jsonify(checkup), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups", methods=["POST"])
def create_checkup():
    data = request.get_json(silent=True) or {}
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    if not data.get("checkup_date"):
        return jsonify({"error": "checkup_date is required"}), 400
    try:
        result = (
            supabase.table("checkups")
            .insert(
                {
                    "family_member_id": data["family_member_id"],
                    "doctor_id": data.get("doctor_id"),
                    "checkup_date": data["checkup_date"],
                    "diagnosis": data.get("diagnosis"),
                    "notes": data.get("notes"),
                    "follow_up_date": data.get("follow_up_date"),
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>", methods=["PUT"])
def update_checkup(checkup_id):
    data = request.get_json(silent=True) or {}
    if not data.get("checkup_date"):
        return jsonify({"error": "checkup_date is required"}), 400
    try:
        result = (
            supabase.table("checkups")
            .update(
                {
                    "doctor_id": data.get("doctor_id"),
                    "checkup_date": data["checkup_date"],
                    "diagnosis": data.get("diagnosis"),
                    "notes": data.get("notes"),
                    "follow_up_date": data.get("follow_up_date"),
                }
            )
            .eq("id", str(checkup_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Checkup not found"}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>", methods=["DELETE"])
def delete_checkup(checkup_id):
    try:
        try:
            docs = (
                supabase.table("checkup_documents")
                .select("file_url")
                .eq("checkup_id", str(checkup_id))
                .execute()
            )
            for d in docs.data or []:
                url = d.get("file_url", "")
                if "/storage/v1/object/public/" + DOC_BUCKET + "/" in url:
                    path = url.split("/storage/v1/object/public/" + DOC_BUCKET + "/", 1)[-1]
                    try:
                        supabase.storage.from_(DOC_BUCKET).remove([path])
                    except Exception:
                        pass
            supabase.table("checkup_documents").delete().eq("checkup_id", str(checkup_id)).execute()
        except Exception:
            pass

        try:
            supabase.table("checkup_payments").delete().eq("checkup_id", str(checkup_id)).execute()
        except Exception:
            pass

        result = (
            supabase.table("checkups")
            .delete()
            .eq("id", str(checkup_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Checkup not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>/documents", methods=["GET"])
def list_checkup_documents(checkup_id):
    try:
        result = (
            supabase.table("checkup_documents")
            .select("*")
            .eq("checkup_id", str(checkup_id))
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>/documents", methods=["POST"])
def upload_checkup_document(checkup_id):
    file = request.files.get("file")
    family_member_id = request.form.get("family_member_id")
    title = request.form.get("title", "").strip()

    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    if not file or not file.filename:
        return jsonify({"error": "file is required"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in DOC_ALLOWED:
        return jsonify({"error": f"File type {ext} not allowed"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > DOC_MAX:
        return jsonify({"error": "File exceeds 10 MB limit"}), 400

    content_type = DOC_MIME.get(ext, "application/octet-stream")
    storage_path = f"{family_member_id}/{uuid.uuid4().hex}{ext}"

    try:
        supabase.storage.from_(DOC_BUCKET).upload(
            storage_path, file.read(), {"content-type": content_type}
        )
        public_url = supabase.storage.from_(DOC_BUCKET).get_public_url(storage_path)

        result = (
            supabase.table("checkup_documents")
            .insert(
                {
                    "checkup_id": str(checkup_id),
                    "family_member_id": family_member_id,
                    "title": title or file.filename,
                    "file_url": public_url,
                    "file_type": ext.lstrip("."),
                    "file_size": size,
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/documents/<uuid:doc_id>", methods=["DELETE"])
def delete_checkup_document(doc_id):
    try:
        existing = (
            supabase.table("checkup_documents")
            .select("file_url")
            .eq("id", str(doc_id))
            .single()
            .execute()
        )
        if not existing.data:
            return jsonify({"error": "Document not found"}), 404

        file_url = existing.data.get("file_url", "")
        if "/storage/v1/object/public/" + DOC_BUCKET + "/" in file_url:
            path = file_url.split("/storage/v1/object/public/" + DOC_BUCKET + "/", 1)[-1]
            try:
                supabase.storage.from_(DOC_BUCKET).remove([path])
            except Exception:
                pass

        supabase.table("checkup_documents").delete().eq("id", str(doc_id)).execute()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>/payments", methods=["GET"])
def list_checkup_payments(checkup_id):
    try:
        result = (
            supabase.table("checkup_payments")
            .select("*")
            .eq("checkup_id", str(checkup_id))
            .order("payment_date", desc=True)
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/<uuid:checkup_id>/payments", methods=["POST"])
def create_checkup_payment(checkup_id):
    data = request.get_json(silent=True) or {}
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    if not data.get("amount"):
        return jsonify({"error": "amount is required"}), 400
    if not data.get("payment_date"):
        return jsonify({"error": "payment_date is required"}), 400
    try:
        result = (
            supabase.table("checkup_payments")
            .insert(
                {
                    "checkup_id": str(checkup_id),
                    "family_member_id": data["family_member_id"],
                    "amount": float(data["amount"]),
                    "payment_method": data.get("payment_method"),
                    "payment_date": data["payment_date"],
                    "notes": data.get("notes"),
                }
            )
            .execute()
        )
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/payments/<uuid:payment_id>", methods=["PUT"])
def update_checkup_payment(payment_id):
    data = request.get_json(silent=True) or {}
    if not data.get("amount"):
        return jsonify({"error": "amount is required"}), 400
    if not data.get("payment_date"):
        return jsonify({"error": "payment_date is required"}), 400
    try:
        result = (
            supabase.table("checkup_payments")
            .update(
                {
                    "amount": float(data["amount"]),
                    "payment_method": data.get("payment_method"),
                    "payment_date": data["payment_date"],
                    "notes": data.get("notes"),
                }
            )
            .eq("id", str(payment_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Payment not found"}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@checkups_bp.route("/api/checkups/payments/<uuid:payment_id>", methods=["DELETE"])
def delete_checkup_payment(payment_id):
    try:
        result = (
            supabase.table("checkup_payments")
            .delete()
            .eq("id", str(payment_id))
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Payment not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500