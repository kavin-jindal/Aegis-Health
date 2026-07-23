import os
from flask import Blueprint, request, jsonify, Response
from db import supabase
import groq
from elevenlabs.client import ElevenLabs

assistant_bp = Blueprint("assistant", __name__)

groq_client = groq.Groq(api_key=os.getenv("GROQ_API_KEY", ""))

eleven_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", ""))


def _build_member_context(family_member_id):
    parts = []
    try:
        member = (
            supabase.table("family_members")
            .select("name, relation")
            .eq("id", family_member_id)
            .single()
            .execute()
        )
        if member.data:
            parts.append(f"Patient: {member.data['name']} ({member.data['relation']})")
    except Exception:
        pass

    try:
        res = supabase.table("doctors").select("name,specialty,clinic,phone").eq("family_member_id", family_member_id).execute()
        if res.data:
            docs = "; ".join(f"{d['name']} ({d.get('specialty','')})" for d in res.data)
            parts.append(f"Doctors: {docs}")
    except Exception:
        pass

    try:
        res = (
            supabase.table("checkups")
            .select("checkup_date,diagnosis,follow_up_date,doctors(name)")
            .eq("family_member_id", family_member_id)
            .order("checkup_date", desc=True)
            .limit(10)
            .execute()
        )
        if res.data:
            lines = []
            for c in res.data:
                doc = c.get("doctors", {})
                doc_name = doc.get("name", "") if doc else ""
                line = f"{c['checkup_date']}: {c.get('diagnosis','N/A')}"
                if doc_name:
                    line += f" (Dr. {doc_name})"
                if c.get("follow_up_date"):
                    line += f" [Follow-up: {c['follow_up_date']}]"
                lines.append(line)
            parts.append("Recent checkups (newest first):\n" + "\n".join(lines))
    except Exception:
        pass

    try:
        res = (
            supabase.table("medicines")
            .select("name,dosage,frequency,start_date,end_date")
            .eq("family_member_id", family_member_id)
            .execute()
        )
        if res.data:
            today = __import__("datetime").date.today().isoformat()
            active = [m for m in res.data if not m.get("end_date") or m["end_date"] >= today]
            if active:
                meds = "; ".join(f"{m['name']} {m.get('dosage','')} ({m.get('frequency','')})" for m in active)
                parts.append(f"Current medicines: {meds}")
    except Exception:
        pass

    try:
        res = supabase.table("emergency").select("blood_group,allergies,conditions").eq("family_member_id", family_member_id).single().execute()
        if res.data:
            d = res.data
            info_parts = []
            if d.get("blood_group"):
                info_parts.append(f"Blood: {d['blood_group']}")
            if d.get("allergies"):
                info_parts.append(f"Allergies: {d['allergies']}")
            if d.get("conditions"):
                info_parts.append(f"Conditions: {d['conditions']}")
            if info_parts:
                parts.append("Emergency info: " + "; ".join(info_parts))
    except Exception:
        pass

    try:
        today = __import__("datetime").date.today().isoformat()
        yesterday = __import__("datetime").date.today().__import__("datetime").timedelta(days=1).isoformat()
        res = supabase.table("fitness").select("log_date,steps,calories,water_ml,sleep_hours").eq("family_member_id", family_member_id).order("log_date", desc=True).limit(7).execute()
        if res.data:
            recent_logs = res.data
            today_data = next((log for log in recent_logs if log.get('log_date') == today), None)
            
            if today_data or any(log.get('log_date') in (today, yesterday) for log in recent_logs):
                parts.append("Recent fitness activity:")
                for log in recent_logs:
                    date = log.get('log_date', '')
                    parts.append(f"  {date}: {log.get('steps',0)} steps, {log.get('calories',0)} kcal, {log.get('water_ml',0)} ml water, {log.get('sleep_hours',0)} hrs sleep")
                
                if today_data:
                    parts.append(f"\nToday's fitness goals: 10000 steps, 2000 kcal, 2000 ml water, 8 hrs sleep")
    except Exception:
        pass

    return "\n\n".join(parts) if parts else "No health data available for this patient yet."


SYSTEM_PROMPT_TEMPLATE = (
    "You are Aegis, a helpful family health assistant. "
    "You answer health-related questions clearly and concisely based on the patient's health data below. "
    "You are not a doctor — always recommend consulting a healthcare professional for medical decisions. "
    "Keep responses short and practical. Reference the patient's actual data when relevant.\n\n"
    "Patient Data:\n{member_data}"
)


@assistant_bp.route("/api/assistant/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    family_member_id = data.get("family_member_id")
    user_message = (data.get("message") or "").strip()
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    if not user_message:
        return jsonify({"error": "message is required"}), 400

    try:
        supabase.table("assistant_messages").insert(
            {"family_member_id": family_member_id, "role": "user", "content": user_message}
        ).execute()
    except Exception:
        pass

    try:
        member_data = _build_member_context(family_member_id)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(member_data=member_data)

        history_result = (
            supabase.table("assistant_messages")
            .select("role, content")
            .eq("family_member_id", family_member_id)
            .order("created_at")
            .limit(20)
            .execute()
        )
        messages = [{"role": "system", "content": system_prompt}]
        for m in (history_result.data or []):
            if m["role"] in ("user", "assistant"):
                messages.append({"role": m["role"], "content": m["content"]})

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )
        assistant_text = response.choices[0].message.content
    except groq.RateLimitError:
        assistant_text = "I'm experiencing high demand right now. Please try again in a moment."
    except groq.APIConnectionError:
        assistant_text = "I can't reach the AI service right now. Please check your internet connection."
    except groq.APITimeoutError:
        assistant_text = "The AI service timed out. Please try again."
    except Exception:
        assistant_text = "Something went wrong. Please try again later."

    try:
        supabase.table("assistant_messages").insert(
            {"family_member_id": family_member_id, "role": "assistant", "content": assistant_text}
        ).execute()
    except Exception:
        pass

    return jsonify({"response": assistant_text}), 200


@assistant_bp.route("/api/assistant/speak", methods=["POST"])
def speak():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    try:
        audio = eleven_client.text_to_speech.convert(
            text=text,
            voice_id="21m00Tcm4TlvDq8ikWAM",
            model_id="eleven_monolingual_v1",
        )
        return Response(audio, mimetype="audio/mpeg", headers={"Content-Disposition": "inline"})
    except Exception as e:
        return jsonify({"error": "Voice generation failed."}), 500


@assistant_bp.route("/api/assistant/history", methods=["GET"])
def history():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("assistant_messages")
            .select("role, content, created_at")
            .eq("family_member_id", family_member_id)
            .order("created_at")
            .limit(50)
            .execute()
        )
        return jsonify(result.data or []), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@assistant_bp.route("/api/assistant/clear", methods=["DELETE"])
def clear_chat():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        supabase.table("assistant_messages").delete().eq("family_member_id", family_member_id).execute()
        return jsonify({"message": "Chat cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
